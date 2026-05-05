const express = require("express");
const router = express.Router();
const { verifyToken, isAdmin, isStaff } = require("../middleware/authMiddleware");
const {
  getAllProduitsEntreprise,
  getProduitEntrepriseById,
  getProduitsFromFacture,
  getFacturesAchat,
  createProduitEntreprise,
  updateProduitEntreprise,
  deleteProduitEntreprise,
  getMaxQuantite
} = require("../controllers/produitController");


router.get("/",                                    verifyToken, isStaff, getAllProduitsEntreprise);

router.get("/factures",                            verifyToken, isAdmin, getFacturesAchat);
router.get("/factures/:id_facture/produits",       verifyToken, isAdmin, getProduitsFromFacture);
router.get("/max-quantite/:id_produit_f",          verifyToken, isAdmin, getMaxQuantite);

router.get("/:id",                                 verifyToken, isStaff, getProduitEntrepriseById);

router.post("/",                                   verifyToken, isAdmin, createProduitEntreprise);
router.put("/:id",                                 verifyToken, isAdmin, updateProduitEntreprise);
router.delete("/:id",                              verifyToken, isAdmin, deleteProduitEntreprise);
 
module.exports = router;
