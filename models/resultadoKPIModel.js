const mongoose = require('mongoose');

const resultadoKpiSchema = new mongoose.Schema({
    id_resultado: { 
        type: String, 
        required: true, 
        unique: true,
        description: "Chave primária (PK) do resultado do KPI"
    },
    id_kpi: { 
        type: String, 
        ref: 'KPI', 
        required: true,
        description: "O KPI que foi calculado"
    },
    id_entidade: { 
        type: String, 
        ref: 'Entidade', 
        required: true,
        description: "A empresa à qual este resultado pertence"
    },
    id_periodo: { 
        type: String, 
        ref: 'Periodo', 
        required: true,
        description: "O período temporal deste resultado"
    },
    id_unidade: { 
        type: String, 
        ref: 'UnidadeMedida', 
        required: true,
        description: "A unidade final em que o resultado está expresso (ex: tCO2e)"
    },
    valor_calculado: { 
        type: Number, 
        required: true,
        description: "O valor numérico final após a agregação e fórmulas"
    },
    snapshot_formula: { 
        type: String,
        description: "Registo textual de como a fórmula estava escrita no momento do cálculo (para histórico)"
    },
    data_calculo: { 
        type: Date, 
        default: Date.now 
    },
    estado_validacao: { 
        type: String, 
        required: true,
        enum: ['PENDENTE', 'VALIDADO', 'REJEITADO', 'ESTIMADO'],
        default: 'PENDENTE'
    },
    data_validacao: { 
        type: Date 
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ResultadoKPI', resultadoKpiSchema);