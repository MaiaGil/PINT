const express = require('express');
const router = express.Router();
const emissaoCarbonoController = require('../controllers/emissaoCarbonoController');

router.get('/emissoes', emissaoCarbonoController.getEmissaoCarbono);
router.post('/relatorios/:id_relatorio/emissoes', emissaoCarbonoController.createEmissao);

module.exports = router;