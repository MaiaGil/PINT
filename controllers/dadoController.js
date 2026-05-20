const Dado = require('../models/Dado');
const factory = require('./baseController');

const pops = ['id_documento', 'id_metrica', 'id_entidade', 'id_periodo', 'id_unidade_original', 'id_fator'];

exports.getAllDados = factory.getAll(Dado, pops);
exports.getDado = factory.getOne(Dado, pops);
exports.createDado = factory.create(Dado);
exports.updateDado = factory.update(Dado);
exports.deleteDado = factory.delete(Dado);