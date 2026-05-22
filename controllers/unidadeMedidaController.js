const UnidadeMedida = require('../models/unidadeMedidaModel');

// @desc    Criar uma nova unidade de medida
// @route   POST /api/unidades-medida
const criarUnidadeMedida = async (req, res) => {
    try {
        const { id_unidade, nome, simbolo, tipo_unidade } = req.body;

        if (!id_unidade || !nome || !simbolo || !tipo_unidade) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Todos os campos são obrigatórios: id_unidade, nome, simbolo, tipo_unidade.'
            });
        }

        const unidadeExistente = await UnidadeMedida.findOne({ 
            id_unidade: id_unidade.toUpperCase().trim() 
        });

        if (unidadeExistente) {
            return res.status(409).json({ 
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
            mensagem: 'Unidade de Medida registada com sucesso.',
            dados: novaUnidade
        });

    } catch (error) {
        console.error("🔥 ERRO REAL AO CRIAR UNIDADE:", error);
        if (error.name === 'ValidationError') {
            const erros = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ sucesso: false, erros });
        }
        res.status(500).json({ sucesso: false, erro: 'Erro interno ao criar a unidade de medida.' });
    }
};

// @desc    Listar todas as unidades de medida
// @route   GET /api/unidades-medida
const obterUnidadesMedida = async (req, res) => {
    try {
        const { tipo_unidade } = req.query;

        const filtro = tipo_unidade ? { tipo_unidade: tipo_unidade.toUpperCase() } : {};

        const unidades = await UnidadeMedida.find(filtro).sort({ tipo_unidade: 1, nome: 1 });

        res.status(200).json({
            sucesso: true,
            quantidade: unidades.length,
            dados: unidades
        });

    } catch (error) {
        res.status(500).json({ sucesso: false, erro: 'Erro ao obter as unidades de medida.' });
    }
};

// @desc    Obter uma unidade específica pelo id_unidade
// @route   GET /api/unidades-medida/:id
const obterUnidadePorId = async (req, res) => {
    try {
        const unidade = await UnidadeMedida.findOne({ 
            id_unidade: req.params.id.toUpperCase() 
        });
        
        if (!unidade) {
            return res.status(404).json({ 
                sucesso: false, 
                mensagem: `Unidade '${req.params.id}' não encontrada.` 
            });
        }

        res.status(200).json({ sucesso: true, dados: unidade });

    } catch (error) {
        res.status(500).json({ sucesso: false, erro: 'Erro ao procurar a unidade.' });
    }
};

// @desc    Atualizar uma unidade existente
// @route   PUT /api/unidades-medida/:id
const atualizarUnidadeMedida = async (req, res) => {
    try {
        // Impede alteração do id_unidade via PUT
        delete req.body.id_unidade;

        const unidadeAtualizada = await UnidadeMedida.findOneAndUpdate(
            { id_unidade: req.params.id.toUpperCase() },
            req.body,
            { new: true, runValidators: true }
        );

        if (!unidadeAtualizada) {
            return res.status(404).json({ 
                sucesso: false, 
                mensagem: `Unidade '${req.params.id}' não encontrada para atualização.` 
            });
        }

        res.status(200).json({
            sucesso: true,
            mensagem: 'Unidade de Medida atualizada com sucesso.',
            dados: unidadeAtualizada
        });

    } catch (error) {
        if (error.name === 'ValidationError') {
            const erros = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ sucesso: false, erros });
        }
        res.status(500).json({ sucesso: false, erro: 'Erro ao atualizar a unidade.' });
    }
};

// @desc    Eliminar uma unidade de medida
// @route   DELETE /api/unidades-medida/:id
const eliminarUnidadeMedida = async (req, res) => {
    try {
        const unidadeEliminada = await UnidadeMedida.findOneAndDelete({ 
            id_unidade: req.params.id.toUpperCase() 
        });

        if (!unidadeEliminada) {
            return res.status(404).json({ 
                sucesso: false, 
                mensagem: `Unidade '${req.params.id}' não encontrada para eliminação.` 
            });
        }

        res.status(200).json({
            sucesso: true,
            mensagem: `Unidade '${req.params.id}' removida com sucesso.`
        });

    } catch (error) {
        res.status(500).json({ sucesso: false, erro: 'Erro ao eliminar a unidade.' });
    }
};

module.exports = {
    criarUnidadeMedida,
    obterUnidadesMedida,
    obterUnidadePorId,
    atualizarUnidadeMedida,
    eliminarUnidadeMedida
};