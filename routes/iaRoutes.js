const express = require('express');
const router = express.Router();
const iaController = require('../controllers/iaController');

router.post('/ia/extrair', iaController.extrairEGravarDados);

module.exports = router;