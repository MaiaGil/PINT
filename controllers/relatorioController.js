const Relatorio = require('../models/relatorioModel');

const getRelatorio = async (req, res) => { 
    try { 
        const relatorios = await Relatorio.find()
            .populate('id_entidade')
            .populate('id_periodo');
        res.json(relatorios); 
    } 
    catch (error) { 
        res.status(500).json({ message: error.message }); 
    } 
}; 

const createRelatorio = async (req, res) => {
    try {
        const { id_entidade, id_periodo } = req.params;
        const { versao_esquema } = req.body;
  
        const novoRelatorio = new Relatorio({
            id_entidade, 
            id_periodo,
            versao_esquema 
        });
  
        const relatorioGuardado = await novoRelatorio.save();
        return res.status(201).json(relatorioGuardado);
    } catch (error) {
        return res.status(400).json({ 
            mensagem: 'Erro ao criar o relatório.', 
            erro: error.message 
        });
    }
};

module.exports = { 
    getRelatorio,
    createRelatorio
};