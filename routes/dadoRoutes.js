const express = require('express');
const router = express.Router();
const dadoController = require('../controllers/dadoController');

router.route('/')
    .get(dadoController.getAllDados)
    .post(dadoController.createDado);

router.route('/:id')
    .get(dadoController.getDado)
    .put(dadoController.updateDado)
    .delete(dadoController.deleteDado);

module.exports = router;