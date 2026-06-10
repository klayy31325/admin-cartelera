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
const resumenExcelRepository = require('../repositories/resumen_excel.repository');

const MOTIVOS_PARADA = [
  { id: 1, nombre: 'PREPARACION' },
  { id: 2, nombre: 'PRE-PRENSA' },
  { id: 3, nombre: 'COLORIMETRIA' },
  { id: 4, nombre: 'CALIDAD' },
  { id: 5, nombre: 'MANTENIMIENTO' },
  { id: 6, nombre: 'LIMPIEZA GENERAL DE MAQUINA' },
  { id: 7, nombre: 'PLANIFICACION' },
  { id: 8, nombre: 'LIMPIEZA DE PLANCHA' },
  { id: 9, nombre: 'LIMPIEZA DE RODILLO' },
  { id: 10, nombre: 'LIMPIEZA DE TAMBOR CENTRAL' },
  { id: 11, nombre: 'PRODUCCION' },
  { id: 12, nombre: 'PRUEBAS' },
  { id: 13, nombre: 'LOGISTICA' },
  { id: 14, nombre: 'FALLAS ELECTRICAS' },
  { id: 15, nombre: 'APROBACIONES' },
  { id: 16, nombre: 'ESTANDAR DE COLOR' },
  { id: 17, nombre: 'RRHH' },
  { id: 18, nombre: 'FALTA DE INSUMO / PEDIDO' },
];

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

    // Obtener totales del Excel (resumen_excel) para el mes activo
    // y reemplazar los valores mensuales con los totales exactos
    let resumenExcelData = null;
    if (mId) {
      resumenExcelData = await resumenExcelRepository.findByMaquinaYMes(mId, dataMonth);
    } else {
      const todosResumen = await resumenExcelRepository.findUltimos(1);
      resumenExcelData = todosResumen;
    }

    if (resumenExcelData) {
      const overrideList = Array.isArray(resumenExcelData) ? resumenExcelData : [resumenExcelData];
      overrideList.forEach(ex => {
        const mid = Number(ex.maquina_id);
        // Override produccion mensual con valores del Excel
        if (monthlyData.produccion) {
          const prodEntry = monthlyData.produccion.find(p => Number(p.maquina_id) === mid);
          if (prodEntry) {
            prodEntry.total_metros = Number(ex.metros_ml);
            prodEntry.total_minutos = Number(ex.tiempo_total_min);
          }
        }
        // Override velocidad mensual con promedios del Excel
        if (monthlyData.velocidad) {
          monthlyData.velocidad.promedio_real = Number(ex.vel_real_avg);
          monthlyData.velocidad.promedio_teorica = Number(ex.vel_teorica_avg);
        }
        // Override breakdown_velocidad mensual
        if (monthlyData.breakdown_velocidad) {
          const velBd = monthlyData.breakdown_velocidad.find(d => Number(d.maquina_id) === mid);
          if (velBd) {
            velBd.avg_real = Number(ex.vel_real_avg);
            velBd.avg_teorica = Number(ex.vel_teorica_avg);
          }
        }
        // Override desperdicio mensual
        if (monthlyData.desperdicio && monthlyData.desperdicio.total_kg !== undefined) {
          monthlyData.desperdicio.total_kg = Number(ex.desperdicio_kg);
          monthlyData.desperdicio.total_ml = Number(ex.desperdicio_ml);
          monthlyData.desperdicio.pct_kg_total = Number(ex.desperdicio_pct_kg);
          monthlyData.desperdicio.total_produccion_kg = Number(ex.produccion_kg);
        }
        // Override breakdown_desperdicio mensual
        if (monthlyData.breakdown_desperdicio) {
          const despBd = monthlyData.breakdown_desperdicio.find(d => Number(d.maquina_id) === mid);
          if (despBd) {
            despBd.total_kg = Number(ex.desperdicio_kg);
            despBd.total_ml = Number(ex.desperdicio_ml);
            despBd.pct_kg_total = Number(ex.desperdicio_pct_kg);
            despBd.total_produccion_kg = Number(ex.produccion_kg);
          }
        }
        // Override paradas mensual con desglose del Excel (18 motivos)
        if (monthlyData.paradas) {
          const paradasExcel = [];
          let hasParadas = false;
          for (const m of MOTIVOS_PARADA) {
            const colName = 'parada_' + m.id + '_min';
            const minutos = Number(ex[colName]) || 0;
            if (minutos > 0) hasParadas = true;
            paradasExcel.push({
              maquina_id: mid,
              maquina_nombre: null,
              motivo_nombre: m.nombre,
              total_minutos: minutos,
            });
          }
          // Solo reemplazar si hay datos reales en el Excel
          if (hasParadas) {
            // Reemplazar las paradas de esta máquina
            const otrasMaquinas = monthlyData.paradas.filter(p => Number(p.maquina_id) !== mid);
            monthlyData.paradas = [...otrasMaquinas, ...paradasExcel];
          }
        }
      });
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
        resumen_excel: resumenExcelData,
        lastSync: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/public/resumen-excel?maquina_id=1&mes=2026-05
 * Retorna los totales pre-calculados desde el Excel.
 */
router.get('/resumen-excel', async (req, res, next) => {
  try {
    const { maquina_id, mes } = req.query;
    const targetMes = mes || new Date().toISOString().slice(0, 7);

    if (maquina_id) {
      const data = await resumenExcelRepository.findByMaquinaYMes(Number(maquina_id), targetMes);
      return res.json({ success: true, data: data || null });
    }

    const data = await resumenExcelRepository.findUltimos(2);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
