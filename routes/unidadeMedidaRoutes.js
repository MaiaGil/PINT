const router = require('express').Router();
const unidadeMedidaController = require('../controllers/unidadeMedidaController');

// Rotas principais
router.post('/', unidadeMedidaController.criarUnidadeMedida);
router.get('/', unidadeMedidaController.obterUnidadesMedida);

// Rotas com ID específico
router.get('/:id', unidadeMedidaController.obterUnidadePorId);
router.put('/:id', unidadeMedidaController.atualizarUnidadeMedida);
router.delete('/:id', unidadeMedidaController.eliminarUnidadeMedida);

module.exports = router;