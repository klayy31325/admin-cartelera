// ============================================================
// routes/produccion.routes.js
// ============================================================
const express = require('express');
const router = express.Router();
const produccionController = require('../controllers/produccion.controller');
const { verifyToken, authorize } = require('../middlewares/auth.middleware');
const { ROLES } = require('../utils/constants');

// Lectura — cualquier autenticado
router.get('/summary-today', verifyToken, produccionController.getSummaryToday);
router.get('/summary-month', verifyToken, produccionController.getSummaryMonth);
router.get('/', verifyToken, produccionController.getAll);
router.get('/:id', verifyToken, produccionController.getById);

// Escritura — admin, editor
router.post('/', verifyToken, authorize(ROLES.ADMIN, ROLES.EDITOR), produccionController.create);
router.put('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.EDITOR), produccionController.update);
router.delete('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.EDITOR), produccionController.delete);

module.exports = router;
