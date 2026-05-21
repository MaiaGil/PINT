const mongoose = require('mongoose');

const resultadoKpiDadoSchema = new mongoose.Schema({
    id_resultado: { 
        type: String, 
        ref: 'ResultadoKPI', 
        required: true,
        description: "O resultado final do KPI"
    },
    id_dado: { 
        type: String, 
        ref: 'Dado', 
        required: true,
        description: "O dado individual/bruto que foi usado no cálculo deste resultado"
    }
}, {
    timestamps: true
});

// Índice Composto: Garante que não registamos o mesmo dado duas vezes no mesmo resultado de KPI
resultadoKpiDadoSchema.index({ id_resultado: 1, id_dado: 1 }, { unique: true });

module.exports = mongoose.model('ResultadoKpiDado', resultadoKpiDadoSchema);