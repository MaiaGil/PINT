const mongoose = require('mongoose');

const UnidadeMedidaSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  simbolo: { type: String, required: true }, // ex: "kWh", "tCO2e"
  tipo_unidade: { type: String, required: true } // ex: "Energia", "Massa"
}, { timestamps: true });

module.exports = mongoose.model('UnidadeMedida', UnidadeMedidaSchema);