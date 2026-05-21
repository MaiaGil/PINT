const KPIComposicao = require('../models/kpiComposicaoModel');
const KPI = require('../models/kpiModel');
const Metrica = require('../models/metricaModel');

// @desc    Adicionar uma métrica à fórmula de um KPI
// @route   POST /api/kpi-composicoes
const criarKPIComposicao = async (req, res) => {
    try {
        const { id_kpi, id_metrica, papel, multiplicador } = req.body;

        // 1. Verificar se a composição já existe (índice composto)
        const composicaoExistente = await KPIComposicao.findOne({ id_kpi, id_metrica });
        if (composicaoExistente) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: "Esta métrica já está associada a este KPI." 
            });
        }

        // 2. Verificar se o KPI existe
        const kpiExiste = await KPI.findOne({ id_kpi });
        if (!kpiExiste) return res.status(404).json({ sucesso: false, mensagem: "O KPI indicado não existe." });

        // 3. Verificar se a Métrica existe
        const metricaExiste = await Metrica.findOne({ id_metrica });
        if (!metricaExiste) return res.status(404).json({ sucesso: false, mensagem: "A métrica indicada não existe." });

        // 4. Criar a composição
        const novaComposicao = new KPIComposicao({
            id_kpi,
            id_metrica,
            papel,
            multiplicador
        });

        await novaComposicao.save();
        
        res.status(201).json({
            sucesso: true,
            mensagem: "🧩 Métrica adicionada à composição do KPI com sucesso!",
            dados: novaComposicao
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ sucesso: false, erro: error.message });
        }
        res.status(500).json({ sucesso: false, erro: "Erro interno ao criar a composição do KPI." });
    }
};

// @desc    Listar TODAS as composições do sistema (visão global)
// @route   GET /api/kpi-composicoes
const obterKPIComposicoes = async (req, res) => {
    try {
        const composicoes = await KPIComposicao.find()
            .populate('id_kpi', 'nome tipo_agregacao')
            .populate('id_metrica', 'nome pilar natureza');

        res.status(200).json({
            sucesso: true,
            quantidade: composicoes.length,
            dados: composicoes
        });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: "Erro ao obter as composições." });
    }
};

// @desc    Obter todas as métricas que compõem UM KPI ESPECÍFICO (Excelente para o Dashboard)
// @route   GET /api/kpi-composicoes/kpi/:id_kpi
const obterComposicaoDeUmKPI = async (req, res) => {
    try {
        const composicoesDoKPI = await KPIComposicao.find({ id_kpi: req.params.id_kpi })
            .populate('id_metrica', 'nome pilar subcategoria unidade_preferencial');
        
        if (!composicoesDoKPI || composicoesDoKPI.length === 0) {
            return res.status(404).json({ sucesso: false, mensagem: "Nenhuma métrica associada a este KPI." });
        }

        res.status(200).json({ sucesso: true, quantidade: composicoesDoKPI.length, dados: composicoesDoKPI });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: "Erro ao procurar as métricas do KPI." });
    }
};

// @desc    Atualizar o papel ou multiplicador de uma métrica num KPI
// @route   PUT /api/kpi-composicoes/:id_kpi/:id_metrica
const atualizarKPIComposicao = async (req, res) => {
    try {
        const { id_kpi, id_metrica } = req.params;
        const opcoes = { new: true, runValidators: true }; 
        
        const composicaoAtualizada = await KPIComposicao.findOneAndUpdate(
            { id_kpi, id_metrica },
            req.body,
            opcoes
        )
        .populate('id_kpi', 'nome')
        .populate('id_metrica', 'nome');

        if (!composicaoAtualizada) {
            return res.status(404).json({ sucesso: false, mensagem: "Composição não encontrada para atualização." });
        }

        res.status(200).json({
            sucesso: true,
            mensagem: "🧩 Composição do KPI atualizada com sucesso!",
            dados: composicaoAtualizada
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ sucesso: false, erro: error.message });
        }
        res.status(500).json({ sucesso: false, erro: "Erro ao atualizar a composição do KPI." });
    }
};

// @desc    Remover uma métrica da fórmula de um KPI
// @route   DELETE /api/kpi-composicoes/:id_kpi/:id_metrica
const eliminarKPIComposicao = async (req, res) => {
    try {
        const { id_kpi, id_metrica } = req.params;
        
        const composicaoEliminada = await KPIComposicao.findOneAndDelete({ id_kpi, id_metrica });

        if (!composicaoEliminada) {
            return res.status(404).json({ sucesso: false, mensagem: "Composição não encontrada para eliminação." });
        }

        res.status(200).json({
            sucesso: true,
            mensagem: `🧩 Métrica removida do KPI com sucesso.`
        });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: "Erro ao eliminar a composição." });
    }
};

module.exports = {
    criarKPIComposicao,
    obterKPIComposicoes,
    obterComposicaoDeUmKPI,
    atualizarKPIComposicao,
    eliminarKPIComposicao
};