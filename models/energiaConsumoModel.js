const mongoose = require('mongoose');

const EnergiaConsumoSchema = new mongoose.Schema({
  id_relatorio: { type: mongoose.Schema.Types.ObjectId, ref: 'Relatorio', required: true },
  consumo_total_mwh: Number,
  percentagem_renovavel_pct: Number,
  certificados_garantia_origem: Boolean
});

module.exports = mongoose.model('EnergiaConsumo', EnergiaConsumoSchema);