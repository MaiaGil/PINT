const mongoose = require('mongoose');

const EmissaoCarbonoSchema = new mongoose.Schema({
  id_relatorio: { type: mongoose.Schema.Types.ObjectId, ref: 'Relatorio', required: true },
  emissao_co2e: Number,
  emissao_market_based_co2e: Number,
  metodologia: String,
  fator_emissao_co2e_per_mwh: Number
});

module.exports = mongoose.model('EmissaoCarbono', EmissaoEscopoSchema);