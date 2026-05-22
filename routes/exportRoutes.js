const router = require('express').Router();
const exportController = require('../controllers/exportController');

router.get('/outbound/:id_periodo', exportController.gerarOutboundPorPeriodo);

module.exports = router;