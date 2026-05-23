const Groq = require("groq-sdk");
const { v4: uuidv4 } = require("uuid");
const mammoth = require("mammoth");
const Tesseract = require("tesseract.js");

const Entidade = require("../models/entidadeModel");
const Periodo = require("../models/periodoModel");
const Documento = require("../models/documentoModel");
const Dado = require("../models/dadoModel");

let pdf;
try {
    pdf = require("pdf-parse");
} catch (e) {
    console.warn("⚠️ pdf-parse não está instalado");
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const log = (msg) => console.log(`🔎 [IA] ${msg}`);

const timeout = (ms) =>
    new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), ms));

const limparTexto = (t) => {
    log("limparTexto");
    return !t ? "" : t.replace(/\s+/g, " ").trim().substring(0, 20000);
};

const gerarId = (p) => {
    const id = `${p}_${uuidv4()}`;
    log(`gerarId -> ${id}`);
    return id;
};

const extrairTextoFicheiro = async (file) => {
    log("STEP FILE - início");
    if (!file) throw new Error("Ficheiro inválido");

    const t = file.mimetype;
    log(`MIME TYPE: ${t}`);

    if (t === "application/pdf") {
        const d = await pdf(file.buffer);
        return limparTexto(d.text);
    }
    if (t === "text/plain") {
        return limparTexto(file.buffer.toString("utf-8"));
    }
    if (t.includes("wordprocessingml")) {
        const r = await mammoth.extractRawText({ buffer: file.buffer });
        return limparTexto(r.value);
    }
    if (["image/png", "image/jpeg", "image/jpg"].includes(t)) {
        const o = await Tesseract.recognize(file.buffer, "por+eng");
        return limparTexto(o.data.text);
    }
    throw new Error("Formato não suportado");
};

// ─────────────────────────────────────────────
// PROMPTS BASE
// ─────────────────────────────────────────────

const SYSTEM_PROMPT_BASE = `
Responde APENAS com um JSON válido. Sem markdown. Sem texto adicional. Não inventes dados. Se não souberes, usa null.

O JSON deve ter EXATAMENTE esta estrutura:
{
  "meta": {
    "documento": {
      "tipo_documento": "FATURA|EPD|CONTRATO|RELATORIO|OUTRO",
      "numero_documento": "string|null",
      "data_emissao": "YYYY-MM-DD|null",
      "fonte_ingestao": "UPLOAD",
      "ficheiro_origem": "string|null"
    },
    "entidade": {
      "nome": "string",
      "tipo_entidade": "FORNECEDOR|CLIENTE|OUTRO",
      "pais": "ISO 3166-1 alpha-2|null",
      "nif": "string|null"
    },
    "periodo": {
      "tipo_periodo": "MENSAL|TRIMESTRAL|ANUAL",
      "data_inicio": "YYYY-MM-DD",
      "data_fim": "YYYY-MM-DD"
    }
  },
  "dados": [
    {
      "id_metrica": "slug_descritivo_da_metrica",
      "id_unidade_original": "slug_unidade",
      "id_unidade_base_esperada": "slug_unidade_base",
      "valor": numero,
      "observacao": "string|null"
    }
  ]
}
`.trim();

const SYSTEM_PROMPT_EMPRESA = `
Responde APENAS com um JSON válido. Sem markdown. Sem texto adicional. Não inventes dados. Se não souberes, usa null.
A entidade emissora deste documento é SEMPRE a Metalogalva – Trefilaria e Galvanização, S.A. (NIF: 500123456, PT).

O JSON deve ter EXATAMENTE esta estrutura:
{
  "meta": {
    "documento": {
      "tipo_documento": "FATURA|EPD|CONTRATO|RELATORIO|OUTRO",
      "numero_documento": "string|null",
      "data_emissao": "YYYY-MM-DD|null",
      "fonte_ingestao": "UPLOAD",
      "ficheiro_origem": "string|null"
    },
    "periodo": {
      "tipo_periodo": "MENSAL|TRIMESTRAL|ANUAL",
      "data_inicio": "YYYY-MM-DD",
      "data_fim": "YYYY-MM-DD"
    }
  },
  "dados": [
    {
      "id_metrica": "slug_descritivo_da_metrica",
      "id_unidade_original": "slug_unidade",
      "id_unidade_base_esperada": "slug_unidade_base",
      "valor": numero,
      "observacao": "string|null"
    }
  ]
}
`.trim();

const METALOGALVA = {
    id_entidade: "ent_metalogalva",
    nome: "Metalogalva – Trefilaria e Galvanização, S.A.",
    tipo_entidade: "EMPRESA",
    pais: "PT",
    nif: "500123456"
};

// ─────────────────────────────────────────────
// RESTRUTURAÇÃO IA: TRATAMENTO DE DUPLICADOS
// ─────────────────────────────────────────────

