const mongoose=require("mongoose");

const documentoSchema=new mongoose.Schema({

id_documento:{
type:String,
required:true,
unique:true,
description:"PK vindo do inbound.json"
},

id_entidade:{
type:String,
required:true,
ref:"Entidade",
description:"FK entidade emissora"
},

id_periodo:{
type:String,
required:true,
ref:"Periodo",
description:"FK período associado"
},

tipo_documento:{
type:String,
required:true,
enum:[
"FATURA",
"EPD",
"RELATORIO_AUDITORIA",
"RELATORIO_ESG",
"XML",
"JSON",
"ERP",
"API",
"OUTRO"
],
default:"OUTRO"
},

numero_documento:{
type:String,
default:null
},

data_emissao:{
type:Date,
default:null
},

ficheiro_origem:{
type:String,
default:null
},

estado:{
type:String,
required:true,
enum:[
"RECEBIDO",
"EXTRAIDO",
"MAPEADO",
"VALIDADO",
"PROCESSADO",
"ERRO"
],
default:"EXTRAIDO"
},

fonte_ingestao:{
type:String,
required:true,
default:"IA"
},

versao_schema:{
type:String,
required:true,
default:"1.0.0"
},

data_processamento:{
type:Date,
default:Date.now
}

},{
timestamps:true
});

module.exports=mongoose.model("Documento",documentoSchema);