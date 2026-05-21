const router = require('express').Router();
const dadoController = require('../controllers/dadoController');

// Rotas principais
router.post('/', dadoController.criarDado);
router.get('/', dadoController.obterDados);

// Rotas com ID específico
router.get('/:id', dadoController.obterDadoPorId);
router.put('/:id', dadoController.atualizarDado);
router.delete('/:id', dadoController.eliminarDado);

module.exports = router;