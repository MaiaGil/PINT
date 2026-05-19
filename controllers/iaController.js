const { OpenAI } = require('openai');
const Entidade = require('../models/entidadeModel');
const Periodo = require('../models/periodoModel');
const Relatorio = require('../models/relatorioModel');
const ConsumoEnergia = require('../models/energiaConsumoModel');
const EnergiaMix = require('../models/energiaMixModel');

// 1. O TRUQUE: Usar a biblioteca da OpenAI, mas apontar para o servidor gratuito!
const openai = new OpenAI({ 
    apiKey: "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", // Ex: "gsk_123abc..."
    baseURL: "https://api.groq.com/openai/v1" // Isto desvia o pedido do ChatGPT para o Groq
});

const extrairEGravarDados = async (req, res) => {
    try {
        const { textoDocumento } = req.body;

        if (!textoDocumento) {
            return res.status(400).json({ mensagem: "O texto do documento é obrigatório." });
        }

        const systemPrompt = `
            És um assistente especialista em auditorias ESG e extração de dados analíticos de faturas e relatórios industriais.
            Analisa o texto do documento fornecido pelo utilizador e extrai as informações para o formato JSON estrito abaixo.
            Se algum dado não for encontrado no documento, deixa o campo como null ou array vazio.
            
            O formato do JSON de retorno deve ser estritamente este:
            {
                "entidade": { "nome": "Nome da empresa cliente", "nif": "NIF com 9 dígitos sem espaços", "sede": "Cidade, País" },
                "periodo": { "ano": 2024, "trimestre": 4 },
                "relatorio": { "versao_esquema": "Número ou ID da fatura/documento" },
                "consumos": [
                    { "tipo": "Eletricidade ou Gás Natural ou Gasóleo", "quantidade_kwh": 12345, "custo": 123.45 }
                ],
                "mixEletricidade": { "percentagem_renovavel": 55 }
            }
        `;

        // 2. MUDANÇA DO MODELO: Usar o LLaMA 3 em vez do GPT
        const respostaIA = await openai.chat.completions.create({
            model: "llama-3.3-70b-versatile", // <-- O NOVO MODELO ATUALIZADO
            response_format: { type: "json_object" }, 
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: textoDocumento }
            ]
        });

        // O resto do teu código continua rigorosamente igual!
        const dadosExtraidosIA = JSON.parse(respostaIA.choices[0].message.content);

        let logAcoes = [];

        let entidade = await Entidade.findOne({ nif: dadosExtraidosIA.entidade.nif });
        if (!entidade) {
            entidade = new Entidade(dadosExtraidosIA.entidade);
            await entidade.save();
            logAcoes.push(`🏢 Entidade criada de raiz: "${entidade.nome}" (NIF: ${entidade.nif}).`);
        } else {
            logAcoes.push(`🏢 Entidade identificada: "${entidade.nome}" reaproveitada para este relatório.`);
        }

        let periodo = await Periodo.findOne({ ano: dadosExtraidosIA.periodo.ano, trimestre: dadosExtraidosIA.periodo.trimestre });
        if (!periodo) {
            periodo = new Periodo(dadosExtraidosIA.periodo);
            await periodo.save();
            logAcoes.push(`📅 Período criado: Ano ${periodo.ano} - ${periodo.trimestre}º Trimestre.`);
        } else {
            logAcoes.push(`📅 Período existente: Ano ${periodo.ano} - ${periodo.trimestre}º Trimestre reaproveitado.`);
        }

        const relatorio = new Relatorio({
            id_entidade: entidade._id,
            id_periodo: periodo._id,
            versao_esquema: dadosExtraidosIA.relatorio.versao_esquema || 'Fatura-IA'
        });
        await relatorio.save();
        logAcoes.push(`📄 Relatório gerado automaticamente com o código: ${relatorio.versao_esquema}.`);

        if (dadosExtraidosIA.consumos && dadosExtraidosIA.consumos.length > 0) {
            for (let con of dadosExtraidosIA.consumos) {
                const novoConsumo = new ConsumoEnergia({
                    id_relatorio: relatorio._id,
                    tipo_energia: con.tipo,
                    quantidade_kwh: con.quantidade_kwh,
                    custo_total: con.custo
                });
                await novoConsumo.save();
                logAcoes.push(`⚡ Consumo de Energia adicionado: ${con.tipo} (${con.quantidade_kwh.toLocaleString()} kWh).`);

                if (con.tipo.toLowerCase().includes("eletricidade") && dadosExtraidosIA.mixEletricidade?.percentagem_renovavel) {
                    const pctRenovavel = dadosExtraidosIA.mixEletricidade.percentagem_renovavel;
                    const novoMix = new EnergiaMix({
                        id_energia_consumo: novoConsumo._id,
                        fontes_renovaveis_pct: pctRenovavel,
                        fontes_nao_renovaveis_pct: 100 - pctRenovavel
                    });
                    await novoMix.save();
                    logAcoes.push(`🌐 Mix de Energia registado: ${pctRenovavel}% Renovável detetado.`);
                }
            }
        }

        res.status(201).json({
            sucesso: true,
            logExplicativo: logAcoes,
            dados: relatorio
        });

    } catch (error) {
        console.error("Erro na extração IA:", error);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
};

module.exports = { extrairEGravarDados };