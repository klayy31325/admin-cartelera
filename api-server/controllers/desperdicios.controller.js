const desperdiciosService = require('../services/desperdicios.service');
const { HTTP_STATUS } = require('../utils/constants');

class DesperdiciosController {
  async registrar(req, res, next) {
    try {
      const nuevoRegistro = await desperdiciosService.registrar(req.body);
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Desperdicio registrado exitosamente.',
        data: nuevoRegistro
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const empresa = req.user?.empresa;
      const registros = await desperdiciosService.getAllByEmpresa(empresa);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: registros
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DesperdiciosController();