const gerarInboundIA = async (texto, nome = null) => {
    log("STEP IA - início");
    let c;
    try {
        c = await Promise.race([
            groq.chat.completions.create({
                messages: [
                    { role: "system", content: SYSTEM_PROMPT_BASE },
                    { role: "user", content: `FICHEIRO: ${nome || "?"}\n\n${texto}` }
                ],
                model: "llama-3.3-70b-versatile",
                temperature: 0.1,
                max_tokens: 4000,
                response_format: { type: "json_object" }
            }),
            timeout(60000)
        ]);
    } catch (e) {
        log("STEP IA - GROQ TIMEOUT/ERROR");
        throw e;
    }

    let r = {};
    try { r = JSON.parse(c.choices[0].message.content || "{}"); } catch { throw new Error("JSON inválido da IA"); }

    const nomeEntidadeAI = r?.meta?.entidade?.nome || "UNKNOWN";
    
    // 1. Verificar se a Entidade já existe na BD por Nome (case insensitive)
    let idEnt = "";
    const entidadeExistente = await Entidade.findOne({ nome: { $regex: new RegExp(`^${nomeEntidadeAI.trim()}$`, "i") } });
    
    if (entidadeExistente) {
        idEnt = entidadeExistente.id_entidade;
        log(`Entidade Encontrada! Reutilizando ID existente: ${idEnt}`);
    } else {
        // 2. 🛡️ EXCEÇÃO: Se a IA detetar a Metalogalva, força o ID padrão do sistema
        if (nomeEntidadeAI.toLowerCase().includes("metalogalva")) {
            idEnt = "ent_metalogalva";
            log(`Exceção Ativada: Detetada Metalogalva no fluxo geral. Forçado ID fixo: ${idEnt}`);
        } else {
            // 3. Caso contrário, gera o ID limpo baseado no nome do Fornecedor
            const nomeLimpo = nomeEntidadeAI
                .trim()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
                .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")      // Remove pontuação
                .replace(/\b(SA|S\.A\.|LDA|Lda|LIMITADA|SLA|S\.L\.)\b/gi, "") // Remove sufixos comerciais
                .replace(/\s+/g, "_")                            // Espaços para underscores
                .toUpperCase();                                  // Caixa alta
                
            const sufixoSlug = nomeLimpo || "CUSTOM";
            idEnt = `ENT_${sufixoSlug}`;
            
            log(`Nova Entidade detetada. ID gerado de forma semântica: ${idEnt}`);
        }
    }

    // 🛡️ NOVA LOGÍSTICA: Gerar ID de Período Legível por Ano e Mês/Trimestre
    const dataInicio = r?.meta?.periodo?.data_inicio; // Ex: "2026-05-01"
    const tipoPeriodo = r?.meta?.periodo?.tipo_periodo || "MENSAL";
    let idPer = "";

    if (dataInicio && dataInicio.includes('-')) {
        const partes = dataInicio.split('-'); // Divide "2026-05-01" -> ["2026", "05", "01"]
        const ano = partes[0];
        const mes = partes[1];
        
        if (tipoPeriodo.toUpperCase() === "MENSAL") {
            idPer = `per_${ano}_M${mes}`; // Ex: per_2026_M05
        } else if (tipoPeriodo.toUpperCase() === "TRIMESTRAL") {
            const numMes = parseInt(mes, 10);
            const tri = Math.ceil(numMes / 3); // Mês 5 / 3 = 1.66 -> Trimestre 2
            idPer = `per_${ano}_T${tri}`; // Ex: per_2026_T2
        } else {
            idPer = `per_${ano}_ANUAL`;   // Ex: per_2026_ANUAL
        }
    } else {
        idPer = gerarId("per"); // Fallback caso a IA falhe a data
    }
    log(`ID do Período Formatado -> ${idPer}`);

    const idDoc = gerarId("doc");
    const agora = new Date().toISOString();

    return {
        meta: {
            documento: {
                id_documento: idDoc,
                tipo_documento: r?.meta?.documento?.tipo_documento || "OUTRO",
                numero_documento: r?.meta?.documento?.numero_documento || null,
                data_emissao: r?.meta?.documento?.data_emissao || null,
                fonte_ingestao: "UPLOAD",
                ficheiro_origem: nome || null
            },
            // Se for a exceção da Metalogalva, injeta o objeto estático completo, senão injeta o gerado
            entidade: idEnt === "ent_metalogalva" ? METALOGALVA : {
                id_entidade: idEnt,
                nome: entidadeExistente ? entidadeExistente.nome : nomeEntidadeAI.trim(),
                tipo_entidade: r?.meta?.entidade?.tipo_entidade || "OUTRO",
                pais: r?.meta?.entidade?.pais || null,
                nif: r?.meta?.entidade?.nif || null
            },
            periodo: {
                id_periodo: idPer,
                tipo_periodo: tipoPeriodo,
                data_inicio: dataInicio || null,
                data_fim: r?.meta?.periodo?.data_fim || null
            },
            versao_schema: "1.0.0"
        },
        dados: (r?.dados || []).map((d) => ({
            id_dado: gerarId("dad"),
            id_documento: idDoc,
            id_metrica: d?.id_metrica || null,
            id_unidade_original: d?.id_unidade_original || null,
            id_unidade_base_esperada: d?.id_unidade_base_esperada || null,
            id_fator: null,
            valor: Number(d?.valor) || 0,
            id_entidade: idEnt,
            id_periodo: idPer,
            origem: "EXTRACAO_IA",
            estado_validacao: "PENDENTE",
            data_registo: agora,
            observacao: d?.observacao || null
        }))
    };
};

