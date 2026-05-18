const TipoMaterial = require('../models/tipoMaterialModel');

const getTipoMaterial = async (req, res) => { 
    try { 
        const tipos = await TipoMaterial.find(); 
        res.json(tipos); 
    } 
    catch (error) { 
        res.status(500).json({ message: error.message }); 
    } 
}; 

const createTipoMaterial = async (req, res) => {
    try {
        const { 
            nome, 
            unidade, 
            categoria 
        } = req.body;
  
        const novoTipo = new TipoMaterial({
            nome, 
            unidade, 
            categoria 
        });
  
        const tipoGuardado = await novoTipo.save();
        return res.status(201).json(tipoGuardado);
    } catch (error) {
        return res.status(400).json({ 
            mensagem: 'Erro ao criar o tipo de material.', 
            erro: error.message 
        });
    }
};

module.exports = { 
    getTipoMaterial,
    createTipoMaterial
};