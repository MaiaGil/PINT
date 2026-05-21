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
// PROMPT BASE (reutilizado nas duas funções)
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
      "data_inicio": "YYYY-MM-DD|null",
      "data_fim": "YYYY-MM-DD|null"
    }
  },
  "dados": [
    {
      "id_metrica": "slug_descritivo_da_metrica (ex: quantidade_aco_fornecido, valor_fatura_eur, intensidade_carbono_tco2e_ton)",
      "id_unidade_original": "slug_unidade (ex: ton, eur, tco2e_ton, kg, kwh)",
      "id_unidade_base_esperada": "slug_unidade_base (ex: ton, eur, tco2e_ton, kg, kwh)",
      "valor": numero,
      "observacao": "string|null"
    }
  ]
}

Regras para "dados":
- Extrai TODOS os valores numéricos relevantes do documento.
- Cada linha de item, quantidade, valor monetário, métrica ambiental ou indicador deve ser um dado separado.
- "id_metrica" deve ser um slug descritivo em lowercase com underscores (sem espaços).
- "id_unidade_original" e "id_unidade_base_esperada" devem ser slugs normalizados (ex: "ton", "eur", "tco2e_ton").
- "valor" deve ser sempre um número (não string).
- Nunca omitas dados numéricos presentes no documento.
`.trim();

const SYSTEM_PROMPT_EMPRESA = `
Responde APENAS com um JSON válido. Sem markdown. Sem texto adicional. Não inventes dados. Se não souberes, usa null.

A entidade emissora deste documento é SEMPRE a Metalogalva – Trefilaria e Galvanização, S.A. (NIF: 500123456, PT).
Não extraias a entidade do documento — ela é fixa.

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
      "data_inicio": "YYYY-MM-DD|null",
      "data_fim": "YYYY-MM-DD|null"
    }
  },
  "dados": [
    {
      "id_metrica": "slug_descritivo_da_metrica (ex: quantidade_aco_fornecido, valor_fatura_eur, intensidade_carbono_tco2e_ton)",
      "id_unidade_original": "slug_unidade (ex: ton, eur, tco2e_ton, kg, kwh)",
      "id_unidade_base_esperada": "slug_unidade_base (ex: ton, eur, tco2e_ton, kg, kwh)",
      "valor": numero,
      "observacao": "string|null"
    }
  ]
}

Regras para "dados":
- Extrai TODOS os valores numéricos relevantes do documento.
- Cada linha de item, quantidade, valor monetário, métrica ambiental ou indicador deve ser um dado separado.
- "id_metrica" deve ser um slug descritivo em lowercase com underscores (sem espaços).
- "id_unidade_original" e "id_unidade_base_esperada" devem ser slugs normalizados (ex: "ton", "eur", "tco2e_ton").
- "valor" deve ser sempre um número (não string).
- Nunca omitas dados numéricos presentes no documento.
`.trim();

// ─────────────────────────────────────────────
// ENTIDADE FIXA — METALOGALVA
// ─────────────────────────────────────────────

const METALOGALVA = {
	id_entidade: "ent_metalogalva",
	nome: "Metalogalva – Trefilaria e Galvanização, S.A.",
	tipo_entidade: "EMPRESA",
	pais: "PT",
	nif: "500123456"
};

// ─────────────────────────────────────────────
// FUNÇÕES IA
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

	log("STEP IA - resposta recebida");

	let r = {};
	try {
		r = JSON.parse(c.choices[0].message.content || "{}");
	} catch {
		throw new Error("JSON inválido da IA");
	}

	log("STEP IA - parse OK");

	const idDoc = gerarId("doc");
	const idEnt = gerarId("ent");
	const idPer = gerarId("per");
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
			entidade: {
				id_entidade: idEnt,
				nome: r?.meta?.entidade?.nome || "UNKNOWN",
				tipo_entidade: r?.meta?.entidade?.tipo_entidade || "OUTRO",
				pais: r?.meta?.entidade?.pais || null,
				nif: r?.meta?.entidade?.nif || null
			},
			periodo: {
				id_periodo: idPer,
				tipo_periodo: r?.meta?.periodo?.tipo_periodo || "MENSAL",
				data_inicio: r?.meta?.periodo?.data_inicio || null,
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

	log("STEP IA EMPRESA - resposta recebida");

	let r = {};
	try {
		r = JSON.parse(c.choices[0].message.content || "{}");
	} catch {
		throw new Error("JSON inválido da IA");
	}

	log("STEP IA EMPRESA - parse OK");

	const idDoc = gerarId("doc");
	const idPer = gerarId("per");
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
				tipo_periodo: r?.meta?.periodo?.tipo_periodo || "MENSAL",
				data_inicio: r?.meta?.periodo?.data_inicio || null,
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
// CONTROLLERS — FORNECEDOR
// ─────────────────────────────────────────────

const extrairDadosDocumentoFicheiro = async (req, res) => {
	try {
		log("REQUEST FILE - início");

		if (!req.file)
			return res.status(400).json({ sucesso: false, erro: "Ficheiro vazio" });

		const texto = await extrairTextoFicheiro(req.file);
		log("REQUEST FILE - texto OK");

		const inbound = await gerarInboundIA(texto, req.file.originalname);
		log("REQUEST FILE - IA OK");

		const bd = await guardarInboundBD(inbound);
		log("REQUEST FILE - BD OK");

		return res.status(200).json({
			sucesso: true,
			mensagem: "OK",
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

		if (!texto_documento)
			return res.status(400).json({ sucesso: false, erro: "Texto obrigatório" });

		const inbound = await gerarInboundIA(texto_documento);
		const bd = await guardarInboundBD(inbound);

		return res.status(200).json({
			sucesso: true,
			mensagem: "OK",
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

// ─────────────────────────────────────────────
// CONTROLLERS — EMPRESA (METALOGALVA)
// ─────────────────────────────────────────────

const extrairDadosDocumentoFicheiroEmpresa = async (req, res) => {
	try {
		log("REQUEST FILE EMPRESA - início");

		if (!req.file)
			return res.status(400).json({ sucesso: false, erro: "Ficheiro vazio" });

		const texto = await extrairTextoFicheiro(req.file);
		log("REQUEST FILE EMPRESA - texto OK");

		const inbound = await gerarInboundIAEmpresa(texto, req.file.originalname);
		log("REQUEST FILE EMPRESA - IA OK");

		const bd = await guardarInboundBD(inbound);
		log("REQUEST FILE EMPRESA - BD OK");

		return res.status(200).json({
			sucesso: true,
			mensagem: "OK",
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

		if (!texto_documento)
			return res.status(400).json({ sucesso: false, erro: "Texto obrigatório" });

		const inbound = await gerarInboundIAEmpresa(texto_documento);
		const bd = await guardarInboundBD(inbound);

		return res.status(200).json({
			sucesso: true,
			mensagem: "OK",
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

// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────

module.exports = {
	extrairDadosDocumento,
	extrairDadosDocumentoFicheiro,
	extrairDadosDocumentoEmpresa,
	extrairDadosDocumentoFicheiroEmpresa
};