const UnidadeMedida = require('../models/UnidadeMedida');
const factory = require('./baseController');

exports.getAllUnidades = factory.getAll(UnidadeMedida);
exports.getUnidade = factory.getOne(UnidadeMedida);
exports.createUnidade = factory.create(UnidadeMedida);
exports.updateUnidade = factory.update(UnidadeMedida);
exports.deleteUnidade = factory.delete(UnidadeMedida);