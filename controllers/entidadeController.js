const Entidade = require('../models/entidadeModel');

const getEntidade = async (req, res) => { 
    try { 
        const entidades = await Entidade.find(); 
        res.json(entidades); 
    } 
    catch (error) { 
        res.status(500).json({ message: error.message }); 
    } 
}; 

const createEntidade = async (req, res) => {
    try {
        const { 
            nome, 
            sede, 
            nif, 
            acesso_log 
        } = req.body;
  
        const novaEntidade = new Entidade({
            nome, 
            sede, 
            nif, 
            acesso_log 
        });
  
        const entidadeGuardada = await novaEntidade.save();
        return res.status(201).json(entidadeGuardada);
    } catch (error) {
        return res.status(400).json({ 
            mensagem: 'Erro ao criar a entidade.', 
            erro: error.message 
        });
    }
};

module.exports = { 
    getEntidade,
    createEntidade
};