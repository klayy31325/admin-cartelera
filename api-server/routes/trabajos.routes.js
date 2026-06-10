// ============================================================
// routes/trabajos.routes.js
// ============================================================
const express = require('express');
const router = express.Router();
const multer = require('multer');
const trabajosController = require('../controllers/trabajos.controller');
const { verifyToken, authorize } = require('../middlewares/auth.middleware');
const { ROLES } = require('../utils/constants');

const upload = multer({ storage: multer.memoryStorage() });

router.use(verifyToken);

router.get('/',              trabajosController.getAll);
router.get('/export',        trabajosController.exportExcel);
router.get('/:id',           trabajosController.getById);
router.post('/',             authorize(ROLES.ADMIN, ROLES.EDITOR), trabajosController.create);
router.post('/import',        authorize(ROLES.ADMIN, ROLES.EDITOR, ROLES.OPERADOR), upload.single('file'), trabajosController.importExcel);
router.post('/import-totales', authorize(ROLES.ADMIN, ROLES.EDITOR, ROLES.OPERADOR), upload.single('file'), trabajosController.importTotales);
router.get('/resumen-excel',  verifyToken, trabajosController.getResumenTotales);
router.put('/:id',            authorize(ROLES.ADMIN, ROLES.EDITOR), trabajosController.update);
router.delete('/:id',        authorize(ROLES.ADMIN, ROLES.EDITOR), trabajosController.delete);

module.exports = router;
