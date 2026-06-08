// ============================================================
// middlewares/auth.middleware.js — Verificación de JWT
// ============================================================
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * Middleware que protege rutas verificando el token JWT
 * enviado en el header Authorization: Bearer <token>
 */
/**
 * Middleware que autoriza el acceso según los roles permitidos.
 * Debe usarse DESPUÉS de verifyToken.
 * @param  {...string} roles Roles permitidos (e.g. 'admin', 'editor')
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AppError('Acceso denegado. Usuario no autenticado.', HTTP_STATUS.UNAUTHORIZED);
      }
      if (!allowedRoles.includes(req.user.rol)) {
        throw new AppError('No tienes permisos para acceder a este recurso.', HTTP_STATUS.FORBIDDEN);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    // 1. Buscar en Headers (Bearer Token)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } 
    // 2. Buscar en Query Params (Útil para descargas de archivos)
    else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      throw new AppError('Acceso denegado. Token no proporcionado.', HTTP_STATUS.UNAUTHORIZED);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Adjuntar datos del usuario al request
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Token inválido.', HTTP_STATUS.UNAUTHORIZED));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expirado. Inicia sesión nuevamente.', HTTP_STATUS.UNAUTHORIZED));
    }
    next(error);
  }
}

module.exports = { verifyToken, authorize };
