const mongoose = require('mongoose');

const RelatorioSchema = new mongoose.Schema({
  id_entidade: { type: mongoose.Schema.Types.ObjectId, ref: 'Entidade', required: true },
  id_periodo: { type: mongoose.Schema.Types.ObjectId, ref: 'Periodo', required: true },
  data_geracao: { type: Date, default: Date.now },
  versao_esquema: String
});

module.exports = mongoose.model('Relatorio', RelatorioSchema);