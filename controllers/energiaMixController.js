const EnergiaMix = require('../models/energiaMixModel');

const getEnergiaMix = async (req, res) => { 
    try { 
        const mix = await EnergiaMix.find(); 
        res.json(mix); 
    } 
    catch (error) { 
        res.status(500).json({ message: error.message }); 
    } 
}; 

const createEnergiaMix = async (req, res) => {
    try {
        const { id_energia_consumo } = req.params;
        const { 
            tipo_energia, 
            quantidade, 
            unidade, 
            equivalente_mwh 
        } = req.body;
  
        const novoMix = new EnergiaMix({
            id_energia_consumo, 
            tipo_energia, 
            quantidade, 
            unidade, 
            equivalente_mwh 
        });
  
        const mixGuardado = await novoMix.save();
        return res.status(201).json(mixGuardado);
    } catch (error) {
        return res.status(400).json({ 
            mensagem: 'Erro ao criar o registo de mix de energia.', 
            erro: error.message 
        });
    }
};

module.exports = { 
    getEnergiaMix,
    createEnergiaMix
};