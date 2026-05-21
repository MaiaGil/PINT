const router = require('express').Router();
const entidadeController = require('../controllers/entidadeController');

// Rotas principais
router.post('/', entidadeController.criarEntidade);
router.get('/', entidadeController.obterEntidades);

// Rotas com ID específico
router.get('/:id', entidadeController.obterEntidadePorId);
router.put('/:id', entidadeController.atualizarEntidade);
router.delete('/:id', entidadeController.eliminarEntidade);

module.exports = router;