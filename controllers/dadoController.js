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

// @desc    Listar todos os dados (sem bloqueios de populate)
// @route   GET /api/dados
const obterDados = async (req, res) => {
    try {
        // Removidos os 5 .populate() que causavam o crash do Mongoose
        const dados = await Dado.find()
            .sort({ data_registo: -1 }); // Traz os mais recentes primeiro

        res.status(200).json({
            sucesso: true,
            quantidade: dados.length,
            dados: dados
        });
    } catch (error) {
        console.error("🔥 ERRO REAL EM OBTER DADOS:", error); // Adicionado para segurança
        res.status(500).json({ sucesso: false, erro: "Erro ao obter os dados registados." });
    }
};

// @desc    Obter um dado específico pelo id_dado
// @route   GET /api/dados/:id
const obterDadoPorId = async (req, res) => {
    try {
        // Removidos os .populate() aqui também
        const dado = await Dado.findOne({ id_dado: req.params.id });
        
        if (!dado) {
            return res.status(404).json({ sucesso: false, mensagem: "Dado não encontrado." });
        }

        res.status(200).json({ sucesso: true, dados: dado });
    } catch (error) {
        console.error("🔥 ERRO REAL EM OBTER DADO POR ID:", error);
        res.status(500).json({ sucesso: false, erro: "Erro ao procurar o dado." });
    }
};

const atualizarDado = async (req, res) => {
    try {
        // 1. Proteção: Impedimos alterações aos IDs estruturais
        delete req.body.id_dado;
        delete req.body._id;

        // 2. Lógica de negócio: Registar data exata se o estado mudar para VALIDADO
        if (req.body.estado_validacao === 'VALIDADO' && !req.body.data_validacao) {
            req.body.data_validacao = new Date();
        }

        // 3. Query Nativa: Usamos o $set para alterar SÓ os campos enviados,
        // garantindo que não substituímos o documento inteiro acidentalmente.
        const queryUpdate = { $set: req.body };
        const opcoes = { new: true, runValidators: true };

        const dadoAtualizado = await Dado.findOneAndUpdate(
            { id_dado: req.params.id },
            queryUpdate,
            opcoes
        );
        // NOTA: Removi os .populate() que tinhas aqui para evitar os crashes 
        // de CastError (Erro 500) que apanhámos nos KPIs!

        if (!dadoAtualizado) {
            return res.status(404).json({ 
                sucesso: false, 
                mensagem: "Dado não encontrado para atualização." 
            });
        }

        res.status(200).json({
            sucesso: true,
            mensagem: "💾 Valores atualizados diretamente na Base de Dados!",
            dados: dadoAtualizado
        });

    } catch (error) {
        console.error("🔥 ERRO REAL NA QUERY DE UPDATE (DADOS):", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ sucesso: false, erro: error.message });
        }
        res.status(500).json({ sucesso: false, erro: "Erro ao executar a query de atualização." });
    }
};

// @desc    Eliminar um dado (Drop do documento nativo)
// @route   DELETE /api/dados/:id
const eliminarDado = async (req, res) => {
    try {
        // Query de eliminação direta ao nível do documento
        const dadoEliminado = await Dado.findOneAndDelete({ 
            id_dado: req.params.id 
        });

        if (!dadoEliminado) {
            return res.status(404).json({ 
                sucesso: false, 
                mensagem: "Dado não encontrado para eliminação." 
            });
        }

        res.status(200).json({
            sucesso: true,
            mensagem: `🗑️ Dado '${req.params.id}' apagado definitivamente da base de dados.`
        });

    } catch (error) {
        console.error("🔥 ERRO REAL NA QUERY DE DELETE (DADOS):", error);
        res.status(500).json({ sucesso: false, erro: "Erro ao executar a query de eliminação." });
    }
};

module.exports = {
    criarDado,
    obterDados,
    obterDadoPorId,
    atualizarDado,
    eliminarDado
};