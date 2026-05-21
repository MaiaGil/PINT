const mongoose=require('mongoose');

const dadoSchema=new mongoose.Schema({

id_dado:{
type:String,
required:true,
unique:true
},

id_documento:{
type:String,
ref:'Documento',
default:null
},

id_metrica:{
type:String,
ref:'Metrica',
required:true
},

id_entidade:{
type:String,
ref:'Entidade',
required:true
},

id_periodo:{
type:String,
ref:'Periodo',
required:true
},

id_unidade_original:{
type:String,
ref:'UnidadeMedida',
default:null
},

id_unidade_base_esperada:{
type:String,
ref:'UnidadeMedida',
default:null
},

id_fator:{
type:String,
ref:'FatorConversao',
default:null
},

valor:{
type:Number,
required:true
},

valor_convertido_base:{
type:Number,
default:null
},

origem:{
type:String,
required:true,
enum:['EXTRACAO_IA','MANUAL','IMPORTACAO','API'],
default:'EXTRACAO_IA'
},

estado_validacao:{
type:String,
required:true,
enum:['PENDENTE','VALIDADO','REJEITADO','ESTIMADO'],
default:'PENDENTE'
},

data_registo:{
type:Date,
default:Date.now
},

data_validacao:{
type:Date,
default:null
},

observacao:{
type:String,
default:null
}

},{
timestamps:true
});

module.exports=mongoose.model('Dado',dadoSchema);