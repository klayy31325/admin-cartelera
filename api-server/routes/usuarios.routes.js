// ============================================================
// routes/usuarios.routes.js — Endpoints de Usuarios
// ============================================================
const { Router } = require('express');
const usuariosController = require('../controllers/usuarios.controller');
const { verifyToken, authorize } = require('../middlewares/auth.middleware');
const { ROLES } = require('../utils/constants');

const router = Router();

// ── CRUD de Usuarios ──
router.post('/', verifyToken, authorize(ROLES.ADMIN), usuariosController.create);  // POST   /api/usuarios (solo admin)
router.get('/', verifyToken, authorize(ROLES.ADMIN), usuariosController.getAll);
router.get('/:id', verifyToken, authorize(ROLES.ADMIN), usuariosController.getById);
router.put('/:id', verifyToken, authorize(ROLES.ADMIN), usuariosController.update);
router.delete('/:id', verifyToken, authorize(ROLES.ADMIN), usuariosController.delete);

module.exports = router;
