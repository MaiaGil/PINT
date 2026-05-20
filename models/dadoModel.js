const mongoose = require('mongoose');

const DimensaoDadoSchema = new mongoose.Schema({
  chave: { type: String, required: true }, // ex: "Escopo"
  valor: { type: String, required: true }  // ex: "Escopo 1"
}, { _id: false });

const DadoSchema = new mongoose.Schema({
  id_documento: { type: mongoose.Schema.Types.ObjectId, ref: 'Documento', required: true },
  id_metrica: { type: mongoose.Schema.Types.ObjectId, ref: 'Metrica', required: true },
  id_entidade: { type: mongoose.Schema.Types.ObjectId, ref: 'Entidade', required: true },
  id_periodo: { type: mongoose.Schema.Types.ObjectId, ref: 'Periodo', required: true },
  id_unidade_original: { type: mongoose.Schema.Types.ObjectId, ref: 'UnidadeMedida', required: true },
  id_fator: { type: mongoose.Schema.Types.ObjectId, ref: 'FatorConversao' },
  valor: { type: Number, required: true },
  valor_convertido_base: { type: Number, required: true },
  origem: { type: String, required: true },
  estado_validacao: { type: String, default: 'Submetido' },
  data_registo: { type: Date, default: Date.now },
  data_validacao: { type: Date },
  dimensoes: [DimensaoDadoSchema] // Substitui a tabela DimensaoDado relacional por um sub-array nativo
}, { timestamps: true });

module.exports = mongoose.model('Dado', DadoSchema);