const mongoose = require('mongoose');

const periodoSchema = new mongoose.Schema({

    id_periodo: {
        type: String,
        required: true,
        unique: true,
        description: "PK vinda do inbound.json"
    },

    tipo_periodo: {
        type: String,
        required: true,
        enum: [
            'MENSAL',
            'BIMESTRAL',
            'TRIMESTRAL',
            'SEMESTRAL',
            'ANUAL'
        ],
        default: 'MENSAL'
    },

    data_inicio: {
        type: Date,
        default: null,
        description: "Pode vir incompleto da IA"
    },

    data_fim: {
        type: Date,
        default: null,
        description: "Pode ser inferido depois se necessário"
    }

}, {
    timestamps: true
});

// Middleware (Hook) que corre sempre automaticamente antes de gravar (save) na Base de Dados
periodoSchema.pre('save', function(next) {
    // Se as datas já vieram preenchidas (da extração ou de uma inserção manual), não faz nada
    if (this.data_inicio && this.data_fim) {
        return next();
    }

    const idUpper = this.id_periodo.toUpperCase();

    // 1. Tenta inferir se é um Trimestre (ex: '2024-Q4')
    const matchTrimestre = idUpper.match(/^(\d{4})-Q([1-4])$/);
    if (matchTrimestre) {
        const ano = matchTrimestre[1];
        const trimestre = matchTrimestre[2];
        
        this.tipo_periodo = 'TRIMESTRAL';
        
        if (trimestre === '1') { 
            this.data_inicio = new Date(`${ano}-01-01`); 
            this.data_fim = new Date(`${ano}-03-31`); 
        } else if (trimestre === '2') { 
            this.data_inicio = new Date(`${ano}-04-01`); 
            this.data_fim = new Date(`${ano}-06-30`); 
        } else if (trimestre === '3') { 
            this.data_inicio = new Date(`${ano}-07-01`); 
            this.data_fim = new Date(`${ano}-09-30`); 
        } else if (trimestre === '4') { 
            this.data_inicio = new Date(`${ano}-10-01`); 
            this.data_fim = new Date(`${ano}-12-31`); 
        }
        
        return next();
    }

    // 2. Tenta inferir se é um Ano Inteiro (ex: '2024')
    const matchAno = idUpper.match(/^(\d{4})$/);
    if (matchAno) {
        this.tipo_periodo = 'ANUAL';
        this.data_inicio = new Date(`${idUpper}-01-01`);
        this.data_fim = new Date(`${idUpper}-12-31`);
        return next();
    }

    // Se o formato não for reconhecido, avança sem alterar (deixa a null)
    next();
});

module.exports = mongoose.model('Periodo', periodoSchema);