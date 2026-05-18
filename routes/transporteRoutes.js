const express = require('express');
const router = express.Router();
const transporteController = require('../controllers/transporteController');

router.get('/transportes', transporteController.getTransporte);
router.post('/relatorios/:id_relatorio/transportes', transporteController.createTransporte);

module.exports = router;