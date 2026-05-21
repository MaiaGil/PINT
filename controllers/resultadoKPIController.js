const ResultadoKPI = require('../models/resultadoKpiModel');
const KPI = require('../models/kpiModel');
const Entidade = require('../models/entidadeModel');
const Periodo = require('../models/periodoModel');
const UnidadeMedida = require('../models/unidadeMedidaModel');

// @desc    Registar um novo resultado de KPI calculado
// @route   POST /api/resultados-kpi
const criarResultadoKPI = async (req, res) => {
    try {
        const { 
            id_resultado, id_kpi, id_entidade, id_periodo, id_unidade, 
            valor_calculado, snapshot_formula, estado_validacao 
        } = req.body;

        // 1. Verificar se o ID do resultado já existe
        const resultadoExistente = await ResultadoKPI.findOne({ id_resultado });
        if (resultadoExistente) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: `O resultado com o ID '${id_resultado}' já se encontra registado.` 
            });
        }

        // 2. Validações de Integridade Referencial (Garantir que as FKs existem)
        const kpiExiste = await KPI.findOne({ id_kpi });
        if (!kpiExiste) return res.status(404).json({ sucesso: false, mensagem: "O KPI referenciado não existe." });

        const entidadeExiste = await Entidade.findOne({ id_entidade });
        if (!entidadeExiste) return res.status(404).json({ sucesso: false, mensagem: "A entidade referenciada não existe." });

        const periodoExiste = await Periodo.findOne({ id_periodo });
        if (!periodoExiste) return res.status(404).json({ sucesso: false, mensagem: "O período referenciado não existe." });

        const unidadeExiste = await UnidadeMedida.findOne({ id_unidade });
        if (!unidadeExiste) return res.status(404).json({ sucesso: false, mensagem: "A unidade referenciada não existe." });

        // 3. Registar o Resultado Final
        const novoResultado = new ResultadoKPI({
            id_resultado,
            id_kpi,
            id_entidade,
            id_periodo,
            id_unidade,
            valor_calculado,
            snapshot_formula,
            estado_validacao // Se vier como 'VALIDADO', podemos colocar a data_validacao automaticamente
        });

        if (estado_validacao === 'VALIDADO') {
            novoResultado.data_validacao = new Date();
        }

        await novoResultado.save();
        
        res.status(201).json({
            sucesso: true,
            mensagem: "🏆 Resultado do KPI registado com sucesso!",
            dados: novoResultado
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ sucesso: false, erro: error.message });
        }
        res.status(500).json({ sucesso: false, erro: "Erro interno ao registar o resultado do KPI." });
    }
};

// @desc    Listar todos os resultados (A Rota perfeita para o Dashboard)
// @route   GET /api/resultados-kpi
const obterResultadosKPI = async (req, res) => {
    try {
        const resultados = await ResultadoKPI.find()
            .populate('id_kpi', 'nome tipo_agregacao')
            .populate('id_entidade', 'nome tipo_entidade pais')
            .populate('id_periodo', 'tipo_periodo data_inicio data_fim')
            .populate('id_unidade', 'nome simbolo')
            .sort({ data_calculo: -1 });

        res.status(200).json({
            sucesso: true,
            quantidade: resultados.length,
            dados: resultados
        });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: "Erro ao obter os resultados." });
    }
};

// @desc    Obter um resultado específico pelo id_resultado
// @route   GET /api/resultados-kpi/:id
const obterResultadoPorId = async (req, res) => {
    try {
        const resultado = await ResultadoKPI.findOne({ id_resultado: req.params.id })
            .populate('id_kpi', 'nome')
            .populate('id_entidade', 'nome')
            .populate('id_periodo', 'tipo_periodo')
            .populate('id_unidade', 'simbolo');
        
        if (!resultado) {
            return res.status(404).json({ sucesso: false, mensagem: "Resultado não encontrado." });
        }

        res.status(200).json({ sucesso: true, dados: resultado });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: "Erro ao procurar o resultado." });
    }
};

// @desc    Atualizar um resultado (ex: Mudar de PENDENTE para VALIDADO)
// @route   PUT /api/resultados-kpi/:id
const atualizarResultadoKPI = async (req, res) => {
    try {
        const opcoes = { new: true, runValidators: true }; 
        
        // Automação: se o frontend enviar o estado como VALIDADO, injetamos a data de validação
        if (req.body.estado_validacao === 'VALIDADO') {
            req.body.data_validacao = new Date();
        }

        const resultadoAtualizado = await ResultadoKPI.findOneAndUpdate(
            { id_resultado: req.params.id },
            req.body,
            opcoes
        );

        if (!resultadoAtualizado) {
            return res.status(404).json({ sucesso: false, mensagem: "Resultado não encontrado para atualização." });
        }

        res.status(200).json({
            sucesso: true,
            mensagem: "🏆 Resultado atualizado com sucesso!",
            dados: resultadoAtualizado
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ sucesso: false, erro: error.message });
        }
        res.status(500).json({ sucesso: false, erro: "Erro ao atualizar o resultado." });
    }
};

// @desc    Eliminar um resultado
// @route   DELETE /api/resultados-kpi/:id
const eliminarResultadoKPI = async (req, res) => {
    try {
        const resultadoEliminado = await ResultadoKPI.findOneAndDelete({ id_resultado: req.params.id });

        if (!resultadoEliminado) {
            return res.status(404).json({ sucesso: false, mensagem: "Resultado não encontrado para eliminação." });
        }

        res.status(200).json({
            sucesso: true,
            mensagem: `🏆 Resultado '${req.params.id}' removido com sucesso.`
        });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: "Erro ao eliminar o resultado." });
    }
};

module.exports = {
    criarResultadoKPI,
    obterResultadosKPI,
    obterResultadoPorId,
    atualizarResultadoKPI,
    eliminarResultadoKPI
};