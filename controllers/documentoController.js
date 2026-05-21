const Documento=require('../models/documentoModel');

const criarDocumento=async(req,res)=>{
try{
const doc=await Documento.create(req.body);
res.status(201).json({sucesso:true,dados:doc});
}catch(error){
res.status(500).json({sucesso:false,erro:'Erro ao criar documento'});
}
};

const obterDocumentos=async(req,res)=>{
try{
const docs=await Documento.find();
res.status(200).json({sucesso:true,quantidade:docs.length,dados:docs});
}catch(error){
res.status(500).json({sucesso:false,erro:'Erro ao obter documentos'});
}
};

const obterDocumentoPorId=async(req,res)=>{
try{
const doc=await Documento.findOne({id_documento:req.params.id});
if(!doc)return res.status(404).json({sucesso:false,mensagem:'Documento não encontrado'});
res.status(200).json({sucesso:true,dados:doc});
}catch(error){
res.status(500).json({sucesso:false,erro:'Erro ao procurar documento'});
}
};

const atualizarDocumento=async(req,res)=>{
try{
const doc=await Documento.findOneAndUpdate(
{id_documento:req.params.id},
req.body,
{new:true,runValidators:true}
);
if(!doc)return res.status(404).json({sucesso:false,mensagem:'Documento não encontrado'});
res.status(200).json({sucesso:true,dados:doc});
}catch(error){
res.status(500).json({sucesso:false,erro:'Erro ao atualizar documento'});
}
};

const eliminarDocumento=async(req,res)=>{
try{
const doc=await Documento.findOneAndDelete({id_documento:req.params.id});
if(!doc)return res.status(404).json({sucesso:false,mensagem:'Documento não encontrado'});
res.status(200).json({sucesso:true,mensagem:'Documento eliminado'});
}catch(error){
res.status(500).json({sucesso:false,erro:'Erro ao eliminar documento'});
}
};

module.exports={
criarDocumento,
obterDocumentos,
obterDocumentoPorId,
atualizarDocumento,
eliminarDocumento
};