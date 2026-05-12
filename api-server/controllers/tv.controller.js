// ============================================================
// controllers/tv.controller.js
// ============================================================
const tvService = require('../services/tv.service');
const { HTTP_STATUS } = require('../utils/constants');

class TvController {
  async getAll(req, res, next) {
    try {
      const empresa = req.user?.empresa;
      const tvs = await tvService.getAll(empresa);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Lista de TVs obtenida exitosamente.',
        data: tvs
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const empresa = req.user?.empresa;
      const tv = await tvService.getById(req.params.id, empresa);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: tv
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const empresa = req.user?.empresa;
      const data = { ...req.body, empresa };

      const nuevaTv = await tvService.create(data, empresa);
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'TV registrada exitosamente.',
        data: nuevaTv
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const empresa = req.user?.empresa;
      const data = { ...req.body, empresa };

      const tvActualizada = await tvService.update(req.params.id, data, empresa);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'TV actualizada exitosamente.',
        data: tvActualizada
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const empresa = req.user?.empresa;
      await tvService.delete(req.params.id, empresa);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'TV eliminada exitosamente.'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TvController();
