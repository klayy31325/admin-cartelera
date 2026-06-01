// ============================================================
// services/produccion.service.js — Lógica de negocio de Producción (Compatibilidad)
// ============================================================
const produccionRepository = require('../repositories/produccion.repository');
const trabajosRepository = require('../repositories/trabajos.repository');
const AppError = require('../utils/AppError');
const { HTTP_STATUS } = require('../utils/constants');

class ProduccionService {
  async getEmpresaId(empresaNombre) {
    if (!empresaNombre) throw new AppError('Empresa no definida en el token.', HTTP_STATUS.BAD_REQUEST);
    return await produccionRepository.getEmpresaId(empresaNombre);
  }

  async getAll(empresaNombre) {
    const empresa_id = await this.getEmpresaId(empresaNombre);
    return await produccionRepository.findAll(empresa_id);
  }

  async getById(id) {
    const registro = await produccionRepository.findById(id);
    if (!registro) {
      throw new AppError('Registro de producción no encontrado.', HTTP_STATUS.NOT_FOUND);
    }
    return registro;
  }

  async create(data, empresaNombre) {
    if (!data.cliente || !data.producto || data.metros === undefined || !data.maquina_nombre || !data.fecha) {
      throw new AppError('Faltan campos obligatorios para el registro de producción.', HTTP_STATUS.BAD_REQUEST);
    }

    const empresa_id = await this.getEmpresaId(empresaNombre);

    // Resolver IDs dinámicamente usando los nuevos métodos del repositorio de producción
    const cliente_id = await produccionRepository.findOrCreateCliente(empresa_id, data.cliente);
    const producto_id = await produccionRepository.findOrCreateProducto(cliente_id, data.producto);
    const maquina_id = await produccionRepository.findOrCreateMaquina(empresa_id, data.maquina_nombre);
    const estado_id = await produccionRepository.findOrCreateEstado(data.status_orden || 'PRODUCCION');

    const insertData = {
      cliente_id,
      producto_id,
      maquina_id,
      metros_producidos: data.metros,
      fecha: data.fecha,
      estado_id,
      numero_pedido: `MANUAL-${Date.now()}`
    };

    return await produccionRepository.create(insertData);
  }

  async update(id, data, empresaNombre) {
    await this.getById(id);
    const empresa_id = await this.getEmpresaId(empresaNombre);

    const cliente_id = await produccionRepository.findOrCreateCliente(empresa_id, data.cliente);
    const producto_id = await produccionRepository.findOrCreateProducto(cliente_id, data.producto);
    const maquina_id = await produccionRepository.findOrCreateMaquina(empresa_id, data.maquina_nombre);
    const estado_id = await produccionRepository.findOrCreateEstado(data.status_orden || 'PRODUCCION');

    await produccionRepository.delete(id);
    return await produccionRepository.create({
      cliente_id,
      producto_id,
      maquina_id,
      metros_producidos: data.metros,
      fecha: data.fecha,
      estado_id,
      numero_pedido: `MANUAL-${Date.now()}`
    });
  }

  async delete(id) {
    await this.getById(id);
    return await produccionRepository.delete(id);
  }

  async getSummaryByDate(fecha, maquina_id = null) {
    return await produccionRepository.getSummaryByDate(fecha, maquina_id);
  }

  async getSummaryByMonth(mes, maquina_id = null) {
    return await produccionRepository.getSummaryByMonth(mes, maquina_id);
  }
}

module.exports = new ProduccionService();
