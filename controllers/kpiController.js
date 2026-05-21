const KPI = require('../models/kpiModel');
const UnidadeMedida = require('../models/unidadeMedidaModel');

// @desc    Criar um novo KPI
// @route   POST /api/kpis
const criarKPI = async (req, res) => {
    try {
        const { 
            id_kpi, nome, tipo_agregacao, formula, 
            id_unidade_resultado, norma_referencia, ativo 
        } = req.body;

        // 1. Verificar se o KPI já existe
        const kpiExistente = await KPI.findOne({ id_kpi });
        if (kpiExistente) {
            return res.status(400).json({ 
                sucesso: false, 
                mensagem: `O KPI com o ID '${id_kpi}' já se encontra registado.` 
            });
        }

        // 2. Verificar se a Unidade de Resultado existe
        const unidadeExiste = await UnidadeMedida.findOne({ id_unidade: id_unidade_resultado });
        if (!unidadeExiste) {
            return res.status(404).json({ 
                sucesso: false, 
                mensagem: `A unidade de medida '${id_unidade_resultado}' não existe no sistema.` 
            });
        }

        // 3. Criar o KPI
        const novoKPI = new KPI({
            id_kpi,
            nome,
            tipo_agregacao,
            formula,
            id_unidade_resultado,
            norma_referencia,
            ativo
        });

        await novoKPI.save();
        
        res.status(201).json({
            sucesso: true,
            mensagem: "📈 KPI criado com sucesso!",
            dados: novoKPI
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ sucesso: false, erro: error.message });
        }
        res.status(500).json({ sucesso: false, erro: "Erro interno ao criar o KPI." });
    }
};

// @desc    Listar todos os KPIs
// @route   GET /api/kpis
const obterKPIs = async (req, res) => {
    try {
        const kpis = await KPI.find()
            .populate('id_unidade_resultado', 'nome simbolo')
            .sort({ nome: 1 });

        res.status(200).json({
            sucesso: true,
            quantidade: kpis.length,
            dados: kpis
        });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: "Erro ao obter os KPIs." });
    }
};

// @desc    Obter um KPI específico pelo id_kpi
// @route   GET /api/kpis/:id
const obterKPIPorId = async (req, res) => {
    try {
        const kpi = await KPI.findOne({ id_kpi: req.params.id })
            .populate('id_unidade_resultado', 'nome simbolo');
        
        if (!kpi) {
            return res.status(404).json({ sucesso: false, mensagem: "KPI não encontrado." });
        }

        res.status(200).json({ sucesso: true, dados: kpi });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: "Erro ao procurar o KPI." });
    }
};

// @desc    Atualizar um KPI existente
// @route   PUT /api/kpis/:id
const atualizarKPI = async (req, res) => {
    try {
        // Se estiverem a tentar alterar a unidade de resultado, verificar se existe
        if (req.body.id_unidade_resultado) {
            const unidadeExiste = await UnidadeMedida.findOne({ id_unidade: req.body.id_unidade_resultado });
            if (!unidadeExiste) {
                return res.status(404).json({ sucesso: false, mensagem: "A nova unidade de resultado não existe." });
            }
        }

        const opcoes = { new: true, runValidators: true }; 
        
        const kpiAtualizado = await KPI.findOneAndUpdate(
            { id_kpi: req.params.id },
            req.body,
            opcoes
        ).populate('id_unidade_resultado', 'nome simbolo');

        if (!kpiAtualizado) {
            return res.status(404).json({ sucesso: false, mensagem: "KPI não encontrado para atualização." });
        }

        res.status(200).json({
            sucesso: true,
            mensagem: "📈 KPI atualizado com sucesso!",
            dados: kpiAtualizado
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ sucesso: false, erro: error.message });
        }
        res.status(500).json({ sucesso: false, erro: "Erro ao atualizar o KPI." });
    }
};

// @desc    Eliminar um KPI
// @route   DELETE /api/kpis/:id
const eliminarKPI = async (req, res) => {
    try {
        const kpiEliminado = await KPI.findOneAndDelete({ id_kpi: req.params.id });

        if (!kpiEliminado) {
            return res.status(404).json({ sucesso: false, mensagem: "KPI não encontrado para eliminação." });
        }

        res.status(200).json({
            sucesso: true,
            mensagem: `📈 KPI '${req.params.id}' removido com sucesso do sistema.`
        });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: "Erro ao eliminar o KPI." });
    }
};

module.exports = {
    criarKPI,
    obterKPIs,
    obterKPIPorId,
    atualizarKPI,
    eliminarKPI
};