// ============================================================
// services/paradas.service.js — Lógica de negocio para paradas de máquina
// ============================================================
const paradasRepository = require('../repositories/paradas.repository');
const produccionRepository = require('../repositories/produccion.repository');
const AppError = require('../utils/AppError');
const { HTTP_STATUS } = require('../utils/constants');

class ParadasService {
  async getEmpresaId(empresaNombre) {
    if (!empresaNombre) throw new AppError('Empresa no definida en el token.', HTTP_STATUS.BAD_REQUEST);
    return await produccionRepository.getEmpresaId(empresaNombre);
  }

  async getMotivos() {
    return await paradasRepository.getMotivos();
  }

  async registrarInicio(data) {
    if (!data.trabajo_id || !data.motivo_id) {
      throw new AppError('Trabajo y Motivo son obligatorios.', HTTP_STATUS.BAD_REQUEST);
    }

    const conn = await pool.getConnection();
    try {
      await paradasRepository.upsertParadaTrabajo(conn, data.trabajo_id, data.motivo_id, data.minutos || 0);
      return { success: true, message: 'Parada registrada/actualizada.' };
    } finally {
      conn.release();
    }
  }

  async finalizarParada(id) {
    // En el nuevo esquema de minutos totales, "finalizar" no aplica igual que en tiempo real.
    // Podríamos usarlo para marcar un estado, pero por ahora lanzamos un mensaje de compatibilidad.
    throw new AppError('El método finalizarParada no es compatible con el esquema de minutos totales. Use actualización de trabajo.', HTTP_STATUS.BAD_REQUEST);
  }

  async getAllByEmpresa(empresaNombre) {
    const empresa_id = await this.getEmpresaId(empresaNombre);
    return await paradasRepository.findAll(empresa_id);
  }

  async getSummaryByDate(fecha, maquina_id = null) {
    return await paradasRepository.getSummaryByDate(fecha, maquina_id);
  }

  async getSummaryByMonth(mes, maquina_id = null) {
    return await paradasRepository.getSummaryByMonth(mes, maquina_id);
  }
}

module.exports = new ParadasService();
