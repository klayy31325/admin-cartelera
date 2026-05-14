// ============================================================
// controllers/catalogos.controller.js
// ============================================================
const { pool } = require('../config/db');
const { HTTP_STATUS } = require('../utils/constants');

class CatalogosController {
  async getProductionCatalogs(req, res, next) {
    try {
      // Leer máquinas de la DB (empresa CUREX = 2)
      const [machines] = await pool.execute(
        'SELECT id, nombre as name FROM maquinas WHERE empresa_id = 2 ORDER BY nombre ASC'
      );

      const [clients] = await pool.execute(
        'SELECT id, nombre as name FROM clientes WHERE empresa_id = 2 ORDER BY nombre ASC'
      );

      const [reasons] = await pool.execute(
        'SELECT id, nombre as name, tipo FROM motivos_parada ORDER BY nombre ASC'
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          machines,
          clients,
          reasons
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CatalogosController();
