const Metrica = require('../models/Metrica');
const factory = require('./baseController');

exports.getAllMetricas = factory.getAll(Metrica, ['id_unidade_base']);
exports.getMetrica = factory.getOne(Metrica, ['id_unidade_base']);
exports.createMetrica = factory.create(Metrica);
exports.updateMetrica = factory.update(Metrica);
exports.deleteMetrica = factory.delete(Metrica);