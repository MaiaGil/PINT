const express = require('express');
const router = express.Router();
const periodoController = require('../controllers/periodoController');

router.get('/periodos', periodoController.getPeriodo);
router.post('/periodos', periodoController.createPeriodo);

module.exports = router;