const express = require("express");
const router = express.Router();
const factureController = require("../controllers/factureController");
const { generateTEIF } = require("../services/Xmlservices");
const { signerFacture } = require("../controllers/signerController");
const { verifyToken } = require("../middleware/authMiddleware");
const { signTEIF } = require("../services/signService");

// 🔒 Apply auth to ALL routes below this line
router.use(verifyToken);

router.get("/", factureController.getAllFactures);
router.get("/achat", factureController.getAllFacturesAchat);
router.get("/achat/:id", factureController.getFactureAchatById);

router.post("/:id/signer", signerFacture);

router.get("/:id/xml", async (req, res) => {
  try {
    const xml = await generateTEIF(req.params.id);
    res.set("Content-Type", "application/xml");
    res.send(xml);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/:id/xml/signed", async (req, res) => {
  try {
    const xml = await generateTEIF(req.params.id);
    const signedXml = await signTEIF(xml);
    res.set("Content-Type", "application/xml");
    res.send(signedXml);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/:id", factureController.getFactureById);
router.post("/", factureController.createFacture);
router.patch("/:id/emettre", factureController.emettreFacture); // → envoyer TTN (status_electronique)
router.patch("/:id/payer", factureController.payerFacture);
router.patch("/:id/annuler", factureController.annulerFacture);

module.exports = router;