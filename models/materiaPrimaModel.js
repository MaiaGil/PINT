const mongoose = require('mongoose');

const MateriaPrimaSchema = new mongoose.Schema({
  id_tipo_material: { type: mongoose.Schema.Types.ObjectId, ref: 'TipoMaterial' },
  quantidade_kg: Number,
  conteudo_reciclado_pct: Number,
  intensidade_carbonica: Number,
  processo_producao: String
});

module.exports = mongoose.model('MateriaPrima', MateriaPrimaSchema);