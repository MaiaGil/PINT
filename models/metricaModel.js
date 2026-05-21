const mongoose = require('mongoose');

const metricaSchema = new mongoose.Schema({
    id_metrica: { 
        type: String, 
        required: true, 
        unique: true,
        description: "Chave primária (PK) da métrica"
    },
    nome: { 
        type: String, 
        required: true,
        description: "Ex: Eletricidade Consumida"
    },
    pilar: { 
        type: String, 
        required: true,
        enum: ['AMBIENTAL', 'SOCIAL', 'GOVERNANCA']
    },
    subcategoria: { 
        type: String, 
        required: true,
        description: "Ex: Energia, Resíduos, Água"
    },
    natureza: { 
        type: String, 
        required: true,
        enum: ['INPUT', 'FATOR', 'KPI_BASE', 'CALCULADA']
    },
    id_unidade_base: { 
        type: String, 
        ref: 'UnidadeMedida', // Relação com a tabela UnidadeMedida
        required: true,
        description: "Chave estrangeira (FK) que define a unidade de conversão final (ex: kWh)"
    },
    norma_referencia: { 
        type: String, 
        description: "Ex: GHG Protocol, ESRS E1"
    },
    ativo: { 
        type: Boolean, 
        default: true 
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Metrica', metricaSchema);