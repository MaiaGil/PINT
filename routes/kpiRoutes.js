const router = require('express').Router();
const kpiController = require('../controllers/kpiController');

router.get('/enums', kpiController.obterEnums);   // <-- antes do /:id

router.post('/', kpiController.criarKPI);
router.get('/', kpiController.obterKPIs);
router.get('/:id', kpiController.obterKPIPorId);
router.put('/:id', kpiController.atualizarKPI);
router.delete('/:id', kpiController.eliminarKPI);

module.exports = router;