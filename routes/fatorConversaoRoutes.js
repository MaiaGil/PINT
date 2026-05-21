const router = require('express').Router();
const fatorConversaoController = require('../controllers/fatorConversaoController');

// Rotas principais
router.post('/', fatorConversaoController.criarFatorConversao);
router.get('/', fatorConversaoController.obterFatoresConversao);

// Rotas com ID específico
router.get('/:id', fatorConversaoController.obterFatorPorId);
router.put('/:id', fatorConversaoController.atualizarFatorConversao);
router.delete('/:id', fatorConversaoController.eliminarFatorConversao);

module.exports = router;