const express = require('express');
const router = express.Router();
const produccionInformativaRepository = require('../repositories/produccion_informativa.repository');
const { getIO } = require('../socket');
const { verifyToken, authorize } = require('../middlewares/auth.middleware');
const { ROLES } = require('../utils/constants');

router.use(verifyToken);

// Obtener todos los registros (default CUREX = 2)
router.get('/', async (req, res, next) => {
  try {
    const data = await produccionInformativaRepository.findAll(2);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// Obtener por empresa
router.get('/empresa/:empresa_id', async (req, res, next) => {
  try {
    const data = await produccionInformativaRepository.findAll(req.params.empresa_id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// Obtener el siguiente número de orden disponible
router.get('/next-orden', async (req, res, next) => {
  try {
    const empresa_id = req.query.empresa_id || 2;
    const maxOrden = await produccionInformativaRepository.getMaxOrden(Number(empresa_id));
    res.json({ success: true, data: { nextOrden: maxOrden + 1 } });
  } catch (err) {
    next(err);
  }
});

// Crear nuevo registro (admin, editor)
router.post('/', authorize(ROLES.ADMIN, ROLES.EDITOR), async (req, res, next) => {
  try {
    const newItem = await produccionInformativaRepository.create(req.body);
    res.status(201).json({ success: true, data: newItem });

    try {
      getIO().emit('produccion-info-update', newItem);
    } catch (_) {}
  } catch (err) {
    const status = err.message.startsWith('El orden') ? 400 : 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

// Actualizar registro (admin, editor)
router.put('/:id', authorize(ROLES.ADMIN, ROLES.EDITOR), async (req, res, next) => {
  try {
    const updated = await produccionInformativaRepository.update(req.params.id, req.body);
    res.json({ success: true, data: updated });

    try {
      getIO().emit('produccion-info-update', updated);
    } catch (_) {}
  } catch (err) {
    const status = err.message.startsWith('El orden') ? 400 : 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

// Eliminar registro (admin, editor)
router.delete('/:id', authorize(ROLES.ADMIN, ROLES.EDITOR), async (req, res, next) => {
  try {
    await produccionInformativaRepository.delete(req.params.id);
    res.json({ success: true, message: 'Registro eliminado' });

    try {
      getIO().emit('produccion-info-update', { id: req.params.id, deleted: true });
    } catch (_) {}
  } catch (err) {
    next(err);
  }
});

module.exports = router;
