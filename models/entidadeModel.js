const mongoose = require('mongoose');

const EntidadeSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  tipo_entidade: { type: String, required: true },
  pais: { type: String, required: true },
  nif: { type: String, required: true, unique: true }
}, { timestamps: true });

module.exports = mongoose.model('Entidade', EntidadeSchema);