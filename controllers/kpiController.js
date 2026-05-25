const KPI = require('../models/kpiModel');
const { TIPOS_AGREGACAO } = require('../models/kpiModel');
const UnidadeMedida = require('../models/unidadeMedidaModel');

const gerarIdKPI = (nome) => {
    return 'kpi_' + nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')   // remove acentos
        .replace(/[^a-z0-9\s]/g, '')       // remove especiais
        .trim()
        .replace(/\s+/g, '_');             // espaços → underscore
};

const criarKPI = async (req, res) => {
    try {
        const { nome, tipo_agregacao, formula, id_unidade_resultado, norma_referencia, ativo } = req.body;

        const id_kpi = gerarIdKPI(nome);

        const kpiExistente = await KPI.findOne({ id_kpi });
        if (kpiExistente) {
            return res.status(400).json({
                sucesso: false,
                mensagem: `O KPI '${id_kpi}' já existe.`
            });
        }

        const unidadeExiste = await UnidadeMedida.findOne({ id_unidade: id_unidade_resultado });
        if (!unidadeExiste) {
            return res.status(404).json({
                sucesso: false,
                mensagem: `Unidade '${id_unidade_resultado}' não existe.`
            });
        }

        const novoKPI = new KPI({ id_kpi, nome, tipo_agregacao, formula, id_unidade_resultado, norma_referencia, ativo });
        await novoKPI.save();

        res.status(201).json({ sucesso: true, mensagem: "KPI criado com sucesso.", dados: novoKPI });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ sucesso: false, erro: error.message });
        }
        res.status(500).json({ sucesso: false, erro: "Erro interno ao criar o KPI." });
    }
};

const obterKPIs = async (req, res) => {
    try {
        // Removido o .populate() que estava a causar o crash com as strings
        const kpis = await KPI.find()
            .sort({ nome: 1 });
            
        res.status(200).json({ sucesso: true, quantidade: kpis.length, dados: kpis });
    } catch (error) {
        console.error("🔥 ERRO REAL NOS KPIS:", error); // Blindagem extra
        res.status(500).json({ sucesso: false, erro: "Erro ao obter KPIs." });
    }
};

const obterKPIPorId = async (req, res) => {
    try {
        // Removido o .populate() aqui também
        const kpi = await KPI.findOne({ id_kpi: req.params.id });
            
        if (!kpi) return res.status(404).json({ sucesso: false, mensagem: "KPI não encontrado." });
        res.status(200).json({ sucesso: true, dados: kpi });
    } catch (error) {
        console.error("🔥 ERRO REAL AO PROCURAR KPI:", error);
        res.status(500).json({ sucesso: false, erro: "Erro ao procurar o KPI." });
    }
};

const atualizarKPI = async (req, res) => {
    try {
        const { id } = req.params;
        
        // 1. Validar se a unidade existe (mantido igual)
        if (req.body.id_unidade_resultado) {
            const unidadeExiste = await UnidadeMedida.findOne({ id_unidade: req.body.id_unidade_resultado });
            if (!unidadeExiste) {
                return res.status(404).json({ sucesso: false, mensagem: "Unidade de resultado não existe." });
            }
        }

        // 2. FILTRAGEM DE SEGURANÇA: Garantir que só passamos campos que o Mongoose conhece
        // Isto elimina campos "sujos" enviados pelo Angular (como unidade_modo)
        const camposPermitidos = {
            nome: req.body.nome,
            tipo_agregacao: req.body.tipo_agregacao,
            formula: req.body.formula, // Já vem stringificada do Angular
            id_unidade_resultado: req.body.id_unidade_resultado,
            norma_referencia: req.body.norma_referencia,
            ativo: req.body.ativo
        };

        // 3. Atualizar e fazer o populate
        const kpiAtualizado = await KPI.findOneAndUpdate(
            { id_kpi: id },
            { $set: camposPermitidos }, 
            { new: true, runValidators: true }
        );

        if (!kpiAtualizado) {
            return res.status(404).json({ sucesso: false, mensagem: "KPI não encontrado." });
        }

        res.status(200).json({ sucesso: true, mensagem: "KPI atualizado.", dados: kpiAtualizado });
        
    } catch (error) {
        // Log para veres o erro real no terminal
        console.error("Erro detalhado do Mongoose:", error);
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({ sucesso: false, erro: error.message });
        }
        res.status(500).json({ sucesso: false, erro: "Erro ao atualizar o KPI." });
    }
};

const eliminarKPI = async (req, res) => {
    try {
        const kpiEliminado = await KPI.findOneAndDelete({ id_kpi: req.params.id });

        if (!kpiEliminado) return res.status(404).json({ sucesso: false, mensagem: "KPI não encontrado." });

        res.status(200).json({ sucesso: true, mensagem: `KPI '${req.params.id}' eliminado.` });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: "Erro ao eliminar o KPI." });
    }
};

// Expõe os enums para o frontend poder carregar dinamicamente
const obterEnums = async (req, res) => {
    res.status(200).json({
        sucesso: true,
        dados: { tipos_agregacao: TIPOS_AGREGACAO }
    });
};

module.exports = { criarKPI, obterKPIs, obterKPIPorId, atualizarKPI, eliminarKPI, obterEnums };