// ============================================================
// services/velocidad.service.js
// ============================================================
const velocidadRepository = require('../repositories/velocidad.repository');
const produccionRepository = require('../repositories/produccion.repository');
const AppError = require('../utils/AppError');
const { HTTP_STATUS } = require('../utils/constants');

class VelocidadService {
  async getAll(filters) {
    return await velocidadRepository.findAll(filters);
  }

  async getResumenHoy(maquina_id) {
    if (!maquina_id) throw new AppError('maquina_id requerido.', HTTP_STATUS.BAD_REQUEST);
    return await velocidadRepository.getResumenHoy(maquina_id);
  }

  async getSeriesHoy(maquina_id) {
    if (!maquina_id) throw new AppError('maquina_id requerido.', HTTP_STATUS.BAD_REQUEST);
    return await velocidadRepository.getSeriesHoy(maquina_id);
  }

  async registrar(data) {
    if (!data.maquina_id) throw new AppError('La máquina es obligatoria.', HTTP_STATUS.BAD_REQUEST);
    if (!data.fecha) throw new AppError('La fecha es obligatoria.', HTTP_STATUS.BAD_REQUEST);
    if (data.velocidad_teorica_mlmin < 0 || data.velocidad_real_mlmin < 0) {
      throw new AppError('Las velocidades no pueden ser negativas.', HTTP_STATUS.BAD_REQUEST);
    }
    return await velocidadRepository.create(data);
  }
}

module.exports = new VelocidadService();
