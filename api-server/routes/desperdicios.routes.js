const express = require('express');
const router = express.Router();
const desperdiciosController = require('../controllers/desperdicios.controller');
const { verifyToken, authorize } = require('../middlewares/auth.middleware');
const { ROLES } = require('../utils/constants');

router.use(verifyToken);

router.get('/',             desperdiciosController.getAll);
router.post('/',            authorize(ROLES.ADMIN, ROLES.EDITOR), desperdiciosController.registrar);

module.exports = router;
