const Metrica = require('../models/metricaModel');
const UnidadeMedida = require('../models/unidadeMedidaModel');

// @desc    Criar uma nova métrica
// @route   POST /api/metricas
const criarMetrica = async (req, res) => {
    try {
        const { 
            id_metrica, nome, pilar, subcategoria, 
            natureza, id_unidade_base, norma_referencia, ativo 
        } = req.body;

        // 1. Verificar se a métrica já existe
        const metricaExistente = await Metrica.findOne({ id_metrica });
        if (metricaExistente) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: `A métrica com o ID '${id_metrica}' já se encontra registada.` 
            });
        }

        // 2. Verificar Integridade Referencial (Garantir que a Unidade Base existe)
        if (id_unidade_base) {
            const unidadeExiste = await UnidadeMedida.findOne({ id_unidade: id_unidade_base });
            if (!unidadeExiste) {
                return res.status(404).json({ 
                    sucesso: false, 
                    mensagem: `A unidade de medida '${id_unidade_base}' não existe no sistema.` 
                });
            }
        }

        // 3. Criar a métrica
        const novaMetrica = new Metrica({
            id_metrica,
            nome,
            pilar,
            subcategoria,
            natureza,
            id_unidade_base,
            norma_referencia,
            ativo
        });

        await novaMetrica.save();
        
        res.status(201).json({
            sucesso: true,
            mensagem: "📊 Métrica registada com sucesso!",
            dados: novaMetrica
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ sucesso: false, erro: error.message });
        }
        res.status(500).json({ sucesso: false, erro: "Erro interno ao criar a métrica." });
    }
};

// @desc    Listar todas as métricas
// @route   GET /api/metricas
const obterMetricas = async (req, res) => {
    try {
        // O .populate vai buscar os dados reais da unidade de medida em vez de mostrar só o ID!
        const metricas = await Metrica.find()
            .populate('id_unidade_base', 'nome simbolo') 
            .sort({ pilar: 1, nome: 1 });

        res.status(200).json({
            sucesso: true,
            quantidade: metricas.length,
            dados: metricas
        });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: "Erro ao obter as métricas." });
    }
};

// @desc    Obter uma métrica específica pelo id_metrica
// @route   GET /api/metricas/:id
const obterMetricaPorId = async (req, res) => {
    try {
        const metrica = await Metrica.findOne({ id_metrica: req.params.id })
            .populate('id_unidade_base', 'nome simbolo');
        
        if (!metrica) {
            return res.status(404).json({ sucesso: false, mensagem: "Métrica não encontrada." });
        }

        res.status(200).json({ sucesso: true, dados: metrica });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: "Erro ao procurar a métrica." });
    }
};

// @desc    Atualizar uma métrica existente
// @route   PUT /api/metricas/:id
const atualizarMetrica = async (req, res) => {
    try {
        // Se estiverem a tentar alterar a unidade base, verificar se a nova unidade existe
        if (req.body.id_unidade_base) {
            const unidadeExiste = await UnidadeMedida.findOne({ id_unidade: req.body.id_unidade_base });
            if (!unidadeExiste) {
                return res.status(404).json({ sucesso: false, mensagem: "A nova unidade de medida especificada não existe." });
            }
        }

        const opcoes = { new: true, runValidators: true }; 
        
        const metricaAtualizada = await Metrica.findOneAndUpdate(
            { id_metrica: req.params.id },
            req.body,
            opcoes
        ).populate('id_unidade_base', 'nome simbolo');

        if (!metricaAtualizada) {
            return res.status(404).json({ sucesso: false, mensagem: "Métrica não encontrada para atualização." });
        }

        res.status(200).json({
            sucesso: true,
            mensagem: "📊 Métrica atualizada com sucesso!",
            dados: metricaAtualizada
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ sucesso: false, erro: error.message });
        }
        res.status(500).json({ sucesso: false, erro: "Erro ao atualizar a métrica." });
    }
};

// @desc    Eliminar uma métrica
// @route   DELETE /api/metricas/:id
const eliminarMetrica = async (req, res) => {
    try {
        const metricaEliminada = await Metrica.findOneAndDelete({ id_metrica: req.params.id });

        if (!metricaEliminada) {
            return res.status(404).json({ sucesso: false, mensagem: "Métrica não encontrada para eliminação." });
        }

        res.status(200).json({
            sucesso: true,
            mensagem: `📊 Métrica '${req.params.id}' removida com sucesso do sistema.`
        });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: "Erro ao eliminar a métrica." });
    }
};

module.exports = {
    criarMetrica,
    obterMetricas,
    obterMetricaPorId,
    atualizarMetrica,
    eliminarMetrica
};