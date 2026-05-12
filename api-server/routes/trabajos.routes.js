// ============================================================
// routes/trabajos.routes.js
// ============================================================
const express = require('express');
const router = express.Router();
const multer = require('multer');
const trabajosController = require('../controllers/trabajos.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Multer en memoria (no guarda en disco)
const upload = multer({ storage: multer.memoryStorage() });

router.use(verifyToken);

router.get('/',         trabajosController.getAll);
router.get('/export',   trabajosController.exportExcel);
router.get('/:id',      trabajosController.getById);
router.post('/',        trabajosController.create);
router.post('/import',  upload.single('file'), trabajosController.importExcel);
router.put('/:id',      trabajosController.update);
router.delete('/:id',   trabajosController.delete);

module.exports = router;
