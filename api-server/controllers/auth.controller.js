// ============================================================
// controllers/auth.controller.js — Entrada/Salida HTTP Auth
// ============================================================
const authService = require('../services/auth.service');
const { HTTP_STATUS } = require('../utils/constants');

class AuthController {
  /**
   * POST /api/auth/login
   * Valida correo + contraseña y devuelve un JWT.
   */
  async login(req, res, next) {
    try {
      const { correo, password } = req.body;
      const result = await authService.login(correo, password);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Inicio de sesión exitoso.',
        data: {
          token: result.token,
          usuario: result.usuario,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Retorna los datos del usuario autenticado (requiere JWT).
   */
  async me(req, res, next) {
    try {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: req.user,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
