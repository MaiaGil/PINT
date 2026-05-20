const Periodo = require('../models/Periodo');
const factory = require('./baseController');

exports.getAllPeriodos = factory.getAll(Periodo);
exports.getPeriodo = factory.getOne(Periodo);
exports.createPeriodo = factory.create(Periodo);
exports.updatePeriodo = factory.update(Periodo);
exports.deletePeriodo = factory.delete(Periodo);