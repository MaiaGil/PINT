const router = require('express').Router();
const resultadoKpiController = require('../controllers/resultadoKpiController');

// Rotas principais
router.post('/', resultadoKpiController.criarResultadoKPI);
router.get('/', resultadoKpiController.obterResultadosKPI);

// Rotas com ID específico
router.get('/:id', resultadoKpiController.obterResultadoPorId);
router.put('/:id', resultadoKpiController.atualizarResultadoKPI);
router.delete('/:id', resultadoKpiController.eliminarResultadoKPI);

module.exports = router;