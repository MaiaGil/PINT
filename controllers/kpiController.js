const KPI = require('../models/KPI');
const factory = require('./baseController');

const pops = ['id_unidade_resultado', 'composicao.id_metrica'];

exports.getAllKPIs = factory.getAll(KPI, pops);
exports.getKPI = factory.getOne(KPI, pops);
exports.createKPI = factory.create(KPI);
exports.updateKPI = factory.update(KPI);
exports.deleteKPI = factory.delete(KPI);