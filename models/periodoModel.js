const mongoose = require('mongoose');

const PeriodoSchema = new mongoose.Schema({
  tipo_periodo: { type: String, required: true }, // ex: "Anual", "Trimestral"
  data_inicio: { type: Date, required: true },
  data_fim: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Periodo', PeriodoSchema);