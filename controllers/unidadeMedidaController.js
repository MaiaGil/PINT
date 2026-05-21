const UnidadeMedida = require('../models/unidadeMedidaModel');

// @desc    Criar uma nova unidade de medida
// @route   POST /api/unidades-medida
const criarUnidadeMedida = async (req, res) => {
    try {
        const { id_unidade, nome, simbolo, tipo_unidade } = req.body;

        const unidadeExistente = await UnidadeMedida.findOne({ id_unidade });
        if (unidadeExistente) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: `A unidade com o ID '${id_unidade}' já se encontra registada.` 
            });
        }

        const novaUnidade = new UnidadeMedida({
            id_unidade,
            nome,
            simbolo,
            tipo_unidade
        });

        await novaUnidade.save();
        
        res.status(201).json({
            sucesso: true,
            mensagem: "📏 Unidade de Medida registada com sucesso!",
            dados: novaUnidade
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ sucesso: false, erro: error.message });
        }
        res.status(500).json({ sucesso: false, erro: "Erro interno ao criar a unidade de medida." });
    }
};

// @desc    Listar todas as unidades de medida
// @route   GET /api/unidades-medida
const obterUnidadesMedida = async (req, res) => {
    try {
        // Ordena por tipo de unidade e depois por nome para ficar arrumadinho no frontend
        const unidades = await UnidadeMedida.find().sort({ tipo_unidade: 1, nome: 1 });
        res.status(200).json({
            sucesso: true,
            quantidade: unidades.length,
            dados: unidades
        });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: "Erro ao obter as unidades de medida." });
    }
};

// @desc    Obter uma unidade específica pelo id_unidade
// @route   GET /api/unidades-medida/:id
const obterUnidadePorId = async (req, res) => {
    try {
        const unidade = await UnidadeMedida.findOne({ id_unidade: req.params.id });
        
        if (!unidade) {
            return res.status(404).json({ sucesso: false, mensagem: "Unidade de Medida não encontrada." });
        }

        res.status(200).json({ sucesso: true, dados: unidade });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: "Erro ao procurar a unidade." });
    }
};

// @desc    Atualizar uma unidade existente
// @route   PUT /api/unidades-medida/:id
const atualizarUnidadeMedida = async (req, res) => {
    try {
        const opcoes = { new: true, runValidators: true }; 
        
        const unidadeAtualizada = await UnidadeMedida.findOneAndUpdate(
            { id_unidade: req.params.id },
            req.body,
            opcoes
        );

        if (!unidadeAtualizada) {
            return res.status(404).json({ sucesso: false, mensagem: "Unidade não encontrada para atualização." });
        }

        res.status(200).json({
            sucesso: true,
            mensagem: "📏 Unidade de Medida atualizada com sucesso!",
            dados: unidadeAtualizada
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ sucesso: false, erro: error.message });
        }
        res.status(500).json({ sucesso: false, erro: "Erro ao atualizar a unidade." });
    }
};

// @desc    Eliminar uma unidade de medida
// @route   DELETE /api/unidades-medida/:id
const eliminarUnidadeMedida = async (req, res) => {
    try {
        const unidadeEliminada = await UnidadeMedida.findOneAndDelete({ id_unidade: req.params.id });

        if (!unidadeEliminada) {
            return res.status(404).json({ sucesso: false, mensagem: "Unidade não encontrada para eliminação." });
        }

        res.status(200).json({
            sucesso: true,
            mensagem: `📏 Unidade '${req.params.id}' removida com sucesso do sistema.`
        });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: "Erro ao eliminar a unidade." });
    }
};

module.exports = {
    criarUnidadeMedida,
    obterUnidadesMedida,
    obterUnidadePorId,
    atualizarUnidadeMedida,
    eliminarUnidadeMedida
};