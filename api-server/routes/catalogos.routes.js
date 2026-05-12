// ============================================================
// routes/catalogos.routes.js
// ============================================================
const express = require('express');
const router = express.Router();
const catalogosController = require('../controllers/catalogos.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Rutas protegidas
router.get('/', verifyToken, catalogosController.getProductionCatalogs);

module.exports = router;
