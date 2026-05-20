const Entidade = require('../models/Entidade');
const factory = require('./baseController');

exports.getAllEntidades = factory.getAll(Entidade);
exports.getEntidade = factory.getOne(Entidade);
exports.createEntidade = factory.create(Entidade);
exports.updateEntidade = factory.update(Entidade);
exports.deleteEntidade = factory.delete(Entidade);