const express = require('express');
const router = express.Router();
const tipoMaterialController = require('../controllers/tipoMaterialController');

router.get('/tipos-material', tipoMaterialController.getTipoMaterial);
router.post('/tipos-material', tipoMaterialController.createTipoMaterial);

module.exports = router;