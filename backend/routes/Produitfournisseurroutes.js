const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const {
  getAllProduitsFournisseur,
  getProduitFournisseurById,
  getProduitsByFournisseur,
  createProduitFournisseur,
  updateProduitFournisseur,
  deleteProduitFournisseur,
  addImageToProduit,
  deleteImage,
  setPrimaryImage,
  checkActiveOrders,
} = require("../controllers/produits_fournisseur");


router.get("/", getAllProduitsFournisseur);
router.get("/fournisseur/:id_fournisseur", getProduitsByFournisseur);
router.get("/:id/active-orders", checkActiveOrders);
router.get("/:id", getProduitFournisseurById);
router.post("/", upload.array('images'), createProduitFournisseur);
router.put("/:id", upload.array('images'), updateProduitFournisseur);
router.delete("/:id", deleteProduitFournisseur);

router.post("/:id/images", addImageToProduit);
router.delete("/:id/images/:id_image", deleteImage);
router.patch("/:id/images/:id_image/primary", setPrimaryImage);

module.exports = router;