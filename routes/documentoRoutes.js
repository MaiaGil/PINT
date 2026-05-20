const express = require('express');
const router = express.Router();
const documentoController = require('../controllers/documentoController');

router.route('/')
    .get(documentoController.getAllDocumentos)
    .post(documentoController.createDocumento);

router.route('/:id')
    .get(documentoController.getDocumento)
    .put(documentoController.updateDocumento)
    .delete(documentoController.deleteDocumento);

module.exports = router;