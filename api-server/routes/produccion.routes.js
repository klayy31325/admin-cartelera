// ============================================================
// routes/produccion.routes.js
// ============================================================
const express = require('express');
const router = express.Router();
const produccionController = require('../controllers/produccion.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Rutas protegidas (Cartelera / Admin)
router.get('/summary-today', verifyToken, produccionController.getSummaryToday);
router.get('/summary-month', verifyToken, produccionController.getSummaryMonth);

// Rutas protegidas por JWT (para el admin)
router.get('/', verifyToken, produccionController.getAll);
router.get('/:id', verifyToken, produccionController.getById);
router.post('/', verifyToken, produccionController.create);
router.put('/:id', verifyToken, produccionController.update);
router.delete('/:id', verifyToken, produccionController.delete);

module.exports = router;
