const express = require("express");
const router = express.Router();
const reclamationCtrl = require("../controllers/reclamationController");
const chatCtrl = require("../controllers/chatController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// ── Réclamations ──────────────────────────────────────────────────────────────
router.post("/reclamations",              verifyToken,          reclamationCtrl.createReclamation);
router.get("/reclamations/admin",         verifyToken, isAdmin, reclamationCtrl.getReclamationsByAdmin);
router.get("/reclamations/mes-reclamations", verifyToken,       reclamationCtrl.getMesReclamations);
router.put("/reclamations/:id",             verifyToken,       reclamationCtrl.updateReclamation);

// ── Admin contact (accessible to all authenticated users incl. fournisseurs) ──
router.get("/admin-contact",        verifyToken, chatCtrl.getAdminContact);
router.get("/admins",               verifyToken, chatCtrl.getAdmins);

// ── Chat ──────────────────────────────────────────────────────────────────────
router.post("/messages",            verifyToken, chatCtrl.sendMessage);
router.get("/messages/:contactId",  verifyToken, chatCtrl.getConversation);

module.exports = router;