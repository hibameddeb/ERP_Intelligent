const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.get('/verifier-rne/:identifiant', verifyToken, isAdmin, adminController.consulterRNE);

router.post('/valider-client/:idDemande', verifyToken, isAdmin, adminController.validerEtCreerClient);

module.exports = router;