// ============================================================
// routes/paradas.routes.js
// ============================================================
const express = require('express');
const router = express.Router();
const paradasController = require('../controllers/paradas.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Rutas protegidas (Cartelera / Admin)
router.get('/summary-today', verifyToken, paradasController.getSummaryToday);
router.get('/summary-month', verifyToken, paradasController.getSummaryMonth);

// Rutas protegidas por JWT (para el admin)
router.get('/', verifyToken, paradasController.getAll);
router.get('/motivos', verifyToken, paradasController.getMotivos);
router.post('/', verifyToken, paradasController.registrarInicio);
router.patch('/:id/finalizar', verifyToken, paradasController.finalizarParada);

module.exports = router;
