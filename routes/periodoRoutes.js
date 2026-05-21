const router = require('express').Router();
const periodoController = require('../controllers/periodoController');

// Rotas principais
router.post('/', periodoController.criarPeriodo);
router.get('/', periodoController.obterPeriodos);

// Rotas com ID específico
router.get('/:id', periodoController.obterPeriodoPorId);
router.put('/:id', periodoController.atualizarPeriodo);
router.delete('/:id', periodoController.eliminarPeriodo);

module.exports = router;