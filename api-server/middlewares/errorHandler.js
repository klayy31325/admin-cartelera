// ============================================================
// middlewares/errorHandler.js — Middleware global de errores
// ============================================================
const { HTTP_STATUS } = require('../utils/constants');

/**
 * Captura todos los errores no manejados, incluyendo fallos
 * de conexión con MySQL (XAMPP apagado, credenciales incorrectas).
 */
function errorHandler(err, req, res, next) {
  // Valores por defecto
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_ERROR;
  let message = err.message || 'Error interno del servidor';

  // ── Errores específicos de MySQL ──
  if (err.code === 'ECONNREFUSED') {
    statusCode = HTTP_STATUS.INTERNAL_ERROR;
    message = 'No se pudo conectar a MySQL. Verifica que XAMPP esté corriendo.';
  }

  if (err.code === 'ER_ACCESS_DENIED_ERROR') {
    statusCode = HTTP_STATUS.INTERNAL_ERROR;
    message = 'Acceso denegado a MySQL. Verifica las credenciales en .env';
  }

  if (err.code === 'ER_BAD_DB_ERROR') {
    statusCode = HTTP_STATUS.INTERNAL_ERROR;
    message = `La base de datos "${process.env.DB_NAME}" no existe en MySQL.`;
  }

  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = HTTP_STATUS.CONFLICT;
    message = 'Ya existe un registro con esos datos (duplicado).';
  }

  // ── Log en consola (solo en desarrollo) ──
  if (process.env.NODE_ENV !== 'production') {
    console.error('─────────────────────────────────────');
    console.error('ERROR:', err.message);
    if (err.code) console.error('CODE:', err.code);
    console.error('─────────────────────────────────────');
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  });
}

module.exports = errorHandler;
