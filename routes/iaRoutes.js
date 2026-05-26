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

// 🚀 Validação de todas as funções (incluindo a nova)
assertFn("extrairDadosDocumento");
assertFn("extrairDadosDocumentoFicheiro");
assertFn("extrairDadosDocumentoEmpresa");
assertFn("extrairDadosDocumentoFicheiroEmpresa");
assertFn("confirmarEGravarBD");

// ── Fornecedor (Apenas Extração) ─────────────────────────
router.post("/extrair", iaController.extrairDadosDocumento);
router.post("/extrair-ficheiro", upload.single("ficheiro"), iaController.extrairDadosDocumentoFicheiro);

// ── Empresa/Metalogalva (Apenas Extração) ────────────────
router.post("/empresa/extrair", iaController.extrairDadosDocumentoEmpresa);
router.post("/empresa/extrair-ficheiro", upload.single("ficheiro"), iaController.extrairDadosDocumentoFicheiroEmpresa);

// ── 🚀 NOVO: Gravação Definitiva (Pós-Validação Humana) ──
router.post("/confirmar", iaController.confirmarEGravarBD);

module.exports = router;