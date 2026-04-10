// produitRoutes.js
const express = require('express');
const router = express.Router();
const produitController = require('../controllers/produitController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/',    verifyToken, isAdmin, upload.array('images', 5), produitController.createProduit);
router.get('/',     verifyToken, produitController.getAllProduits);
router.put('/:id',  verifyToken, isAdmin, upload.array('images', 5), produitController.updateProduit);
router.delete('/:id', verifyToken, isAdmin, produitController.deleteProduit);
router.get('/:id/images', verifyToken, produitController.getProduitImages);

module.exports = router;