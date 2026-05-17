const mongoose = require('mongoose');

const EntidadeSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  sede: String,
  nif: { type: String, unique: true },
  acesso_log: Number
});

module.exports = mongoose.model('Entidade', EntidadeSchema);