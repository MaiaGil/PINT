const router=require('express').Router();
const documentoController=require('../controllers/documentoController');

const {
criarDocumento,
obterDocumentos,
obterDocumentoPorId,
atualizarDocumento,
eliminarDocumento
}=documentoController;

router.post('/',criarDocumento);
router.get('/',obterDocumentos);
router.get('/:id',obterDocumentoPorId);
router.put('/:id',atualizarDocumento);
router.delete('/:id',eliminarDocumento);

module.exports=router;