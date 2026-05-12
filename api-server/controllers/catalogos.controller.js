// ============================================================
// controllers/catalogos.controller.js
// ============================================================
const { HTTP_STATUS } = require('../utils/constants');

class CatalogosController {
  async getProductionCatalogs(req, res, next) {
    try {
      // Por ahora devolvemos datos estáticos o predefinidos
      // En el futuro esto podría venir de tablas maestras en la DB
      const catalogs = {
        machines: [
          { id: 1, name: "OLYMPIA" },
          { id: 2, name: "NOVOFLEX" }
        ],
        clients: [
          { id: 1, name: "CLIENTE GENÉRICO" },
          { id: 2, name: "EMPAQUES S.A." }
        ],
        products: [
          { id: 1, name: "BOLSA PLÁSTICA" },
          { id: 2, name: "LÁMINA IMPRESA" }
        ],
        reasons: [
          { name: "CAMBIO DE MONTAJE" },
          { name: "LIMPIEZA" },
          { name: "FALLA MECÁNICA" },
          { name: "FALTA DE MATERIAL" }
        ]
      };

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: catalogs
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CatalogosController();
