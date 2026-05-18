const express = require('express');
const router = express.Router();
const materiaPrimaController = require('../controllers/materiaPrimaController');

router.get('/materias-primas', materiaPrimaController.getMateriaPrima);
router.post('/tipos-material/:id_tipo_material/materias-primas', materiaPrimaController.createMateriaPrima);

module.exports = router;