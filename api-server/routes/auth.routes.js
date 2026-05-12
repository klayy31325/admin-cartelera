// ============================================================
// routes/auth.routes.js — Endpoints de Autenticación
// ============================================================
const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

const router = Router();

// ── Auth ──
router.post('/login', authController.login);        // POST /api/auth/login
router.get('/me', verifyToken, authController.me);   // GET  /api/auth/me (protegido)

module.exports = router;
