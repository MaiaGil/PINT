const mongoose = require('mongoose');

const PILARES = ['AMBIENTAL', 'SOCIAL', 'GOVERNANCA'];
const NATUREZAS = ['INPUT', 'FATOR', 'KPI_BASE', 'CALCULADA'];

const metricaSchema = new mongoose.Schema({
    id_metrica: { type: String, required: true, unique: true },
    nome:        { type: String, required: true },
    pilar:       { type: String, required: true, enum: { values: PILARES,   message: `pilar deve ser: ${PILARES.join(', ')}`   } },
    subcategoria:{ type: String, required: true },
    natureza:    { type: String, required: true, enum: { values: NATUREZAS, message: `natureza deve ser: ${NATUREZAS.join(', ')}` } },
    id_unidade_base: { type: String, ref: 'UnidadeMedida', required: true },
    norma_referencia:{ type: String, default: null },
    ativo:       { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Metrica', metricaSchema);
module.exports.PILARES   = PILARES;
module.exports.NATUREZAS = NATUREZAS;