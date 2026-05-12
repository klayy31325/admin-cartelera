// ============================================================
// routes/public.routes.js — Endpoints públicos para Cartelera
// ============================================================
const express = require('express');
const router = express.Router();
const produccionRepository = require('../repositories/produccion.repository');
const paradasRepository = require('../repositories/paradas.repository');
const desperdiciosRepository = require('../repositories/desperdicios.repository');
const informacionRepository = require('../repositories/informacion.repository');

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
 * GET /api/public/dashboard/:maquina
 * Retorna estadísticas simplificadas para la cartelera sin requerir token.
 */
router.get('/dashboard/:maquina', async (req, res, next) => {
  try {
    const { maquina } = req.params;
    const maquina_id = produccionRepository.getMaquinaId(maquina);
    
    // Obtener todos los registros de esta máquina
    // En un sistema real, filtraríamos por la fecha de hoy
    const registros = await produccionRepository.findAllByMaquina(maquina_id);
    
    // Calcular total de metros hoy (simulado: sumamos todos los de la lista por ahora)
    const totalMetrosHoy = registros.reduce((acc, reg) => acc + Number(reg.metros), 0);
    
    // Tomar las últimas 5 órdenes
    const ultimasOrdenes = registros.slice(0, 5).map(reg => ({
      id: reg.id,
      cliente: reg.cliente,
      producto: reg.producto,
      metros: reg.metros,
      status: reg.status_orden,
      hora: new Date(reg.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    // Obtener paradas activas
    let paradaActiva = null;
    let paradasRecientes = [];
    try {
      paradaActiva = await paradasRepository.findActiveByMaquina(maquina_id);
    } catch (e) { console.error('Error fetching active stops:', e.message); }
    
    // Obtener desperdicio acumulado
    let desperdicioMaquina = 0;
    try {
      const empresa_id = maquina_id === 1 ? 1 : 2; 
      const todosDesperdicios = await desperdiciosRepository.findAllByEmpresa(empresa_id);
      desperdicioMaquina = todosDesperdicios
        .filter(d => d.maquina_id === maquina_id)
        .reduce((acc, d) => acc + Number(d.cantidad_kg), 0);
    } catch (e) { console.error('Error fetching waste data:', e.message); }

    // Obtener historial de paradas recientes
    try {
      const empresa_id = maquina_id === 1 ? 1 : 2; 
      const todasParadas = await paradasRepository.findAll(empresa_id);
      paradasRecientes = todasParadas
        .filter(p => p.maquina_id === maquina_id)
        .slice(0, 5)
        .map(p => ({
          id: p.id,
          motivo: p.motivo_nombre,
          tipo: p.motivo_tipo,
          inicio: new Date(p.fecha_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          duracion: p.fecha_fin ? Math.round((new Date(p.fecha_fin) - new Date(p.fecha_inicio)) / 60000) : null
        }));
    } catch (e) { console.error('Error fetching recent stops:', e.message); }

    res.json({
      success: true,
      data: {
        machine: maquina.toUpperCase(),
        metrics: {
          producedMeters: totalMetrosHoy,
          goal: 15000,
          wasteKg: desperdicioMaquina,
          efficiency: paradaActiva ? 0 : 85.5, // Si hay parada, eficiencia 0 o baja
          activeStop: paradaActiva ? {
            motivo: paradaActiva.motivo_nombre,
            desde: new Date(paradaActiva.fecha_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          } : null
        },
        recentOrders: ultimasOrdenes,
        recentStops: paradasRecientes,
        lastSync: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