const gerarInboundIAEmpresa = async (texto, nome = null) => {
    log("STEP IA EMPRESA - início");
    let c;
    try {
        c = await Promise.race([
            groq.chat.completions.create({
                messages: [
                    { role: "system", content: SYSTEM_PROMPT_EMPRESA },
                    { role: "user", content: `FICHEIRO: ${nome || "?"}\n\n${texto}` }
                ],
                model: "llama-3.3-70b-versatile",
                temperature: 0.1,
                max_tokens: 4000,
                response_format: { type: "json_object" }
            }),
            timeout(60000)
        ]);
    } catch (e) {
        log("STEP IA EMPRESA - GROQ TIMEOUT/ERROR");
        throw e;
    }

    let r = {};
    try { r = JSON.parse(c.choices[0].message.content || "{}"); } catch { throw new Error("JSON inválido da IA"); }

    log("STEP IA EMPRESA - parse OK");

    // 🛡️ NOVA LOGÍSTICA: Gerar ID de Período Legível por Ano e Mês/Trimestre (Fluxo Empresa)
    const dataInicio = r?.meta?.periodo?.data_inicio; // Ex: "2026-05-01"
    const tipoPeriodo = r?.meta?.periodo?.tipo_periodo || "MENSAL";
    let idPer = "";

    if (dataInicio && dataInicio.includes('-')) {
        const partes = dataInicio.split('-'); // Divide "2026-05-01" -> ["2026", "05", "01"]
        const ano = partes[0];
        const mes = partes[1];
        
        if (tipoPeriodo.toUpperCase() === "MENSAL") {
            idPer = `per_${ano}_M${mes}`; // Ex: per_2026_M05
        } else if (tipoPeriodo.toUpperCase() === "TRIMESTRAL") {
            const numMes = parseInt(mes, 10);
            const tri = Math.ceil(numMes / 3);
            idPer = `per_${ano}_T${tri}`; // Ex: per_2026_T2
        } else {
            idPer = `per_${ano}_ANUAL`;   // Ex: per_2026_ANUAL
        }
    } else {
        idPer = gerarId("per"); // Fallback caso a IA não traga data válida
    }
    log(`ID do Período Empresa Formatado -> ${idPer}`);
    
    const idDoc = gerarId("doc");
    const agora = new Date().toISOString();

    return {
        meta: {
            documento: {
                id_documento: idDoc,
                tipo_documento: r?.meta?.documento?.tipo_documento || "OUTRO",
                numero_documento: r?.meta?.documento?.numero_documento || null,
                data_emissao: r?.meta?.documento?.data_emissao || null,
                fonte_ingestao: "UPLOAD",
                ficheiro_origem: nome || null
            },
            entidade: METALOGALVA,
            periodo: {
                id_periodo: idPer,
                tipo_periodo: tipoPeriodo,
                data_inicio: dataInicio || null,
                data_fim: r?.meta?.periodo?.data_fim || null
            },
            versao_schema: "1.0.0"
        },
        dados: (r?.dados || []).map((d) => ({
            id_dado: gerarId("dad"),
            id_documento: idDoc,
            id_metrica: d?.id_metrica || null,
            id_unidade_original: d?.id_unidade_original || null,
            id_unidade_base_esperada: d?.id_unidade_base_esperada || null,
            id_fator: null,
            valor: Number(d?.valor) || 0,
            id_entidade: METALOGALVA.id_entidade,
            id_periodo: idPer,
            origem: "EXTRACAO_IA",
            estado_validacao: "PENDENTE",
            data_registo: agora,
            observacao: d?.observacao || null
        }))
    };
};

// ─────────────────────────────────────────────
// DB
// ─────────────────────────────────────────────

const safeUpsert = async (Model, query, data) => {
    log(`DB UPSERT -> ${Model.modelName}`);
    return Model.findOneAndUpdate(query, data, {
        upsert: true,
        new: true
    });
};

