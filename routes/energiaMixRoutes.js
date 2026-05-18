const express = require('express');
const router = express.Router();
const energiaMixController = require('../controllers/energiaMixController');

router.get('/energia-mix', energiaMixController.getEnergiaMix);
router.post('/consumos-energia/:id_energia_consumo/energia-mix', energiaMixController.createEnergiaMix);

module.exports = router;