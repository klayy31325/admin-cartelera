// ============================================================
// controllers/velocidad.controller.js
// ============================================================
const velocidadService = require('../services/velocidad.service');
const { HTTP_STATUS } = require('../utils/constants');
const { getIO } = require('../socket');

class VelocidadController {
  async getAll(req, res, next) {
    try {
      const { maquina_id, fecha_inicio, fecha_fin } = req.query;
      const data = await velocidadService.getAll({ maquina_id, fecha_inicio, fecha_fin });
      res.status(HTTP_STATUS.OK).json({ success: true, data });
    } catch (error) { next(error); }
  }

  async getResumenHoy(req, res, next) {
    try {
      const { maquina_id } = req.query;
      const data = await velocidadService.getResumenHoy(maquina_id);
      res.status(HTTP_STATUS.OK).json({ success: true, data });
    } catch (error) { next(error); }
  }

  async getSeriesHoy(req, res, next) {
    try {
      const { maquina_id } = req.query;
      const data = await velocidadService.getSeriesHoy(maquina_id);
      res.status(HTTP_STATUS.OK).json({ success: true, data });
    } catch (error) { next(error); }
  }

  async registrar(req, res, next) {
    try {
      const data = await velocidadService.registrar(req.body);
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Velocidad registrada exitosamente.',
        data
      });

      // Emitir update en tiempo real
      try {
        getIO().emit('velocidad-update', data);
      } catch (_) { /* no bloquear la respuesta */ }
    } catch (error) { next(error); }
  }
}

module.exports = new VelocidadController();
