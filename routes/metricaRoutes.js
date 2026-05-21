const router = require('express').Router();
const metricaController = require('../controllers/metricaController');

// Rotas principais
router.post('/', metricaController.criarMetrica);
router.get('/', metricaController.obterMetricas);

// Rotas com ID específico
router.get('/:id', metricaController.obterMetricaPorId);
router.put('/:id', metricaController.atualizarMetrica);
router.delete('/:id', metricaController.eliminarMetrica);

module.exports = router;