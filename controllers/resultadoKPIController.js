const ResultadoKPI = require('../models/ResultadoKPI');
const factory = require('./baseController');

const pops = ['id_kpi', 'id_entidade', 'id_periodo', 'id_unidade', 'id_dados_origem', 'depende_de_resultados'];

exports.getAllResultados = factory.getAll(ResultadoKPI, pops);
exports.getResultado = factory.getOne(ResultadoKPI, pops);
exports.createResultado = factory.create(ResultadoKPI);
exports.updateResultado = factory.update(ResultadoKPI);
exports.deleteResultado = factory.delete(ResultadoKPI);