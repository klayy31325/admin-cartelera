// ============================================================
// routes/paradas.routes.js
// ============================================================
const express = require('express');
const router = express.Router();
const paradasController = require('../controllers/paradas.controller');
const { verifyToken, authorize } = require('../middlewares/auth.middleware');
const { ROLES } = require('../utils/constants');

// Todas protegidas con JWT
router.get('/summary-today', verifyToken, paradasController.getSummaryToday);
router.get('/summary-month', verifyToken, paradasController.getSummaryMonth);
router.get('/', verifyToken, paradasController.getAll);
router.get('/motivos', verifyToken, paradasController.getMotivos);
router.post('/', verifyToken, authorize(ROLES.ADMIN, ROLES.EDITOR), paradasController.registrarInicio);
router.patch('/:id/finalizar', verifyToken, authorize(ROLES.ADMIN, ROLES.EDITOR), paradasController.finalizarParada);

module.exports = router;
