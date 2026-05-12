// ============================================================
// routes/usuarios.routes.js — Endpoints de Usuarios
// ============================================================
const { Router } = require('express');
const usuariosController = require('../controllers/usuarios.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

const router = Router();

// ── CRUD de Usuarios ──
// Todas las rutas protegidas con JWT excepto el registro
router.post('/', usuariosController.create);                           // POST   /api/usuarios
router.get('/', verifyToken, usuariosController.getAll);               // GET    /api/usuarios
router.get('/:id', verifyToken, usuariosController.getById);           // GET    /api/usuarios/:id
router.put('/:id', verifyToken, usuariosController.update);            // PUT    /api/usuarios/:id
router.delete('/:id', verifyToken, usuariosController.delete);         // DELETE /api/usuarios/:id

module.exports = router;
