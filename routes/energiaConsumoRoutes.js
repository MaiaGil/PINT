const express = require('express');
const router = express.Router();
const energiaConsumoController = require('../controllers/energiaConsumoController');

router.get('/consumos-energia', energiaConsumoController.getEnergiaConsumo);
router.post('/relatorios/:id_relatorio/consumos-energia', energiaConsumoController.createEnergiaConsumo);

module.exports = router;