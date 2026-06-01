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
 * GET /api/public/dashboard?maquina_id=2
 * Retorna estadísticas simplificadas para la cartelera sin requerir token.
 */
router.get('/dashboard', async (req, res, next) => {
  try {
    const { maquina_id } = req.query;
    const mId = maquina_id ? Number(maquina_id) : null;
    const today = new Date().toISOString().split('T')[0];
    const month = today.slice(0, 7);

    const { pool } = require('../config/db');
    
    const [
      machines, 
      prodHoy, prodMes, 
      paradasHoy, paradasMes,
      velHoy, velMes, velSeries,
      despHoy, despMes,
      trabajosHoy,
      velHoyBreakdown,
      despHoyBreakdown
    ] = await Promise.all([
      pool.execute('SELECT id, nombre FROM maquinas WHERE empresa_id = 2 ORDER BY nombre ASC').then(([r]) => r),
      produccionRepository.getSummaryByDate(today, mId),
      produccionRepository.getSummaryByMonth(month, mId),
      paradasRepository.getSummaryByDate(today, mId),
      paradasRepository.getSummaryByMonth(month, mId),
      velocidadRepository.getResumenHoy(mId),
      velocidadRepository.getResumenMes(month, mId),
      velocidadRepository.getSeriesHoy(mId),
      desperdiciosRepository.getSummaryByDate(today, mId),
      desperdiciosRepository.getSummaryByMonth(month, mId),
      produccionRepository.getRecentTrabajos(today, mId),
      velocidadRepository.getBreakdownByMachine(today),
      desperdiciosRepository.getBreakdownByMachine(today)
    ]);

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
          produccion: prodMes, 
          paradas: paradasMes,
          velocidad: velMes,
          desperdicio: despMes,
          breakdown_velocidad: await velocidadRepository.getBreakdownByMachine(null, month),
          breakdown_desperdicio: await desperdiciosRepository.getBreakdownByMachine(null, month)
        },
        lastSync: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
