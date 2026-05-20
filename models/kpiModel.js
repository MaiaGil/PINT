const mongoose = require('mongoose');

const KPIComposicaoSchema = new mongoose.Schema({
  id_metrica: { type: mongoose.Schema.Types.ObjectId, ref: 'Metrica', required: true },
  papel: { type: String, required: true } // ex: "Numerador", "Denominador"
}, { _id: false });

const KPISchema = new mongoose.Schema({
  nome: { type: String, required: true },
  descricao: { type: String },
  tipo_agregacao: { type: String }, // ex: "Soma", "Média"
  formula: { type: String }, // Representação em string da fórmula
  id_unidade_resultado: { type: mongoose.Schema.Types.ObjectId, ref: 'UnidadeMedida', required: true },
  norma_referencia: { type: String },
  ativo: { type: Boolean, default: true },
  composicao: [KPIComposicaoSchema] // Tabela KPIComposicao mapeada diretamente aqui
}, { timestamps: true });

module.exports = mongoose.model('KPI', KPISchema);