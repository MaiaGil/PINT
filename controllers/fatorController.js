const FatorConversao = require('../models/FatorConversao');
const factory = require('./baseController');

const pops = ['id_unidade_origem', 'id_unidade_destino'];

exports.getAllFatores = factory.getAll(FatorConversao, pops);
exports.getFator = factory.getOne(FatorConversao, pops);
exports.createFator = factory.create(FatorConversao);
exports.updateFator = factory.update(FatorConversao);
exports.deleteFator = factory.delete(FatorConversao);