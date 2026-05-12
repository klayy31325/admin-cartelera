const express = require('express');
const router = express.Router();
const desperdiciosController = require('../controllers/desperdicios.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.use(verifyToken);

router.post('/', desperdiciosController.registrar);
router.get('/', desperdiciosController.getAll);

module.exports = router;
