const express = require('express');
const router = express.Router();
const relatorioController = require('../controllers/relatorioController');

router.get('/relatorios', relatorioController.getRelatorio);
router.post('/entidades/:id_entidade/periodos/:id_periodo/relatorios', relatorioController.createRelatorio);

module.exports = router;