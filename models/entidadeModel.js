const mongoose=require('mongoose');

const entidadeSchema=new mongoose.Schema({

id_entidade:{
type:String,
required:true,
unique:true,
index:true
},

nome:{
type:String,
required:true,
default:"Entidade Desconhecida",
trim:true
},

tipo_entidade:{
type:String,
required:true,
enum:[
'EMPRESA',
'FORNECEDOR',
'CLIENTE',
'PARCEIRO',
'REGULADOR',
'OPERADOR_LOGISTICO',
'OUTRO'
],
default:'OUTRO'
},

pais:{
type:String,
required:false,
default:null,
uppercase:true,
trim:true,
maxlength:2
},

nif: {
	type: String,
	required: false,
	default: null
}

},{

timestamps:true

});

module.exports=mongoose.model('Entidade',entidadeSchema);