const ResultadoKpiDado = require('../models/resultadoKpiDadoModel');
const ResultadoKPI = require('../models/resultadoKpiModel');
const Dado = require('../models/dadoModel');

// @desc    Associar um Dado bruto a um Resultado de KPI (Rastreabilidade)
// @route   POST /api/resultado-kpi-dados
const criarAssociacao = async (req, res) => {
    try {
        const { id_resultado, id_dado } = req.body;

        // 1. Verificar se a associação já existe
        const associacaoExiste = await ResultadoKpiDado.findOne({ id_resultado, id_dado });
        if (associacaoExiste) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: "Este dado já está associado a este resultado de KPI." 
            });
        }

        // 2. Verificar se o Resultado do KPI existe
        const resultadoExiste = await ResultadoKPI.findOne({ id_resultado });
        if (!resultadoExiste) return res.status(404).json({ sucesso: false, mensagem: "O resultado de KPI indicado não existe." });

        // 3. Verificar se o Dado existe
        const dadoExiste = await Dado.findOne({ id_dado });
        if (!dadoExiste) return res.status(404).json({ sucesso: false, mensagem: "O dado indicado não existe." });

        // 4. Criar a associação
        const novaAssociacao = new ResultadoKpiDado({ id_resultado, id_dado });
        await novaAssociacao.save();
        
        res.status(201).json({
            sucesso: true,
            mensagem: "🔗 Rastreabilidade registada com sucesso!",
            dados: novaAssociacao
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ sucesso: false, erro: error.message });
        }
        res.status(500).json({ sucesso: false, erro: "Erro interno ao criar a associação." });
    }
};

// @desc    Obter todos os dados/faturas que deram origem a um Resultado de KPI específico (O "Clique para Auditar")
// @route   GET /api/resultado-kpi-dados/resultado/:id_resultado
const obterDadosPorResultado = async (req, res) => {
    try {
        const faturasOrigem = await ResultadoKpiDado.find({ id_resultado: req.params.id_resultado })
            .populate({
                path: 'id_dado',
                select: 'valor valor_convertido_base origem id_metrica id_documento',
                populate: [
                    { path: 'id_metrica', select: 'nome' },
                    { path: 'id_documento', select: 'numero_documento ficheiro_origem' }
                ]
            });
        
        if (!faturasOrigem || faturasOrigem.length === 0) {
            return res.status(404).json({ 
                sucesso: false, 
                mensagem: "Não foram encontrados dados de origem para este resultado." 
            });
        }

        res.status(200).json({ 
            sucesso: true, 
            quantidade: faturasOrigem.length, 
            dados: faturasOrigem 
        });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: "Erro ao procurar os dados de origem." });
    }
};

// @desc    Remover um dado da composição de um resultado
// @route   DELETE /api/resultado-kpi-dados/:id_resultado/:id_dado
const eliminarAssociacao = async (req, res) => {
    try {
        const { id_resultado, id_dado } = req.params;
        
        const associacaoEliminada = await ResultadoKpiDado.findOneAndDelete({ id_resultado, id_dado });

        if (!associacaoEliminada) {
            return res.status(404).json({ sucesso: false, mensagem: "Associação não encontrada para eliminação." });
        }

        res.status(200).json({
            sucesso: true,
            mensagem: "🔗 Dado desvinculado do resultado do KPI com sucesso."
        });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: "Erro ao eliminar a associação." });
    }
};

module.exports = {
    criarAssociacao,
    obterDadosPorResultado,
    eliminarAssociacao
};