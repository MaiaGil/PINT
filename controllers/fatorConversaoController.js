const FatorConversao = require('../models/fatorConversaoModel');
const UnidadeMedida = require('../models/unidadeMedidaModel');

// @desc    Criar um novo fator de conversão
// @route   POST /api/fatores-conversao
const criarFatorConversao = async (req, res) => {
    try {
        const { 
            id_fator, id_unidade_origem, id_unidade_destino, 
            fator, norma_referencia, validade_inicio, validade_fim 
        } = req.body;

        // 1. Verificar se o ID do fator já existe
        const fatorExistente = await FatorConversao.findOne({ id_fator });
        if (fatorExistente) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: `O fator de conversão com o ID '${id_fator}' já existe.` 
            });
        }

        // 2. Verificar se a Unidade de Origem existe
        const unidadeOrigemExiste = await UnidadeMedida.findOne({ id_unidade: id_unidade_origem });
        if (!unidadeOrigemExiste) {
            return res.status(404).json({ 
                sucesso: false, 
                mensagem: `A unidade de origem '${id_unidade_origem}' não foi encontrada no sistema.` 
            });
        }

        // 3. Verificar se a Unidade de Destino existe
        const unidadeDestinoExiste = await UnidadeMedida.findOne({ id_unidade: id_unidade_destino });
        if (!unidadeDestinoExiste) {
            return res.status(404).json({ 
                sucesso: false, 
                mensagem: `A unidade de destino '${id_unidade_destino}' não foi encontrada no sistema.` 
            });
        }

        // 4. Criar o fator
        const novoFator = new FatorConversao({
            id_fator,
            id_unidade_origem,
            id_unidade_destino,
            fator,
            norma_referencia,
            validade_inicio,
            validade_fim
        });

        await novoFator.save();
        
        res.status(201).json({
            sucesso: true,
            mensagem: "🔄 Fator de Conversão registado com sucesso!",
            dados: novoFator
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ sucesso: false, erro: error.message });
        }
        res.status(500).json({ sucesso: false, erro: "Erro interno ao criar o fator de conversão." });
    }
};

// @desc    Listar todos os fatores de conversão
// @route   GET /api/fatores-conversao
const obterFatoresConversao = async (req, res) => {
    try {
        // Popula as duas unidades para que o frontend saiba os nomes exatos (ex: Litro -> tCO2e)
        const fatores = await FatorConversao.find()
            .populate('id_unidade_origem', 'nome simbolo')
            .populate('id_unidade_destino', 'nome simbolo')
            .sort({ validade_inicio: -1 }); // Mais recentes primeiro

        res.status(200).json({
            sucesso: true,
            quantidade: fatores.length,
            dados: fatores
        });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: "Erro ao obter os fatores de conversão." });
    }
};

// @desc    Obter um fator específico pelo id_fator
// @route   GET /api/fatores-conversao/:id
const obterFatorPorId = async (req, res) => {
    try {
        const fator = await FatorConversao.findOne({ id_fator: req.params.id })
            .populate('id_unidade_origem', 'nome simbolo')
            .populate('id_unidade_destino', 'nome simbolo');
        
        if (!fator) {
            return res.status(404).json({ sucesso: false, mensagem: "Fator de conversão não encontrado." });
        }

        res.status(200).json({ sucesso: true, dados: fator });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: "Erro ao procurar o fator." });
    }
};

// @desc    Atualizar um fator existente
// @route   PUT /api/fatores-conversao/:id
const atualizarFatorConversao = async (req, res) => {
    try {
        // Validação das unidades caso elas venham no body do pedido de update
        if (req.body.id_unidade_origem) {
            const origemExiste = await UnidadeMedida.findOne({ id_unidade: req.body.id_unidade_origem });
            if (!origemExiste) return res.status(404).json({ sucesso: false, mensagem: "A nova unidade de origem não existe." });
        }
        if (req.body.id_unidade_destino) {
            const destinoExiste = await UnidadeMedida.findOne({ id_unidade: req.body.id_unidade_destino });
            if (!destinoExiste) return res.status(404).json({ sucesso: false, mensagem: "A nova unidade de destino não existe." });
        }

        const opcoes = { new: true, runValidators: true }; 
        
        const fatorAtualizado = await FatorConversao.findOneAndUpdate(
            { id_fator: req.params.id },
            req.body,
            opcoes
        )
        .populate('id_unidade_origem', 'nome simbolo')
        .populate('id_unidade_destino', 'nome simbolo');

        if (!fatorAtualizado) {
            return res.status(404).json({ sucesso: false, mensagem: "Fator não encontrado para atualização." });
        }

        res.status(200).json({
            sucesso: true,
            mensagem: "🔄 Fator de conversão atualizado com sucesso!",
            dados: fatorAtualizado
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ sucesso: false, erro: error.message });
        }
        res.status(500).json({ sucesso: false, erro: "Erro ao atualizar o fator." });
    }
};

// @desc    Eliminar um fator de conversão
// @route   DELETE /api/fatores-conversao/:id
const eliminarFatorConversao = async (req, res) => {
    try {
        const fatorEliminado = await FatorConversao.findOneAndDelete({ id_fator: req.params.id });

        if (!fatorEliminado) {
            return res.status(404).json({ sucesso: false, mensagem: "Fator não encontrado para eliminação." });
        }

        res.status(200).json({
            sucesso: true,
            mensagem: `🔄 Fator de conversão '${req.params.id}' removido com sucesso.`
        });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: "Erro ao eliminar o fator." });
    }
};

module.exports = {
    criarFatorConversao,
    obterFatoresConversao,
    obterFatorPorId,
    atualizarFatorConversao,
    eliminarFatorConversao
};