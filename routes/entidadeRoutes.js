const express = require('express');
const router = express.Router();
const entidadeController = require('../controllers/entidadeController');

router.get('/entidades', entidadeController.getEntidade);
router.post('/entidades', entidadeController.createEntidade);

module.exports = router;