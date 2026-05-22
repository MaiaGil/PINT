const router = require("express").Router();
const multer = require("multer");
const iaController = require("../controllers/iaController");

const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 50 * 1024 * 1024 }
});

// DEBUG
console.log("IA CONTROLLER:", Object.keys(iaController));

const assertFn = (name) => {
	if (typeof iaController[name] !== "function")
		throw new Error(`${name} NÃO é função (export errado no controller)`);
};

assertFn("extrairDadosDocumento");
assertFn("extrairDadosDocumentoFicheiro");
assertFn("extrairDadosDocumentoEmpresa");
assertFn("extrairDadosDocumentoFicheiroEmpresa");

// ── Fornecedor ──────────────────────────────────────────
router.post("/extrair", iaController.extrairDadosDocumento);
router.post("/extrair-ficheiro", upload.single("ficheiro"), iaController.extrairDadosDocumentoFicheiro);

// ── Empresa (Metalogalva) ───────────────────────────────
router.post("/empresa/extrair", iaController.extrairDadosDocumentoEmpresa);
router.post("/empresa/extrair-ficheiro", upload.single("ficheiro"), iaController.extrairDadosDocumentoFicheiroEmpresa);

module.exports = router;