const router = require("express").Router();
const multer = require("multer");
const iaController = require("../controllers/iaController");

const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 50 * 1024 * 1024 }
});

// DEBUG (isto ajuda a confirmar o problema real)
console.log("IA CONTROLLER:", Object.keys(iaController));

if (typeof iaController.extrairDadosDocumento !== "function") {
	throw new Error("extrairDadosDocumento NÃO é função (export errado no controller)");
}

if (typeof iaController.extrairDadosDocumentoFicheiro !== "function") {
	throw new Error("extrairDadosDocumentoFicheiro NÃO é função (export errado no controller)");
}

router.post("/extrair", iaController.extrairDadosDocumento);

router.post(
	"/extrair-ficheiro",
	upload.single("ficheiro"),
	iaController.extrairDadosDocumentoFicheiro
);

module.exports = router;