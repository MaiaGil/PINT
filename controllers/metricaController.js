const Metrica = require('../models/metricaModel');
const { PILARES, NATUREZAS } = require('../models/metricaModel');
const UnidadeMedida = require('../models/unidadeMedidaModel');

const gerarIdMetrica = (nome) =>
    'met_' + nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '_');

const criarMetrica = async (req, res) => {
    try {
        const { nome, pilar, subcategoria, natureza, id_unidade_base, norma_referencia, ativo } = req.body;

        const id_metrica = gerarIdMetrica(nome);

        const metricaExistente = await Metrica.findOne({ id_metrica });
        if (metricaExistente) {
            return res.status(400).json({ sucesso: false, mensagem: `Já existe uma métrica com o ID '${id_metrica}'.` });
        }

        const unidadeExiste = await UnidadeMedida.findOne({ id_unidade: id_unidade_base });
        if (!unidadeExiste) {
            return res.status(404).json({ sucesso: false, mensagem: `Unidade '${id_unidade_base}' não existe.` });
        }

        const novaMetrica = new Metrica({ id_metrica, nome, pilar, subcategoria, natureza, id_unidade_base, norma_referencia, ativo });
        await novaMetrica.save();

        res.status(201).json({ sucesso: true, mensagem: "Métrica criada com sucesso.", dados: novaMetrica });
    } catch (error) {
        if (error.name === 'ValidationError') return res.status(400).json({ sucesso: false, erro: error.message });
        res.status(500).json({ sucesso: false, erro: "Erro interno ao criar a métrica." });
    }
};

const obterMetricas = async (req, res) => {
    try {
        // Removido o .populate() que estava a causar o crash com as strings
        const metricas = await Metrica.find()
            .sort({ pilar: 1, nome: 1 });
            
        res.status(200).json({ sucesso: true, quantidade: metricas.length, dados: metricas });
    } catch (error) {
        console.error("🔥 ERRO REAL NAS MÉTRICAS:", error); // Blindagem extra
        res.status(500).json({ sucesso: false, erro: "Erro ao obter métricas." });
    }
};

const obterMetricaPorId = async (req, res) => {
    try {
        // Removido o .populate() também aqui
        const metrica = await Metrica.findOne({ id_metrica: req.params.id });
            
        if (!metrica) return res.status(404).json({ sucesso: false, mensagem: "Métrica não encontrada." });
        res.status(200).json({ sucesso: true, dados: metrica });
    } catch (error) {
        console.error("🔥 ERRO REAL AO PROCURAR MÉTRICA:", error);
        res.status(500).json({ sucesso: false, erro: "Erro ao procurar a métrica." });
    }
};

const atualizarMetrica = async (req, res) => {
    try {
        if (req.body.id_unidade_base) {
            const unidadeExiste = await UnidadeMedida.findOne({ id_unidade: req.body.id_unidade_base });
            if (!unidadeExiste) return res.status(404).json({ sucesso: false, mensagem: "Unidade não existe." });
        }
        const metricaAtualizada = await Metrica.findOneAndUpdate(
            { id_metrica: req.params.id },
            req.body,
            { new: true, runValidators: true }
        ).populate('id_unidade_base', 'nome simbolo');

        if (!metricaAtualizada) return res.status(404).json({ sucesso: false, mensagem: "Métrica não encontrada." });
        res.status(200).json({ sucesso: true, mensagem: "Métrica atualizada.", dados: metricaAtualizada });
    } catch (error) {
        if (error.name === 'ValidationError') return res.status(400).json({ sucesso: false, erro: error.message });
        res.status(500).json({ sucesso: false, erro: "Erro ao atualizar a métrica." });
    }
};

const eliminarMetrica = async (req, res) => {
    try {
        const metricaEliminada = await Metrica.findOneAndDelete({ id_metrica: req.params.id });
        if (!metricaEliminada) return res.status(404).json({ sucesso: false, mensagem: "Métrica não encontrada." });
        res.status(200).json({ sucesso: true, mensagem: `Métrica '${req.params.id}' eliminada.` });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: "Erro ao eliminar a métrica." });
    }
};

const obterEnums = async (req, res) => {
    res.status(200).json({ sucesso: true, dados: { pilares: PILARES, naturezas: NATUREZAS } });
};

module.exports = { criarMetrica, obterMetricas, obterMetricaPorId, atualizarMetrica, eliminarMetrica, obterEnums };