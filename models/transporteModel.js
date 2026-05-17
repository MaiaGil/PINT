const mongoose = require('mongoose');

const TransporteSchema = new mongoose.Schema({
  id_relatorio: { type: mongoose.Schema.Types.ObjectId, ref: 'Relatorio', required: true },
  cenario: { type: String, enum: ['upstream', 'downstream'] },
  total_ton_km: Number,
  fator_emissao_tco2e_per_ton_km: Number
});

module.exports = mongoose.model('Transporte', TransporteSchema);