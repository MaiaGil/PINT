const mongoose = require('mongoose');

const kpiComposicaoSchema = new mongoose.Schema({
    id_kpi: { 
        type: String, 
        ref: 'KPI', 
        required: true,
        description: "O KPI que estamos a configurar"
    },
    id_metrica: { 
        type: String, 
        ref: 'Metrica', 
        required: true,
        description: "A métrica que vai ser usada no cálculo deste KPI"
    },
    papel: { 
        type: String, 
        required: true,
        enum: ['NUMERADOR', 'DENOMINADOR', 'FATOR', 'SOMATORIO', 'AJUSTE']
    },
    multiplicador: { 
        type: Number, 
        required: true,
        default: 1,
        description: "Peso da métrica no cálculo (ex: 1 para somar, -1 para subtrair, ou um peso percentual)"
    }
}, {
    timestamps: true
});

// Índice Composto: Garante que a mesma métrica não é adicionada duas vezes ao mesmo KPI
kpiComposicaoSchema.index({ id_kpi: 1, id_metrica: 1 }, { unique: true });

module.exports = mongoose.model('KPIComposicao', kpiComposicaoSchema);