const EnergiaConsumo = require('../models/energiaConsumoModel');

const getEnergiaConsumo = async (req, res) => { 
    try { 
        const consumo = await EnergiaConsumo.find(); 
        res.json(consumo); 
    } 
    catch (error) { 
        res.status(500).json({ message: error.message }); 
    } 
}; 

const createEnergiaConsumo = async (req, res) => {
    try {
        const { id_relatorio } = req.params;
        const { 
            consumo_total_mwh, 
            percentagem_renovavel_pct, 
            certificados_garantia_origem 
        } = req.body;
  
        const novoConsumo = new EnergiaConsumo({
            id_relatorio, 
            consumo_total_mwh, 
            percentagem_renovavel_pct, 
            certificados_garantia_origem 
        });
  
        const consumoGuardado = await novoConsumo.save();
        return res.status(201).json(consumoGuardado);
    } catch (error) {
        return res.status(400).json({ 
            mensagem: 'Erro ao criar o registo de consumo de energia.', 
            erro: error.message 
        });
    }
};

module.exports = { 
    getEnergiaConsumo,
    createEnergiaConsumo
};