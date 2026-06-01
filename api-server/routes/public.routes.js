// ============================================================
// routes/public.routes.js — Endpoints públicos para Cartelera
// ============================================================
const express = require('express');
const router = express.Router();
const produccionRepository = require('../repositories/produccion.repository');
const paradasRepository = require('../repositories/paradas.repository');
const informacionRepository = require('../repositories/informacion.repository');
const velocidadRepository = require('../repositories/velocidad.repository');
const desperdiciosRepository = require('../repositories/desperdicios.repository');
const produccionInformativaRepository = require('../repositories/produccion_informativa.repository');

/**
 * GET /api/public/maquinas
 * Retorna lista de máquinas disponibles.
 */
router.get('/maquinas', async (req, res, next) => {
  try {
    const { pool } = require('../config/db');
    const [rows] = await pool.execute('SELECT id, nombre FROM maquinas WHERE empresa_id = 2 ORDER BY nombre ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/public/informacion
 * Retorna avisos activos para la cartelera.
 */
router.get('/informacion', async (req, res, next) => {
  try {
    const infos = await informacionRepository.findAllActive(2); // CUREX default
    res.json({ success: true, data: infos });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/public/produccion-informativa
 * Retorna tareas de producción para la cartelera.
 */
router.get('/produccion-informativa', async (req, res, next) => {
  try {
    const { maquina_id } = req.query;
    let data;
    if (maquina_id) {
      data = await produccionInformativaRepository.findByMaquina(Number(maquina_id), 2);
    } else {
      data = await produccionInformativaRepository.findAll(2);
    }
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

/**
 * Calcula el mes anterior en formato YYYY-MM
 */
function getPreviousMonth(monthStr) {
  const [y, m] = monthStr.split('-').map(Number);
  const d = new Date(y, m - 2, 1); // m-1 es el mes actual (0-indexed), m-2 es el anterior
  return d.toISOString().slice(0, 7);
}

/**
 * Obtiene datos mensuales agregados para un mes dado
 */
async function fetchMonthlyData(month, mId) {
  const [prodMes, paradasMes, velMes, despMes, velBreakdown, despBreakdown] = await Promise.all([
    produccionRepository.getSummaryByMonth(month, mId),
    paradasRepository.getSummaryByMonth(month, mId),
    velocidadRepository.getResumenMes(month, mId),
    desperdiciosRepository.getSummaryByMonth(month, mId),
    velocidadRepository.getBreakdownByMachine(null, month),
    desperdiciosRepository.getBreakdownByMachine(null, month)
  ]);

  return {
    produccion: prodMes,
    paradas: paradasMes,
    velocidad: velMes,
    desperdicio: despMes,
    breakdown_velocidad: velBreakdown,
    breakdown_desperdicio: despBreakdown
  };
}

/**
 * Verifica si los datos mensuales están vacíos
 * (sin metros producidos Y sin registros de velocidad)
 */
function isMonthlyDataEmpty(monthlyData) {
  const totalMetros = (monthlyData.produccion || [])
    .reduce((sum, row) => sum + Number(row.total_metros || 0), 0);
  const velRegistros = Number(monthlyData.velocidad?.registros || 0);
  return totalMetros === 0 && velRegistros === 0;
}

/**
 * GET /api/public/dashboard?maquina_id=2
 * Retorna estadísticas simplificadas para la cartelera sin requerir token.
 * Si el mes actual no tiene datos, usa automáticamente el mes anterior (fallback).
 */
router.get('/dashboard', async (req, res, next) => {
  try {
    const { maquina_id } = req.query;
    const mId = maquina_id ? Number(maquina_id) : null;
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.slice(0, 7);

    const { pool } = require('../config/db');
    
    // Fetch datos diarios + máquinas (siempre del día actual)
    const [
      machines,
      prodHoy,
      paradasHoy,
      velHoy, velSeries,
      despHoy,
      trabajosHoy,
      velHoyBreakdown,
      despHoyBreakdown
    ] = await Promise.all([
      pool.execute('SELECT id, nombre FROM maquinas WHERE empresa_id = 2 ORDER BY nombre ASC').then(([r]) => r),
      produccionRepository.getSummaryByDate(today, mId),
      paradasRepository.getSummaryByDate(today, mId),
      velocidadRepository.getResumenHoy(mId),
      velocidadRepository.getSeriesHoy(mId),
      desperdiciosRepository.getSummaryByDate(today, mId),
      produccionRepository.getRecentTrabajos(today, mId),
      velocidadRepository.getBreakdownByMachine(today),
      desperdiciosRepository.getBreakdownByMachine(today)
    ]);

    // Datos mensuales con fallback automático al mes anterior
    let monthlyData = await fetchMonthlyData(currentMonth, mId);
    let dataMonth = currentMonth;
    let fallbackMonth = null;

    if (isMonthlyDataEmpty(monthlyData)) {
      const prevMonth = getPreviousMonth(currentMonth);
      const prevData = await fetchMonthlyData(prevMonth, mId);
      
      if (!isMonthlyDataEmpty(prevData)) {
        monthlyData = prevData;
        dataMonth = prevMonth;
        fallbackMonth = prevMonth;
        console.log(`[Dashboard] Fallback mensual activado: ${currentMonth} → ${prevMonth}`);
      }
    }

    res.json({
      success: true,
      data: {
        machines,
        daily: { 
          produccion: prodHoy, 
          paradas: paradasHoy,
          velocidad: { ...velHoy, series: velSeries },
          desperdicio: despHoy,
          trabajos: trabajosHoy,
          breakdown_velocidad: velHoyBreakdown,
          breakdown_desperdicio: despHoyBreakdown
        },
        monthly: {
          ...monthlyData,
          _dataMonth: dataMonth,
          _fallbackMonth: fallbackMonth
        },
        lastSync: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
