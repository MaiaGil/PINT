const router = require('express').Router();
const kpiComposicaoController = require('../controllers/kpiComposicaoController');

// Rotas principais
router.post('/', kpiComposicaoController.criarKPIComposicao);
router.get('/', kpiComposicaoController.obterKPIComposicoes);

// Rota para listar a composição completa de um KPI
router.get('/kpi/:id_kpi', kpiComposicaoController.obterComposicaoDeUmKPI);

// Rotas com ID duplo (Chave Composta)
router.put('/:id_kpi/:id_metrica', kpiComposicaoController.atualizarKPIComposicao);
router.delete('/:id_kpi/:id_metrica', kpiComposicaoController.eliminarKPIComposicao);

module.exports = router;