const express = require('express');
const router = express.Router();
const entidadeController = require('../controllers/entidadeController');

router.route('/')
    .get(entidadeController.getAllEntidades)
    .post(entidadeController.createEntidade);

router.route('/:id')
    .get(entidadeController.getEntidade)
    .put(entidadeController.updateEntidade)
    .delete(entidadeController.deleteEntidade);

module.exports = router;