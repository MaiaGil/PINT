const mongoose = require('mongoose');

const fatorConversaoSchema = new mongoose.Schema({
    id_fator: { 
        type: String, 
        required: true, 
        unique: true,
        description: "Chave primária (PK) do fator de conversão"
    },
    id_unidade_origem: { 
        type: String, 
        ref: 'UnidadeMedida', 
        required: true,
        description: "Unidade do dado recebido (ex: id_litro)"
    },
    id_unidade_destino: { 
        type: String, 
        ref: 'UnidadeMedida', 
        required: true,
        description: "Unidade base para a qual vai ser convertido (ex: id_kwh ou id_tco2e)"
    },
    fator: { 
        type: Number, 
        required: true,
        description: "O valor multiplicador da conversão"
    },
    norma_referencia: { 
        type: String, 
        description: "A origem legal deste fator (ex: Despacho APA 2024, DEFRA)"
    },
    validade_inicio: { 
        type: Date, 
        required: true,
        description: "Data em que este fator entra em vigor"
    },
    validade_fim: { 
        type: Date, 
        description: "Data em que este fator deixa de ser válido (opcional, null significa válido até à data)"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('FatorConversao', fatorConversaoSchema);