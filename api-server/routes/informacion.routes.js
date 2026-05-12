const express = require('express');
const router = express.Router();
const informacionRepository = require('../repositories/informacion.repository');
const { getIO } = require('../socket');

// Obtener todas las informaciones (default CUREX = 2)
router.get('/', async (req, res) => {
  try {
    const infos = await informacionRepository.findAll(2);
    res.json({ success: true, data: infos });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Obtener todas las informaciones para una empresa específica
router.get('/empresa/:empresa_id', async (req, res) => {
  try {
    const infos = await informacionRepository.findAll(req.params.empresa_id);
    res.json({ success: true, data: infos });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Crear nueva informacion
router.post('/', async (req, res) => {
  try {
    const newInfo = await informacionRepository.create(req.body);
    res.status(201).json(newInfo);

    // Emitir update en tiempo real
    try {
      getIO().emit('info-update', newInfo);
    } catch (_) {}
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar informacion
router.put('/:id', async (req, res) => {
  try {
    const updated = await informacionRepository.update(req.params.id, req.body);
    res.json(updated);

    // Emitir update en tiempo real
    try {
      getIO().emit('info-update', updated);
    } catch (_) {}
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar informacion
router.delete('/:id', async (req, res) => {
  try {
    await informacionRepository.delete(req.params.id);
    res.json({ message: 'Información eliminada correctamente' });

    // Emitir update en tiempo real
    try {
      getIO().emit('info-update', { id: req.params.id, deleted: true });
    } catch (_) {}
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
