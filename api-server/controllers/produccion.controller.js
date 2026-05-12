// ============================================================
// controllers/produccion.controller.js
// ============================================================
const produccionService = require('../services/produccion.service');
const { HTTP_STATUS } = require('../utils/constants');
const { getIO } = require('../socket');

class ProduccionController {
  async getAll(req, res, next) {
    try {
      const empresa = req.user?.empresa;
      const registros = await produccionService.getAll(empresa);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Registros de producción obtenidos exitosamente.',
        data: registros
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const empresa = req.user?.empresa;
      const registro = await produccionService.getById(req.params.id, empresa);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: registro
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const empresa = req.user?.empresa;
      const data = { ...req.body, empresa };
      const nuevoRegistro = await produccionService.create(data, empresa);
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Registro de producción creado exitosamente.',
        data: nuevoRegistro
      });

      // Emitir update en tiempo real
      try {
        const summary = await produccionService.getSummaryByDate(null);
        getIO().emit('production-update', summary);
      } catch (_) { /* no bloquear la respuesta si WS falla */ }
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const empresa = req.user?.empresa;
      const data = { ...req.body, empresa };
      const registroActualizado = await produccionService.update(req.params.id, data, empresa);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Registro actualizado exitosamente.',
        data: registroActualizado
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const empresa = req.user?.empresa;
      await produccionService.delete(req.params.id, empresa);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Registro eliminado exitosamente.'
      });
    } catch (error) {
      next(error);
    }
  }

  async getSummaryToday(req, res, next) {
    try {
      const { fecha, maquina_id } = req.query;
      const summary = await produccionService.getSummaryByDate(fecha, maquina_id);
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
      const summary = await produccionService.getSummaryByMonth(mes, maquina_id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: summary
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProduccionController();
