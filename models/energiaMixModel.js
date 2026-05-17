const mongoose = require('mongoose');

const EnergiaMixSchema = new mongoose.Schema({
  id_energia_consumo: { type: mongoose.Schema.Types.ObjectId, ref: 'EnergiaConsumo', required: true },
  tipo_energia: { type: String, enum: ['eletricidade', 'gas natural', 'gasoil', 'outros'] },
  quantidade: Number,
  unidade: String,
  equivalente_mwh: Number
});

module.exports = mongoose.model('EnergiaMix', EnergiaMixSchema);