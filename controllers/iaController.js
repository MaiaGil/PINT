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

const gerarInboundIA = async (texto, nome = null) => {
	log("STEP IA - início");

	const systemPrompt = `Responde APENAS JSON válido.Sem markdown.Não inventes dados.Se não souber null.`;

	let c;

	try {
		c = await Promise.race([
			groq.chat.completions.create({
				messages: [
					{ role: "system", content: systemPrompt },
					{ role: "user", content: `FICHEIRO:${nome || "?"}\n${texto}` }
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
		throw new Error("JSON inválido IA");
	}

	log("STEP IA - parse OK");

	const idDoc = gerarId("doc");
	const idEnt = gerarId("ent");
	const idPer = gerarId("per");

	return {
		meta: {
			documento: {
				id_documento: idDoc,
				tipo_documento: r?.meta?.documento?.tipo_documento || "OUTRO",
				numero_documento: r?.meta?.documento?.numero_documento || null,
				data_emissao: r?.meta?.documento?.data_emissao || null,
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
			id_entidade: idEnt,
			id_periodo: idPer,
			valor: Number(d?.valor) || 0,
			origem: "IA"
		}))
	};
};

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

module.exports = {
	extrairDadosDocumento,
	extrairDadosDocumentoFicheiro
};