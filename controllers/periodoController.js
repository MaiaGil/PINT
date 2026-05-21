const Periodo=require('../models/periodoModel');

const safeUpsert=async(Model,query,data)=>{
return await Model.findOneAndUpdate(query,data,{upsert:true,new:true,setDefaultsOnInsert:true,runValidators:true});
};

const criarPeriodo=async(req,res)=>{
try{
const{ id_periodo,tipo_periodo,data_inicio,data_fim }=req.body;
if(!id_periodo||!tipo_periodo){
return res.status(400).json({sucesso:false,mensagem:'Dados em falta'});
}
const periodo=await safeUpsert(Periodo,{id_periodo},{
id_periodo,
tipo_periodo,
data_inicio,
data_fim
});
return res.status(200).json({sucesso:true,mensagem:'Período processado com sucesso',dados:periodo});
}catch(e){
return res.status(500).json({sucesso:false,erro:'Erro interno'});
}
};

const obterPeriodos=async(req,res)=>{
try{
const periodos=await Periodo.find().sort({data_inicio:-1});
return res.status(200).json({sucesso:true,quantidade:periodos.length,dados:periodos});
}catch(e){
return res.status(500).json({sucesso:false,erro:'Erro ao obter períodos'});
}
};

const obterPeriodoPorId=async(req,res)=>{
try{
const periodo=await Periodo.findOne({id_periodo:req.params.id});
if(!periodo)return res.status(404).json({sucesso:false,mensagem:'Período não encontrado'});
return res.status(200).json({sucesso:true,dados:periodo});
}catch(e){
return res.status(500).json({sucesso:false,erro:'Erro ao procurar período'});
}
};

const atualizarPeriodo=async(req,res)=>{
try{
const periodo=await Periodo.findOneAndUpdate(
{id_periodo:req.params.id},
req.body,
{new:true,runValidators:true}
);
if(!periodo)return res.status(404).json({sucesso:false,mensagem:'Período não encontrado'});
return res.status(200).json({sucesso:true,mensagem:'Período atualizado',dados:periodo});
}catch(e){
return res.status(500).json({sucesso:false,erro:'Erro ao atualizar período'});
}
};

const eliminarPeriodo=async(req,res)=>{
try{
const periodo=await Periodo.findOneAndDelete({id_periodo:req.params.id});
if(!periodo)return res.status(404).json({sucesso:false,mensagem:'Período não encontrado'});
return res.status(200).json({sucesso:true,mensagem:'Período removido'});
}catch(e){
return res.status(500).json({sucesso:false,erro:'Erro ao eliminar período'});
}
};

module.exports={criarPeriodo,obterPeriodos,obterPeriodoPorId,atualizarPeriodo,eliminarPeriodo};