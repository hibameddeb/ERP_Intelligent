const express = require("express");
const router  = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const {
  getAllFacturesAchat,
  getFactureAchatById,
  createFactureAchat,
  payerFactureAchat,
  annulerFactureAchat,
} = require("../controllers/factureController");

// 🔒 Apply auth to ALL routes
router.use(verifyToken);

router.get("/",                getAllFacturesAchat);
router.get("/:id",             getFactureAchatById);
router.post("/",               createFactureAchat);
router.patch("/:id/payer",     payerFactureAchat);
router.patch("/:id/annuler",   annulerFactureAchat);

module.exports = router;