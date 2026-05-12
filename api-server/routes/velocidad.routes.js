// ============================================================
// routes/velocidad.routes.js
// ============================================================
const express = require('express');
const router = express.Router();
const velocidadController = require('../controllers/velocidad.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.use(verifyToken);

router.get('/',        velocidadController.getAll);
router.get('/resumen', velocidadController.getResumenHoy);
router.get('/series',  velocidadController.getSeriesHoy);
router.post('/',       velocidadController.registrar);

module.exports = router;
