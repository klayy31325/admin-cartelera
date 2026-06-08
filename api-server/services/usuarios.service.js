// ============================================================
// services/usuarios.service.js — Lógica de negocio de Usuarios
// ============================================================
const bcrypt = require('bcryptjs');
const usuariosRepository = require('../repositories/usuarios.repository');
const produccionRepository = require('../repositories/produccion.repository');
const AppError = require('../utils/AppError');
const { SALT_ROUNDS, HTTP_STATUS } = require('../utils/constants');

class UsuariosService {
  /**
   * Obtiene todos los usuarios.
   */
  async getAll() {
    return await usuariosRepository.findAll();
  }

  /**
   * Obtiene un usuario por ID.
   * @param {number} id
   */
  async getById(id) {
    const usuario = await usuariosRepository.findById(id);
    if (!usuario) {
      throw new AppError('Usuario no encontrado.', HTTP_STATUS.NOT_FOUND);
    }
    return usuario;
  }

  /**
   * Registra un nuevo usuario con validación y encriptación de contraseña.
   * @param {Object} userData
   */
  async create(userData) {
    const { nombre, apellido, correo, password, empresa, departamento, rol } = userData;

    // ── Validación de campos obligatorios ──
    if (!nombre || !apellido || !correo || !password) {
      throw new AppError(
        'Los campos nombre, apellido, correo y password son obligatorios.',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // ── Validar que la empresa sea válida ──
    const empresasValidas = ['MORROCEL C.A', 'CUREX C.A'];
    if (!empresa || !empresasValidas.includes(empresa.trim())) {
      throw new AppError('La empresa seleccionada no es válida. Solo MORROCEL C.A y CUREX C.A están disponibles.', HTTP_STATUS.BAD_REQUEST);
    }

    // ── Validar formato de correo ──
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      throw new AppError('El formato del correo electrónico no es válido.', HTTP_STATUS.BAD_REQUEST);
    }

    // ── Validar longitud de contraseña ──
    if (password.length < 6) {
      throw new AppError('La contraseña debe tener al menos 6 caracteres.', HTTP_STATUS.BAD_REQUEST);
    }

    // ── Verificar que el correo no esté registrado ──
    const existente = await usuariosRepository.findByCorreo(correo);
    if (existente) {
      throw new AppError('Ya existe un usuario registrado con ese correo.', HTTP_STATUS.CONFLICT);
    }

    // ── Resolver IDs (3FN) ──
    // Si no se pasa rol, se asigna 'visor' como default seguro
    const rolFinal = rol || 'visor';
    const empresa_id      = await produccionRepository.getEmpresaId(empresa);
    const departamento_id = await usuariosRepository.findOrCreateDepartamento(departamento);
    const rol_id          = await usuariosRepository.getRolId(rolFinal);

    // ── Encriptar contraseña con bcryptjs ──
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // ── Crear usuario en la BD ──
    const nuevoUsuario = await usuariosRepository.create({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      correo: correo.toLowerCase().trim(),
      password: hashedPassword,
      empresa_id,
      departamento_id,
      rol_id
    });

    return { ...nuevoUsuario, empresa: empresa.trim(), departamento: departamento || 'GENERAL', rol: rolFinal };
  }

  /**
   * Actualiza los datos de un usuario (sin contraseña).
   * @param {number} id
   * @param {Object} userData
   */
  async update(id, userData) {
    // Verificar que existe
    await this.getById(id);

    // Si cambia el correo, verificar que no esté en uso por otro
    if (userData.correo) {
      const existente = await usuariosRepository.findByCorreo(userData.correo);
      if (existente && existente.id !== id) {
        throw new AppError('Ese correo ya está en uso por otro usuario.', HTTP_STATUS.CONFLICT);
      }
    }

    // Si cambia la empresa, resolver el nuevo ID
    if (userData.empresa) {
      const empresasValidas = ['MORROCEL C.A', 'CUREX C.A'];
      if (!empresasValidas.includes(userData.empresa.trim())) {
        throw new AppError('Empresa no válida.', HTTP_STATUS.BAD_REQUEST);
      }
      userData.empresa_id = await produccionRepository.getEmpresaId(userData.empresa);
    }

    // ── Resolver IDs si vienen como texto (3FN) ──
    if (userData.departamento) {
      userData.departamento_id = await usuariosRepository.findOrCreateDepartamento(userData.departamento);
    }
    if (userData.rol) {
      userData.rol_id = await usuariosRepository.getRolId(userData.rol);
    }

    return await usuariosRepository.update(id, userData);
  }

  /**
   * Elimina un usuario.
   * @param {number} id
   */
  async delete(id) {
    await this.getById(id);
    return await usuariosRepository.delete(id);
  }
}

module.exports = new UsuariosService();
