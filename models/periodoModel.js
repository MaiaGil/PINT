const mongoose = require('mongoose');

const PeriodoSchema = new mongoose.Schema({
  ano: { type: Number, required: true },
  trimestre: Number,
  data_inicio: Date,
  data_fim: Date
});

module.exports = mongoose.model('Periodo', PeriodoSchema);