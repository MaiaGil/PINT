const mongoose = require('mongoose');

const TipoMaterialSchema = new mongoose.Schema({
  nome: String,
  unidade: String,
  categoria: String
});

module.exports = mongoose.model('TipoMaterial', TipoMaterialSchema);