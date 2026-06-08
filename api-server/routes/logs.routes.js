const express = require('express');
const router = express.Router();
const logsRepository = require('../repositories/logs.repository');
const { verifyToken, authorize } = require('../middlewares/auth.middleware');
const { ROLES } = require('../utils/constants');

router.use(verifyToken);
router.use(authorize(ROLES.ADMIN, ROLES.VISOR));

router.get('/', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const logs = await logsRepository.findAll(limit);
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
