const mongoose = require('mongoose');

const DocumentoSchema = new mongoose.Schema({
  id_entidade: { type: mongoose.Schema.Types.ObjectId, ref: 'Entidade', required: true },
  id_periodo: { type: mongoose.Schema.Types.ObjectId, ref: 'Periodo', required: true },
  tipo_documento: { type: String, required: true }, // ex: "Fatura", "Relatório de Sustentabilidade"
  numero_documento: { type: String, required: true },
  data_emissao: { type: Date, required: true },
  ficheiro_origem: { type: String, required: true }, // Caminho ou URL do PDF/S3
  estado: { type: String, default: 'Pendente' },
  fonte_ingestao: { type: String, required: true }, // ex: "API", "Manual", "OCR"
  versao_schema: { type: String, required: true },
  data_processamento: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Documento', DocumentoSchema);