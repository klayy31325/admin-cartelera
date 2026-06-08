const express = require('express');
const router = express.Router();
const informacionRepository = require('../repositories/informacion.repository');
const { getIO } = require('../socket');
const { verifyToken, authorize } = require('../middlewares/auth.middleware');
const { ROLES } = require('../utils/constants');

router.use(verifyToken);

// Obtener todas las informaciones (default CUREX = 2)
router.get('/', async (req, res, next) => {
  try {
    const infos = await informacionRepository.findAll(2);
    res.json({ success: true, data: infos });
  } catch (err) {
    next(err);
  }
});

// Obtener todas las informaciones para una empresa específica
router.get('/empresa/:empresa_id', async (req, res, next) => {
  try {
    const infos = await informacionRepository.findAll(req.params.empresa_id);
    res.json({ success: true, data: infos });
  } catch (err) {
    next(err);
  }
});

// Crear nueva informacion (admin, editor)
router.post('/', authorize(ROLES.ADMIN, ROLES.EDITOR), async (req, res, next) => {
  try {
    const newInfo = await informacionRepository.create(req.body);
    res.status(201).json(newInfo);

    try {
      getIO().emit('info-update', newInfo);
    } catch (_) {}
  } catch (err) {
    next(err);
  }
});

// Actualizar informacion (admin, editor)
router.put('/:id', authorize(ROLES.ADMIN, ROLES.EDITOR), async (req, res, next) => {
  try {
    const updated = await informacionRepository.update(req.params.id, req.body);
    res.json(updated);

    try {
      getIO().emit('info-update', updated);
    } catch (_) {}
  } catch (err) {
    next(err);
  }
});

// Eliminar informacion (admin, editor)
router.delete('/:id', authorize(ROLES.ADMIN, ROLES.EDITOR), async (req, res, next) => {
  try {
    await informacionRepository.delete(req.params.id);
    res.json({ message: 'Información eliminada correctamente' });

    try {
      getIO().emit('info-update', { id: req.params.id, deleted: true });
    } catch (_) {}
  } catch (err) {
    next(err);
  }
});

module.exports = router;
