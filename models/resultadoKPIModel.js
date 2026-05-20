const mongoose = require('mongoose');

const ResultadoKPISchema = new mongoose.Schema({
  id_kpi: { type: mongoose.Schema.Types.ObjectId, ref: 'KPI', required: true },
  id_entidade: { type: mongoose.Schema.Types.ObjectId, ref: 'Entidade', required: true },
  id_periodo: { type: mongoose.Schema.Types.ObjectId, ref: 'Periodo', required: true },
  id_unidade: { type: mongoose.Schema.Types.ObjectId, ref: 'UnidadeMedida', required: true },
  valor_calculado: { type: Number, required: true },
  data_calculo: { type: Date, default: Date.now },
  estado_validacao: { type: String, default: 'Calculado' },
  data_validacao: { type: Date },
  
  // Tabelas de ligação transformadas em arrays de referências para performance:
  id_dados_origem: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Dado' }], // ResultadoKPI_Dado
  depende_de_resultados: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ResultadoKPI' }] // ResultadoKPI_Relacao
}, { timestamps: true });

module.exports = mongoose.model('ResultadoKPI', ResultadoKPISchema);