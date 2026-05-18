const EmissaoCarbono = require('../models/emissaoCarbonoModel');

const getEmissaoCarbono = async (req, res) => { 
    try { 
        const carbono = await EmissaoCarbono.find(); 
        res.json(carbono); 
    } 
    catch (error) { 
        res.status(500).json({ message: error.message }); 
    } 
}; 

const createEmissao = async (req, res) => {
    try {
      const { id_relatorio } = req.params;
      const { 
        emissao_co2e, 
        emissao_market_based_co2e, 
        metodologia, 
        fator_emissao_co2e_per_mwh 
      } = req.body;
  
      const novaEmissao = new EmissaoCarbono({
        id_relatorio, 
        emissao_co2e, 
        emissao_market_based_co2e, 
        metodologia, 
        fator_emissao_co2e_per_mwh 
      });
  
      const emissaoGuardada = await novaEmissao.save();
      
      return res.status(201).json(emissaoGuardada);
    } catch (error) {
      return res.status(400).json({ 
        mensagem: 'Erro ao criar o registo de emissão de carbono.', 
        erro: error.message 
      });
    }
};

module.exports = { 
    getEmissaoCarbono,
    createEmissao
};