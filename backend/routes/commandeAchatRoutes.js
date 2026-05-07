const express = require("express");
const router = express.Router();
const commandeAchatController = require("../controllers/commandeAchatController");
const {
  verifyToken,
  isAdmin,
  isAdminOrFournisseur,
  isFournisseur,
} = require("../middleware/authMiddleware");

router.get("/", verifyToken, isAdmin, commandeAchatController.getAllCommandesAchat);
router.get("/mes-commandes", verifyToken, isFournisseur, commandeAchatController.getMesCommandes);

router.post("/", verifyToken, isAdmin, commandeAchatController.createCommandeAchat);

router.get("/:id", verifyToken, isAdminOrFournisseur, commandeAchatController.getCommandeAchatById);

router.get("/:id/pdf", verifyToken, isAdminOrFournisseur, commandeAchatController.getCommandePdf);

router.get("/fournisseur/:id_fournisseur", verifyToken, isAdminOrFournisseur, commandeAchatController.getCommandesByFournisseur);


router.post("/:id/valider",   verifyToken, isFournisseur, commandeAchatController.validerCommandeAchat);
router.post("/:id/cancel",    verifyToken, isFournisseur, commandeAchatController.cancelCommandeAchat);

router.patch("/:id/livraison", verifyToken, isAdmin,      commandeAchatController.marquerLivraison);

module.exports = router;