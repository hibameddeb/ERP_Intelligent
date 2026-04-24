const express = require("express");
const router  = express.Router();
const {
  getAllFacturesAchat,
  getFactureAchatById,
  createFactureAchat,
  recevoirFactureAchat,
  payerFactureAchat,
  annulerFactureAchat,
} = require("../controllers/factureController");

router.get("/",                   getAllFacturesAchat);
router.get("/:id",                getFactureAchatById);
router.post("/",                  createFactureAchat);
router.patch("/:id/recevoir",     recevoirFactureAchat);
router.patch("/:id/payer",        payerFactureAchat);
router.patch("/:id/annuler",      annulerFactureAchat);

module.exports = router;