const guardarInboundBD = async (i) => {
    log("STEP DB - início");

    const entidade = await safeUpsert(
        Entidade,
        { id_entidade: i.meta.entidade.id_entidade },
        i.meta.entidade
    );

    const periodo = await safeUpsert(
        Periodo,
        { id_periodo: i.meta.periodo.id_periodo },
        i.meta.periodo
    );

    const documento = await safeUpsert(
        Documento,
        { id_documento: i.meta.documento.id_documento },
        i.meta.documento
    );

    let dados = [];
    log("STEP DB - dados");

    try {
        if (i.dados?.length) {
            await Dado.deleteMany({ id_documento: i.meta.documento.id_documento });
            dados = await Dado.insertMany(i.dados);
        }
    } catch (e) {
        log("STEP DB - ERRO insertMany -> " + e.message);
        throw e;
    }

    log("STEP DB - fim");
    return { entidade, periodo, documento, dados };
};

// ─────────────────────────────────────────────
// CONTROLLERS
// ─────────────────────────────────────────────

const extrairDadosDocumentoFicheiro = async (req, res) => {
    try {
        log("REQUEST FILE - início");
        if (!req.file) return res.status(400).json({ sucesso: false, erro: "Ficheiro vazio" });

        const texto = await extrairTextoFicheiro(req.file);
        const inbound = await gerarInboundIA(texto, req.file.originalname);
        const bd = await guardarInboundBD(inbound);

        return res.status(200).json({
            sucesso: true,
            mensagem: "OK",
			inbound_json: inbound,
            bd_registos: {
                entidade: bd.entidade.id_entidade,
                periodo: bd.periodo.id_periodo,
                documento: bd.documento.id_documento,
                dados: bd.dados.length
            }
        });
    } catch (e) {
        log("ERROR FILE -> " + e.message);
        return res.status(500).json({ sucesso: false, erro: e.message });
    }
};

const extrairDadosDocumento = async (req, res) => {
    try {
        log("REQUEST TEXTO - início");
        const { texto_documento } = req.body;
        if (!texto_documento) return res.status(400).json({ sucesso: false, erro: "Texto obrigatório" });

        const inbound = await gerarInboundIA(texto_documento);
        const bd = await guardarInboundBD(inbound);

        return res.status(200).json({
            sucesso: true,
            mensagem: "OK",
			inbound_json: inbound,
            bd_registos: {
                entidade: bd.entidade.id_entidade,
                periodo: bd.periodo.id_periodo,
                documento: bd.documento.id_documento,
                dados: bd.dados.length
            }
        });
    } catch (e) {
        log("ERROR TEXTO -> " + e.message);
        return res.status(500).json({ sucesso: false, erro: e.message });
    }
};

const extrairDadosDocumentoFicheiroEmpresa = async (req, res) => {
    try {
        log("REQUEST FILE EMPRESA - início");
        if (!req.file) return res.status(400).json({ sucesso: false, erro: "Ficheiro vazio" });

        const texto = await extrairTextoFicheiro(req.file);
        const inbound = await gerarInboundIAEmpresa(texto, req.file.originalname);
        const bd = await guardarInboundBD(inbound);

        return res.status(200).json({
            sucesso: true,
            mensagem: "OK",
			inbound_json: inbound,
            bd_registos: {
                entidade: bd.entidade.id_entidade,
                periodo: bd.periodo.id_periodo,
                documento: bd.documento.id_documento,
                dados: bd.dados.length
            }
        });
    } catch (e) {
        log("ERROR FILE EMPRESA -> " + e.message);
        return res.status(500).json({ sucesso: false, erro: e.message });
    }
};

const extrairDadosDocumentoEmpresa = async (req, res) => {
    try {
        log("REQUEST TEXTO EMPRESA - início");
        const { texto_documento } = req.body;
        if (!texto_documento) return res.status(400).json({ sucesso: false, erro: "Texto obrigatório" });

        const inbound = await gerarInboundIAEmpresa(texto_documento);
        const bd = await guardarInboundBD(inbound);

        return res.status(200).json({
            sucesso: true,
            mensagem: "OK",
			inbound_json: inbound,
            bd_registos: {
                entidade: bd.entidade.id_entidade,
                periodo: bd.periodo.id_periodo,
                documento: bd.documento.id_documento,
                dados: bd.dados.length
            }
        });
    } catch (e) {
        log("ERROR TEXTO EMPRESA -> " + e.message);
        return res.status(500).json({ sucesso: false, erro: e.message });
    }
};

module.exports = {
    extrairDadosDocumento,
    extrairDadosDocumentoFicheiro,
    extrairDadosDocumentoEmpresa,
    extrairDadosDocumentoFicheiroEmpresa
};