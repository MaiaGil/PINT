const mongoose = require('mongoose');

const unidadeMedidaSchema = new mongoose.Schema({
    id_unidade: { 
        type: String, 
        required: true, 
        unique: true,
        description: "Chave primária (PK) da unidade de medida"
    },
    nome: { 
        type: String, 
        required: true,
        description: "Nome por extenso da unidade (ex: Kilowatt-hora, Metro Cúbico)"
    },
    simbolo: { 
        type: String, 
        required: true,
        description: "Símbolo da unidade (ex: kWh, m3, L)"
    },
    tipo_unidade: { 
        type: String, 
        required: true,
        enum: ['ENERGIA', 'MASSA', 'VOLUME', 'EMISSAO', 'RACIO', 'PERCENTAGEM', 'MONETARIO', 'TEMPO']
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('UnidadeMedida', unidadeMedidaSchema);