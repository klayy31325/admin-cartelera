const express = require('express');
const router = express.Router();
const logsRepository = require('../repositories/logs.repository');

router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const logs = await logsRepository.findAll(limit);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
