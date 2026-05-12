// ============================================================
// routes/tv.routes.js — Endpoints para TVs
// ============================================================
const { Router } = require('express');
const tvController = require('../controllers/tv.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

const router = Router();

// Todas las rutas protegidas con JWT
router.use(verifyToken);

router.get('/', tvController.getAll);
router.get('/:id', tvController.getById);
router.post('/', tvController.create);
router.put('/:id', tvController.update);
router.delete('/:id', tvController.delete);

module.exports = router;
