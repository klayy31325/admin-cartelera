const desperdiciosRepository = require('../repositories/desperdicios.repository');
const produccionRepository = require('../repositories/produccion.repository');
const AppError = require('../utils/AppError');
const { HTTP_STATUS } = require('../utils/constants');

class DesperdiciosService {
  async registrar(data) {
    if (!data.maquina_id) {
      throw new AppError('La máquina es obligatoria.', HTTP_STATUS.BAD_REQUEST);
    }
    
    // Validar que las cantidades no sean negativas
    if (data.cantidad_kg < 0 || data.cantidad_ml < 0) {
      throw new AppError('Las cantidades no pueden ser negativas.', HTTP_STATUS.BAD_REQUEST);
    }

    return await desperdiciosRepository.create(data);
  }

  async getAllByEmpresa(empresaNombre) {
    if (!empresaNombre) throw new AppError('Empresa no definida.', HTTP_STATUS.BAD_REQUEST);
    const empresa_id = await produccionRepository.getEmpresaId(empresaNombre);
    return await desperdiciosRepository.findAllByEmpresa(empresa_id);
  }
}

module.exports = new DesperdiciosService();
