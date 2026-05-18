const MateriaPrima = require('../models/materiaPrimaModel');

const getMateriaPrima = async (req, res) => { 
    try { 
        const materias = await MateriaPrima.find(); 
        res.json(materias); 
    } 
    catch (error) { 
        res.status(500).json({ message: error.message }); 
    } 
}; 

const createMateriaPrima = async (req, res) => {
    try {
        const { id_tipo_material } = req.params;
        const { 
            quantidade_kg, 
            conteudo_reciclado_pct, 
            intensidade_carbonica, 
            processo_producao 
        } = req.body;
  
        const novaMateria = new MateriaPrima({
            id_tipo_material, 
            quantidade_kg, 
            conteudo_reciclado_pct, 
            intensidade_carbonica, 
            processo_producao 
        });
  
        const materiaGuardada = await novaMateria.save();
        return res.status(201).json(materiaGuardada);
    } catch (error) {
        return res.status(400).json({ 
            mensagem: 'Erro ao criar o registo de matéria-prima.', 
            erro: error.message 
        });
    }
};

module.exports = { 
    getMateriaPrima,
    createMateriaPrima
};