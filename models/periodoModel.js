const mongoose=require('mongoose');

const periodoSchema=new mongoose.Schema({

	id_periodo:{
		type:String,
		required:true,
		unique:true,
		description:"PK vinda do inbound.json"
	},

	tipo_periodo:{
		type:String,
		required:true,
		enum:[
			'MENSAL',
			'BIMESTRAL',
			'TRIMESTRAL',
			'SEMESTRAL',
			'ANUAL'
		],
		default:'MENSAL'
	},

	data_inicio:{
		type:Date,
		default:null,
		description:"Pode vir incompleto da IA"
	},

	data_fim:{
		type:Date,
		default:null,
		description:"Pode ser inferido depois se necessário"
	}

},{
	timestamps:true
});

module.exports=mongoose.model('Periodo',periodoSchema);