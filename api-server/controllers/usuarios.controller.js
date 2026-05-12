// ============================================================
// controllers/usuarios.controller.js — Entrada/Salida HTTP
// ============================================================
const usuariosService = require('../services/usuarios.service');
const { HTTP_STATUS } = require('../utils/constants');

class UsuariosController {
  /**
   * GET /api/usuarios
   */
  async getAll(req, res, next) {
    try {
      const usuarios = await usuariosService.getAll();
      res.status(HTTP_STATUS.OK).json({
        success: true,
        count: usuarios.length,
        data: usuarios,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/usuarios/:id
   */
  async getById(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const usuario = await usuariosService.getById(id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: usuario,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/usuarios
   * Registra un nuevo usuario con validación y encriptación.
   */
  async create(req, res, next) {
    try {
      const nuevoUsuario = await usuariosService.create(req.body);
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Usuario registrado exitosamente.',
        data: nuevoUsuario,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/usuarios/:id
   */
  async update(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      await usuariosService.update(id, req.body);
      const updated = await usuariosService.getById(id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Usuario actualizado exitosamente.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/usuarios/:id
   */
  async delete(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      await usuariosService.delete(id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Usuario eliminado exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UsuariosController();
