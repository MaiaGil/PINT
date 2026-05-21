const router = require('express').Router();
const kpiController = require('../controllers/kpiController');

// Rotas principais
router.post('/', kpiController.criarKPI);
router.get('/', kpiController.obterKPIs);

// Rotas com ID específico
router.get('/:id', kpiController.obterKPIPorId);
router.put('/:id', kpiController.atualizarKPI);
router.delete('/:id', kpiController.eliminarKPI);

module.exports = router;