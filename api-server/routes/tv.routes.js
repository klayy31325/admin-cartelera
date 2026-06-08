// ============================================================
// routes/tv.routes.js — Endpoints para TVs
// ============================================================
const { Router } = require('express');
const tvController = require('../controllers/tv.controller');
const { verifyToken, authorize } = require('../middlewares/auth.middleware');
const { ROLES } = require('../utils/constants');

const router = Router();

router.use(verifyToken);

router.get('/',             tvController.getAll);
router.get('/:id',          tvController.getById);
router.post('/',            authorize(ROLES.ADMIN), tvController.create);
router.put('/:id',          authorize(ROLES.ADMIN), tvController.update);
router.delete('/:id',       authorize(ROLES.ADMIN), tvController.delete);

module.exports = router;
