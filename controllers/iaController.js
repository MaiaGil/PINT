const { OpenAI } = require('openai');
const Entidade = require('../models/Entidade');
const Periodo = require('../models/Periodo');
const Documento = require('../models/Documento');
const Metrica = require('../models/Metrica');
const UnidadeMedida = require('../models/UnidadeMedida');
const Dado = require('../models/Dado');

// Inicialização da OpenAI apontada para o endpoint da Groq
const openai = new OpenAI({ 
    apiKey: process.env.GROQ_API_KEY, 
    baseURL: "https://api.groq.com/openai/v1" 
});

const extrairEGravarDados = async (req, res) => {
    try {
        const { textoDocumento, ficheiro_origem } = req.body;

        if (!textoDocumento) {
            return res.status(400).json({ sucesso: false, mensagem: "O texto do documento é obrigatório." });
        }

        const systemPrompt = `
            És um assistente especialista em auditorias ESG (Environmental, Social, Governance) e extração de dados analíticos.
            Analisa o texto do documento fornecido e extrai as informações estruturadas rigorosamente no formato JSON abaixo.
            Se algum campo opcional não for encontrado, deixa-o como null ou array vazio.

            RESPOSTA OBRIGATÓRIA: Devolve APENAS o objeto JSON puro. Não incluas texto explicativo, notas ou blocos de código markdown (como \`\`\`json).

            REGRAS PARA O PERÍODO:
            - Identifica as datas de início e fim da cobertura do documento (ex: se for uma fatura de Janeiro de 2024, data_inicio é "2024-01-01" e data_fim é "2024-01-31").
            - O campo "tipo_periodo" deve ser "Anual", "Trimestral", "Mensal" ou "Pontual".

            REGRAS PARA OS DADOS/MÉTRICAS:
            - Extrai todas as leituras quantitativas de consumo, emissões ou indicadores ESG.
            - No array de "dimensoes", extrai propriedades contextuais como pares de chave/valor (ex: chave: "Escopo", valor: "Escopo 1").

            O formato do JSON de retorno deve ser estritamente este:
            {
                "entidade": { 
                    "nome": "Nome oficial da empresa ou organização", 
                    "nif": "Apenas os 9 dígitos numéricos, sem espaços", 
                    "pais": "País correspondente", 
                    "tipo_entidade": "Ex: Pública, Privada, PME" 
                },
                "periodo": { 
                    "tipo_periodo": "Mensal",
                    "data_inicio": "YYYY-MM-DD", 
                    "data_fim": "YYYY-MM-DD" 
                },
                "documento": { 
                    "tipo_documento": "Ex: Fatura, Relatório de Sustentabilidade, Auditoria", 
                    "numero_documento": "Número da fatura ou identificador único do documento", 
                    "data_emissao": "YYYY-MM-DD"
                },
                "dados_extraidos": [
                    {
                        "nome_metrica_sugerido": "Ex: Consumo de Eletricidade, Consumo de Gás Natural",
                        "pilar": "E",
                        "subcategoria": "Energia",
                        "valor": 12345.67,
                        "simbolo_unidade": "kWh",
                        "dimensoes": [
                            { "chave": "Tipo", "valor": "Eletricidade" }
                        ]
                    }
                ]
            }
        `;

        // Chamada à API da Groq usando o LLaMA 3.3
        const respostaIA = await openai.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }, 
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: textoDocumento }
            ]
        });

        let textoResposta = respostaIA.choices[0].message.content.trim();
        
        // Limpeza preventiva caso o LLM insira blocos de código markdown por engano
        if (textoResposta.startsWith("```")) {
            textoResposta = textoResposta.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
        }

        const dadosExtraidosIA = JSON.parse(textoResposta);
        let logAcoes = [];

        // 1. Processar ENTIDADE (Encontrar ou Criar)
        let entidade = await Entidade.findOne({ nif: dadosExtraidosIA.entidade.nif });
        if (!entidade) {
            entidade = new Entidade({
                nome: dadosExtraidosIA.entidade.nome,
                nif: dadosExtraidosIA.entidade.nif,
                pais: dadosExtraidosIA.entidade.pais || 'Portugal',
                tipo_entidade: dadosExtraidosIA.entidade.tipo_entidade || 'Privada'
            });
            await entidade.save();
            logAcoes.push(`🏢 Nova entidade criada: "${entidade.nome}" (NIF: ${entidade.nif}).`);
        } else {
            logAcoes.push(`🏢 Entidade existente mapeada: "${entidade.nome}".`);
        }

        // 2. Processar PERÍODO (Encontrar ou Criar por datas exatas)
        let periodo = await Periodo.findOne({ 
            data_inicio: new Date(dadosExtraidosIA.periodo.data_inicio), 
            data_fim: new Date(dadosExtraidosIA.periodo.data_fim) 
        });
        if (!periodo) {
            periodo = new Periodo({
                tipo_periodo: dadosExtraidosIA.periodo.tipo_periodo,
                data_inicio: new Date(dadosExtraidosIA.periodo.data_inicio),
                data_fim: new Date(dadosExtraidosIA.periodo.data_fim)
            });
            await periodo.save();
            logAcoes.push(`📅 Novo Período gerado: ${dadosExtraidosIA.periodo.data_inicio} até ${dadosExtraidosIA.periodo.data_fim}.`);
        } else {
            logAcoes.push(`📅 Período existente reutilizado (ID: ${periodo._id}).`);
        }

        // 3. Criar o DOCUMENTO único
        const novoDocumento = new Documento({
            id_entidade: entidade._id,
            id_periodo: periodo._id,
            tipo_documento: dadosExtraidosIA.documento.tipo_documento || 'Fatura',
            numero_documento: dadosExtraidosIA.documento.numero_documento || 'S/N',
            data_emissao: dadosExtraidosIA.documento.data_emissao ? new Date(dadosExtraidosIA.documento.data_emissao) : new Date(),
            ficheiro_origem: ficheiro_origem || 'upload_manual.txt',
            estado: 'Processado',
            fonte_ingestao: 'Groq-LLaMA-Extractor',
            versao_schema: 'v2.0',
            data_processamento: new Date()
        });
        await novoDocumento.save();
        logAcoes.push(`📄 Documento registado: ${novoDocumento.tipo_documento} Nº ${novoDocumento.numero_documento}.`);

        // 4. Iterar e Gravar as métricas no modelo de dados unificado
        if (dadosExtraidosIA.dados_extraidos && dadosExtraidosIA.dados_extraidos.length > 0) {
            for (let item of dadosExtraidosIA.dados_extraidos) {
                
                // Resolver ou criar a Unidade de Medida
                let unidade = await UnidadeMedida.findOne({ simbolo: item.simbolo_unidade });
                if (!unidade) {
                    unidade = new UnidadeMedida({
                        nome: item.simbolo_unidade,
                        simbolo: item.simbolo_unidade,
                        tipo_unidade: 'Definido por IA'
                    });
                    await unidade.save();
                }

                // Resolver ou criar a Métrica de forma dinâmica (Dicionário ESG ativo)
                let metrica = await Metrica.findOne({ nome: new RegExp(`^${item.nome_metrica_sugerido}$`, 'i') });
                if (!metrica) {
                    metrica = new Metrica({
                        nome: item.nome_metrica_sugerido,
                        descricao: `Métrica gerada dinamicamente via IA a partir do doc ${novoDocumento.numero_documento}`,
                        pilar: item.pilar || 'E',
                        subcategoria: item.subcategoria || 'Geral',
                        natureza: 'Quantitativa',
                        id_unidade_base: unidade._id,
                        ativo: true
                    });
                    await metrica.save();
                    logAcoes.push(`📊 Nova Métrica introduzida no dicionário: "${metrica.nome}".`);
                }

                // Gravar o registo analítico final na coleção Dado
                const novoDado = new Dado({
                    id_documento: novoDocumento._id,
                    id_metrica: metrica._id,
                    id_entidade: entidade._id,
                    id_periodo: periodo._id,
                    id_unidade_original: unidade._id,
                    valor: item.valor,
                    valor_convertido_base: item.valor, // Valor inicial (pode ser recalculado por workers de conversão)
                    origem: 'Extração Automatizada (LLaMA 3.3)',
                    estado_validacao: 'Submetido',
                    data_registo: new Date(),
                    dimensoes: item.dimensoes || []
                });
                await novoDado.save();
                
                logAcoes.push(`⚡ Dado ESG associado: ${metrica.nome} de ${item.valor} ${unidade.simbolo}.`);
            }
        } else {
            logAcoes.push(`⚠️ Nenhuns dados quantitativos válidos foram extraídos para gravação.`);
        }

        // Resposta de sucesso com logs estruturados para o frontend
        res.status(201).json({
            sucesso: true,
            logExplicativo: logAcoes,
            dados: {
                id_documento: novoDocumento._id,
                entidade: entidade.nome,
                total_registos_adicionados: dadosExtraidosIA.dados_extraidos?.length || 0
            }
        });

    } catch (error) {
        console.error("Falha no controlador de extração IA:", error);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
};

module.exports = { extrairEGravarDados };