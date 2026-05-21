const mongoose = require('mongoose');

const kpiSchema = new mongoose.Schema({
    id_kpi: { 
        type: String, 
        required: true, 
        unique: true,
        description: "Chave primária (PK) do KPI"
    },
    nome: { 
        type: String, 
        required: true,
        description: "Nome do indicador (ex: Pegada de Carbono Total - Scope 1)"
    },
    tipo_agregacao: { 
        type: String, 
        required: true,
        description: "Ex: SOMA_SIMPLES, MEDIA_PONDERADA, RACIO_INTENSIDADE"
    },
    formula: { 
        type: String,
        description: "Expressão lógica ou matemática para o cálculo (se aplicável)"
    },
    id_unidade_resultado: { 
        type: String, 
        ref: 'UnidadeMedida', 
        required: true,
        description: "A unidade em que o KPI é expresso no final (ex: tCO2e, %)"
    },
    norma_referencia: { 
        type: String,
        description: "Ex: GRI 305-1, ESRS E1-6"
    },
    ativo: { 
        type: Boolean, 
        default: true 
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('KPI', kpiSchema);