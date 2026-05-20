const Documento = require('../models/Documento');
const factory = require('./baseController');

const pops = ['id_entidade', 'id_periodo'];

exports.getAllDocumentos = factory.getAll(Documento, pops);
exports.getDocumento = factory.getOne(Documento, pops);
exports.createDocumento = factory.create(Documento);
exports.updateDocumento = factory.update(Documento);
exports.deleteDocumento = factory.delete(Documento);