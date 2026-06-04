const express = require('express');
const router = express.Router();
const produccionInformativaRepository = require('../repositories/produccion_informativa.repository');
const { getIO } = require('../socket');

// Obtener todos los registros (default CUREX = 2)
router.get('/', async (req, res) => {
  try {
    const data = await produccionInformativaRepository.findAll(2);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Obtener por empresa
router.get('/empresa/:empresa_id', async (req, res) => {
  try {
    const data = await produccionInformativaRepository.findAll(req.params.empresa_id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Obtener el siguiente número de orden disponible
router.get('/next-orden', async (req, res) => {
  try {
    const empresa_id = req.query.empresa_id || 2;
    const maxOrden = await produccionInformativaRepository.getMaxOrden(Number(empresa_id));
    res.json({ success: true, data: { nextOrden: maxOrden + 1 } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Crear nuevo registro
router.post('/', async (req, res) => {
  try {
    const newItem = await produccionInformativaRepository.create(req.body);
    res.status(201).json({ success: true, data: newItem });

    // Emitir update
    try {
      getIO().emit('produccion-info-update', newItem);
    } catch (_) {}
  } catch (err) {
    const status = err.message.startsWith('El orden') ? 400 : 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

// Actualizar registro
router.put('/:id', async (req, res) => {
  try {
    const updated = await produccionInformativaRepository.update(req.params.id, req.body);
    res.json({ success: true, data: updated });

    // Emitir update
    try {
      getIO().emit('produccion-info-update', updated);
    } catch (_) {}
  } catch (err) {
    const status = err.message.startsWith('El orden') ? 400 : 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

// Eliminar registro
router.delete('/:id', async (req, res) => {
  try {
    await produccionInformativaRepository.delete(req.params.id);
    res.json({ success: true, message: 'Registro eliminado' });

    // Emitir update
    try {
      getIO().emit('produccion-info-update', { id: req.params.id, deleted: true });
    } catch (_) {}
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
