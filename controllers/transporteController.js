const Transporte = require('../models/transporteModel');

const getTransporte = async (req, res) => { 
    try { 
        const transportes = await Transporte.find(); 
        res.json(transportes); 
    } 
    catch (error) { 
        res.status(500).json({ message: error.message }); 
    } 
}; 

const createTransporte = async (req, res) => {
    try {
        const { id_relatorio } = req.params;
        const { 
            cenario, 
            total_ton_km, 
            fator_emissao_tco2e_per_ton_km 
        } = req.body;
  
        const novoTransporte = new Transporte({
            id_relatorio, 
            cenario, 
            total_ton_km, 
            fator_emissao_tco2e_per_ton_km 
        });
  
        const transporteGuardado = await novoTransporte.save();
        return res.status(201).json(transporteGuardado);
    } catch (error) {
        return res.status(400).json({ 
            mensagem: 'Erro ao criar o registo de transporte.', 
            erro: error.message 
        });
    }
};

module.exports = { 
    getTransporte,
    createTransporte
};