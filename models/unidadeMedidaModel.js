const mongoose = require('mongoose');

const unidadeMedidaSchema = new mongoose.Schema({
    id_unidade: { 
        type: String, 
        required: [true, 'O ID da unidade é obrigatório.'],
        unique: true,
        trim: true,
        uppercase: true
    },
    nome: { 
        type: String, 
        required: [true, 'O nome da unidade é obrigatório.'],
        trim: true
    },
    simbolo: { 
        type: String, 
        required: [true, 'O símbolo da unidade é obrigatório.'],
        trim: true
    },
    tipo_unidade: { 
        type: String, 
        required: [true, 'O tipo de unidade é obrigatório.'],
        enum: {
            values: ['ENERGIA', 'MASSA', 'VOLUME', 'EMISSOES', 'RACIO', 'PERCENTAGEM', 'MONETARIO', 'TEMPO'],
            message: 'O tipo "{VALUE}" não é válido.'
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('UnidadeMedida', unidadeMedidaSchema);