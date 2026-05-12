// ============================================================
// services/auth.service.js — Lógica de negocio de Autenticación
// ============================================================
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const usuariosRepository = require('../repositories/usuarios.repository');
const AppError = require('../utils/AppError');
const { HTTP_STATUS } = require('../utils/constants');

class AuthService {
  /**
   * Autentica un usuario con correo y contraseña.
   * Retorna un JWT con los datos del usuario (sin password).
   * @param {string} correo
   * @param {string} password
   * @returns {Promise<{ token: string, usuario: Object }>}
   */
  async login(correo, password) {
    // ── Validar campos ──
    if (!correo || !password) {
      throw new AppError('Correo y contraseña son obligatorios.', HTTP_STATUS.BAD_REQUEST);
    }

    // ── Buscar usuario por correo ──
    const usuario = await usuariosRepository.findByCorreo(correo.toLowerCase().trim());
    if (!usuario) {
      throw new AppError('Credenciales incorrectas.', HTTP_STATUS.UNAUTHORIZED);
    }

    // ── Comparar contraseña con el hash ──
    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      throw new AppError('Credenciales incorrectas.', HTTP_STATUS.UNAUTHORIZED);
    }

    // ── Generar JWT (sin incluir password) ──
    const payload = {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.correo,
      empresa: usuario.empresa,
      departamento: usuario.departamento,
      rol: usuario.rol,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    });

    return { token, usuario: payload };
  }
}

module.exports = new AuthService();
