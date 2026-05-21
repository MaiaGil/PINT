const Dado = require('../models/dadoModel');
const Metrica = require('../models/metricaModel');
const Entidade = require('../models/entidadeModel');
const Periodo = require('../models/periodoModel');

// @desc    Criar um novo dado (Registo de consumo, emissão, etc.)
// @route   POST /api/dados
const criarDado = async (req, res) => {
    try {
        const { 
            id_dado, id_documento, id_metrica, id_entidade, id_periodo, 
            id_unidade_original, id_unidade_base_esperada, id_fator, 
            valor, valor_convertido_base, origem, estado_validacao, observacao 
        } = req.body;

        // 1. Verificar se o ID já existe
        const dadoExistente = await Dado.findOne({ id_dado });
        if (dadoExistente) {
            return res.status(400).json({ sucesso: false, mensagem: "Este ID de dado já se encontra registado." });
        }

        // 2. Verificar Integridade Referencial Mínima (As chaves obrigatórias)
        const metricaExiste = await Metrica.findOne({ id_metrica });
        if (!metricaExiste) return res.status(404).json({ sucesso: false, mensagem: "A métrica indicada não existe." });

        const entidadeExiste = await Entidade.findOne({ id_entidade });
        if (!entidadeExiste) return res.status(404).json({ sucesso: false, mensagem: "A entidade indicada não existe." });

        const periodoExiste = await Periodo.findOne({ id_periodo });
        if (!periodoExiste) return res.status(404).json({ sucesso: false, mensagem: "O período indicado não existe." });

        // 3. Criar o dado
        const novoDado = new Dado({
            id_dado,
            id_documento, // Pode ser nulo se inserido manualmente
            id_metrica,
            id_entidade,
            id_periodo,
            id_unidade_original,
            id_unidade_base_esperada,
            id_fator, // Pode ser nulo até o cálculo ser feito
            valor,
            valor_convertido_base,
            origem, // Ex: 'INTERNO', 'EXTERNO', 'ESTIMADO' (conforme os teus enums)
            estado_validacao, // Ex: 'PENDENTE'
            observacao
        });

        await novoDado.save();
        
        res.status(201).json({
            sucesso: true,
            mensagem: "💾 Dado registado com sucesso!",
            dados: novoDado
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ sucesso: false, erro: error.message });
        }
        res.status(500).json({ sucesso: false, erro: "Erro interno ao criar o registo de dado." });
    }
};

// @desc    Listar todos os dados (com relacionamentos para o Dashboard)
// @route   GET /api/dados
const obterDados = async (req, res) => {
    try {
        // A magia acontece aqui: o populate vai traduzir os IDs em objetos reais
        const dados = await Dado.find()
            .populate('id_metrica', 'nome pilar subcategoria')
            .populate('id_entidade', 'nome tipo_entidade')
            .populate('id_periodo', 'tipo_periodo data_inicio data_fim')
            .populate('id_unidade_original', 'nome simbolo')
            .populate('id_unidade_base_esperada', 'simbolo')
            .sort({ data_registo: -1 }); // Traz os mais recentes primeiro

        res.status(200).json({
            sucesso: true,
            quantidade: dados.length,
            dados: dados
        });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: "Erro ao obter os dados registados." });
    }
};

// @desc    Obter um dado específico pelo id_dado
// @route   GET /api/dados/:id
const obterDadoPorId = async (req, res) => {
    try {
        const dado = await Dado.findOne({ id_dado: req.params.id })
            .populate('id_metrica', 'nome pilar subcategoria')
            .populate('id_entidade', 'nome tipo_entidade')
            .populate('id_periodo', 'tipo_periodo')
            .populate('id_unidade_original', 'nome simbolo');
        
        if (!dado) {
            return res.status(404).json({ sucesso: false, mensagem: "Dado não encontrado." });
        }

        res.status(200).json({ sucesso: true, dados: dado });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: "Erro ao procurar o dado." });
    }
};

// @desc    Atualizar um dado existente (Ex: Mudar estado para VALIDADO)
// @route   PUT /api/dados/:id
const atualizarDado = async (req, res) => {
    try {
        const opcoes = { new: true, runValidators: true }; 
        
        // Se a validação for alterada para VALIDADO, podemos registar a data
        if (req.body.estado_validacao === 'VALIDADO') {
            req.body.data_validacao = new Date();
        }

        const dadoAtualizado = await Dado.findOneAndUpdate(
            { id_dado: req.params.id },
            req.body,
            opcoes
        )
        .populate('id_metrica', 'nome pilar')
        .populate('id_entidade', 'nome');

        if (!dadoAtualizado) {
            return res.status(404).json({ sucesso: false, mensagem: "Dado não encontrado para atualização." });
        }

        res.status(200).json({
            sucesso: true,
            mensagem: "💾 Registo de dado atualizado com sucesso!",
            dados: dadoAtualizado
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ sucesso: false, erro: error.message });
        }
        res.status(500).json({ sucesso: false, erro: "Erro ao atualizar o dado." });
    }
};

// @desc    Eliminar um dado
// @route   DELETE /api/dados/:id
const eliminarDado = async (req, res) => {
    try {
        const dadoEliminado = await Dado.findOneAndDelete({ id_dado: req.params.id });

        if (!dadoEliminado) {
            return res.status(404).json({ sucesso: false, mensagem: "Dado não encontrado para eliminação." });
        }

        res.status(200).json({
            sucesso: true,
            mensagem: `💾 Dado '${req.params.id}' removido com sucesso.`
        });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: "Erro ao eliminar o dado." });
    }
};

module.exports = {
    criarDado,
    obterDados,
    obterDadoPorId,
    atualizarDado,
    eliminarDado
};