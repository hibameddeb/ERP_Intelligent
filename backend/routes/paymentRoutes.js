// routes/paymentRoutes.js
const express = require("express");
const router  = express.Router();
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");
const {
  initierPaiementFacture,
  simulerPaiement,
  webhookPaiement,
  verifierPaiement,
} = require("../controllers/paymentController");

// ✅ Admin génère le lien → email envoyé automatiquement au fournisseur
router.post("/facture/:id/initier",  verifyToken, isAdmin, initierPaiementFacture);

// 🧪 Simulation PFE
router.post("/facture/:id/simuler",  verifyToken, isAdmin, simulerPaiement);

// 🔍 Vérification statut (polling)
router.get("/facture/:id/verifier",  verifyToken, isAdmin, verifierPaiement);

// 🔔 Webhook Konnect (pas d'auth)
router.post("/webhook", webhookPaiement);

module.exports = router;