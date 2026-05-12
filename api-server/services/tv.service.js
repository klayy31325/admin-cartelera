// ============================================================
// services/tv.service.js — Lógica de negocio de TVs
// ============================================================
const tvRepository = require('../repositories/tv.repository');
const produccionRepository = require('../repositories/produccion.repository');
const usuariosRepository = require('../repositories/usuarios.repository');
const AppError = require('../utils/AppError');
const { HTTP_STATUS } = require('../utils/constants');

class TvService {
  async getEmpresaId(empresaNombre) {
    if (!empresaNombre) throw new AppError('Empresa no definida en el token.', HTTP_STATUS.BAD_REQUEST);
    return await produccionRepository.getEmpresaId(empresaNombre);
  }

  async getAll(empresaNombre) {
    const empresa_id = await this.getEmpresaId(empresaNombre);
    return await tvRepository.findAll(empresa_id);
  }

  async getById(id, empresaNombre) {
    const empresa_id = await this.getEmpresaId(empresaNombre);
    const tv = await tvRepository.findById(id, empresa_id);
    if (!tv) {
      throw new AppError('TV no encontrada.', HTTP_STATUS.NOT_FOUND);
    }
    return tv;
  }

  async create(data, empresaNombre) {
    const empresa_id = await this.getEmpresaId(empresaNombre);

    if (!data.departamento) {
      throw new AppError('El departamento es obligatorio.', HTTP_STATUS.BAD_REQUEST);
    }

    const departamento_id = await usuariosRepository.findOrCreateDepartamento(data.departamento);

    if (data.ip_address) {
      const existeTv = await tvRepository.findByIp(data.ip_address, empresa_id);
      if (existeTv) {
        throw new AppError('Ya existe una TV registrada con esa dirección IP.', HTTP_STATUS.CONFLICT);
      }
    }

    return await tvRepository.create({ ...data, empresa_id, departamento_id });
  }

  async update(id, data, empresaNombre) {
    const empresa_id = await this.getEmpresaId(empresaNombre);

    const tvActual = await this.getById(id, empresaNombre);

    if (data.ip_address && data.ip_address !== tvActual.ip_address) {
      const existeTv = await tvRepository.findByIp(data.ip_address, empresa_id);
      if (existeTv) {
        throw new AppError('La nueva dirección IP ya está en uso por otra TV.', HTTP_STATUS.CONFLICT);
      }
    }

    if (data.departamento) {
      data.departamento_id = await usuariosRepository.findOrCreateDepartamento(data.departamento);
    }

    await tvRepository.update(id, { ...data, empresa_id });
    const tvActualizada = await this.getById(id, empresaNombre);

    // Notificar a la TV vía Socket si está conectada
    const { notifyTvUpdate } = require('../socket');
    notifyTvUpdate(tvActualizada.uid, {
      maquina_id: tvActualizada.maquina_id,
      maquina_nombre: tvActualizada.maquina_nombre
    });

    return tvActualizada;
  }

  async delete(id, empresaNombre) {
    const empresa_id = await this.getEmpresaId(empresaNombre);
    await this.getById(id, empresaNombre); // Valida existencia
    return await tvRepository.delete(id, empresa_id);
  }
}

module.exports = new TvService();
