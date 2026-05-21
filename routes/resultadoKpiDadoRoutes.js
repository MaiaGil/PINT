const router = require('express').Router();
const resultadoKpiDadoController = require('../controllers/resultadoKpiDadoController');

// Rota para criar associação
router.post('/', resultadoKpiDadoController.criarAssociacao);

// Rota mestre de auditoria (Passa o ID do resultado, recebe a lista de faturas e dados)
router.get('/resultado/:id_resultado', resultadoKpiDadoController.obterDadosPorResultado);

// Rota para eliminar associação (Chave Composta)
router.delete('/:id_resultado/:id_dado', resultadoKpiDadoController.eliminarAssociacao);

module.exports = router;