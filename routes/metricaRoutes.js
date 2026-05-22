const router = require('express').Router();
const metricaController = require('../controllers/metricaController');

router.get('/enums', metricaController.obterEnums);  // antes do /:id

router.post('/', metricaController.criarMetrica);
router.get('/', metricaController.obterMetricas);
router.get('/:id', metricaController.obterMetricaPorId);
router.put('/:id', metricaController.atualizarMetrica);
router.delete('/:id', metricaController.eliminarMetrica);

module.exports = router;