const mongoose = require('mongoose');

const TIPOS_AGREGACAO = [
    'SOMA_SIMPLES',
    'MEDIA_PONDERADA',
    'RACIO_INTENSIDADE',
    'MAXIMO',
    'MINIMO',
    'CONTAGEM',
    'PERCENTAGEM'
];

const kpiSchema = new mongoose.Schema({
    id_kpi: {
        type: String,
        required: true,
        unique: true
    },
    nome: {
        type: String,
        required: true
    },
    tipo_agregacao: {
        type: String,
        required: true,
        enum: {
            values: TIPOS_AGREGACAO,
            message: `tipo_agregacao deve ser um de: ${TIPOS_AGREGACAO.join(', ')}`
        }
    },
    formula: {
        type: String,
        default: null
    },
    id_unidade_resultado: {
        type: String,
        ref: 'UnidadeMedida',
        required: true
    },
    norma_referencia: {
        type: String,
        default: null
    },
    ativo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('KPI', kpiSchema);
module.exports.TIPOS_AGREGACAO = TIPOS_AGREGACAO;