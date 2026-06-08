// ============================================================
// routes/velocidad.routes.js
// ============================================================
const express = require('express');
const router = express.Router();
const velocidadController = require('../controllers/velocidad.controller');
const { verifyToken, authorize } = require('../middlewares/auth.middleware');
const { ROLES } = require('../utils/constants');

router.use(verifyToken);

router.get('/',        velocidadController.getAll);
router.get('/resumen', velocidadController.getResumenHoy);
router.get('/series',  velocidadController.getSeriesHoy);
router.post('/',       authorize(ROLES.ADMIN, ROLES.EDITOR), velocidadController.registrar);

module.exports = router;
