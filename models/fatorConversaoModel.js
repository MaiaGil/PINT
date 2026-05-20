const mongoose = require('mongoose');

const FatorConversaoSchema = new mongoose.Schema({
  id_unidade_origem: { type: mongoose.Schema.Types.ObjectId, ref: 'UnidadeMedida', required: true },
  id_unidade_destino: { type: mongoose.Schema.Types.ObjectId, ref: 'UnidadeMedida', required: true },
  fator: { type: Number, required: true },
  norma_referencia: { type: String, required: true }, // ex: "GHG Protocol"
  validade_inicio: { type: Date, required: true },
  validade_fim: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('FatorConversao', FatorConversaoSchema);