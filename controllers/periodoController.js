const Periodo = require('../models/periodoModel');

const getPeriodo = async (req, res) => { 
    try { 
        const periodos = await Periodo.find(); 
        res.json(periodos); 
    } 
    catch (error) { 
        res.status(500).json({ message: error.message }); 
    } 
}; 

const createPeriodo = async (req, res) => {
    try {
        const { 
            ano, 
            trimestre, 
            data_inicio, 
            data_fim 
        } = req.body;
  
        const novoPeriodo = new Periodo({
            ano, 
            trimestre, 
            data_inicio, 
            data_fim 
        });
  
        const periodoGuardado = await novoPeriodo.save();
        return res.status(201).json(periodoGuardado);
    } catch (error) {
        return res.status(400).json({ 
            mensagem: 'Erro ao criar o período.', 
            erro: error.message 
        });
    }
};

module.exports = { 
    getPeriodo,
    createPeriodo
};