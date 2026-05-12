// ============================================================
// controllers/paradas.controller.js
// ============================================================
const paradasService = require('../services/paradas.service');
const { HTTP_STATUS } = require('../utils/constants');
const { getIO } = require('../socket');

class ParadasController {
  async getAll(req, res, next) {
    try {
      const empresa = req.user?.empresa;
      const registros = await paradasService.getAllByEmpresa(empresa);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: registros
      });
    } catch (error) {
      next(error);
    }
  }

  async getMotivos(req, res, next) {
    try {
      const motivos = await paradasService.getMotivos();
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: motivos
      });
    } catch (error) {
      next(error);
    }
  }

  async registrarInicio(req, res, next) {
    try {
      const parada = await paradasService.registrarInicio(req.body);
      res.status(HTTP_STATUS.CREATED).json({ success: true, data: parada });

      // Emitir update en tiempo real
      try {
        const summary = await paradasService.getSummaryByDate(null);
        getIO().emit('parada-update', summary);
      } catch (_) { /* no bloquear la respuesta si WS falla */ }
    } catch (error) {
      next(error);
    }
  }

  async finalizarParada(req, res, next) {
    try {
      const { id } = req.params;
      const result = await paradasService.finalizarParada(id);
      res.status(HTTP_STATUS.OK).json({ success: true, message: result.message });

      // Emitir update en tiempo real
      try {
        const summary = await paradasService.getSummaryByDate(null);
        getIO().emit('parada-update', summary);
      } catch (_) { /* no bloquear la respuesta si WS falla */ }
    } catch (error) {
      next(error);
    }
  }

  async getSummaryToday(req, res, next) {
    try {
      const { fecha, maquina_id } = req.query;
      const summary = await paradasService.getSummaryByDate(fecha, maquina_id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: summary
      });
    } catch (error) {
      next(error);
    }
  }

  async getSummaryMonth(req, res, next) {
    try {
      const { mes, maquina_id } = req.query; // YYYY-MM
      const summary = await paradasService.getSummaryByMonth(mes, maquina_id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: summary
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ParadasController();
