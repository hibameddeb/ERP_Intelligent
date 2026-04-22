// factureRoutes.js — vente uniquement
const express = require("express");
const router  = express.Router();
const factureController = require("../controllers/factureController");

router.get("/",                  factureController.getAllFactures);
router.get("/:id",               factureController.getFactureById);
router.post("/",                 factureController.createFacture);
router.patch("/:id/emettre",     factureController.emettreFacture);
router.patch("/:id/payer",       factureController.payerFacture);
router.patch("/:id/annuler",     factureController.annulerFacture);

module.exports = router;