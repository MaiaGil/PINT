const Entidade=require('../models/entidadeModel');

const normalizarNIF=(nif)=>nif?.replace(/\s/g,'');

const criarEntidade=async(req,res)=>{
try{
const{id_entidade,nome,tipo_entidade,pais,nif}=req.body;

const nifNorm=normalizarNIF(nif);

const entidadeExistente=await Entidade.findOne({
$or:[{id_entidade},{nif:nifNorm}]
});

if(entidadeExistente){
return res.status(200).json({
sucesso:true,
mensagem:"Entidade já existente no sistema.",
dados:entidadeExistente
});
}

const novaEntidade=await Entidade.create({
id_entidade,
nome,
tipo_entidade,
pais,
nif:nifNorm
});

res.status(201).json({
sucesso:true,
mensagem:"🏢 Entidade criada com sucesso!",
dados:novaEntidade
});

}catch(error){
if(error.name==='ValidationError'){
return res.status(400).json({sucesso:false,erro:error.message});
}
res.status(500).json({sucesso:false,erro:"Erro interno ao criar entidade."});
}
};

const obterEntidades=async(req,res)=>{
try{
const entidades=await Entidade.find().sort({nome:1});
res.status(200).json({
sucesso:true,
quantidade:entidades.length,
dados:entidades
});
}catch(error){
res.status(500).json({sucesso:false,erro:"Erro ao obter entidades."});
}
};

const obterEntidadePorId=async(req,res)=>{
try{
const entidade=await Entidade.findOne({id_entidade:req.params.id});
if(!entidade){
return res.status(404).json({
sucesso:false,
mensagem:"Entidade não encontrada."
});
}
res.status(200).json({sucesso:true,dados:entidade});
}catch(error){
res.status(500).json({sucesso:false,erro:"Erro ao procurar entidade."});
}
};

const atualizarEntidade=async(req,res)=>{
try{
if(req.body.nif){
req.body.nif=normalizarNIF(req.body.nif);
}

const entidadeAtualizada=await Entidade.findOneAndUpdate(
{id_entidade:req.params.id},
req.body,
{new:true,runValidators:true}
);

if(!entidadeAtualizada){
return res.status(404).json({
sucesso:false,
mensagem:"Entidade não encontrada."
});
}

res.status(200).json({
sucesso:true,
mensagem:"🏢 Entidade atualizada com sucesso!",
dados:entidadeAtualizada
});

}catch(error){
if(error.name==='ValidationError'){
return res.status(400).json({sucesso:false,erro:error.message});
}
res.status(500).json({sucesso:false,erro:"Erro ao atualizar entidade."});
}
};

const eliminarEntidade=async(req,res)=>{
try{
const entidadeEliminada=await Entidade.findOneAndDelete({
id_entidade:req.params.id
});

if(!entidadeEliminada){
return res.status(404).json({
sucesso:false,
mensagem:"Entidade não encontrada."
});
}

res.status(200).json({
sucesso:true,
mensagem:"Entidade removida com sucesso."
});

}catch(error){
res.status(500).json({sucesso:false,erro:"Erro ao eliminar entidade."});
}
};

module.exports={
criarEntidade,
obterEntidades,
obterEntidadePorId,
atualizarEntidade,
eliminarEntidade
};