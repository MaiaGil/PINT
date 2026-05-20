const mongoose = require('mongoose');

const MetricaSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  descricao: { type: String },
  pilar: { type: String, required: true }, // E, S ou G
  subcategoria: { type: String }, // ex: "Emissões", "Diversidade"
  natureza: { type: String }, // ex: "Quantitativa", "Qualitativa"
  id_unidade_base: { type: mongoose.Schema.Types.ObjectId, ref: 'UnidadeMedida', required: true },
  norma_referencia: { type: String }, // ex: "GRI 305"
  ativo: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Metrica', MetricaSchema);