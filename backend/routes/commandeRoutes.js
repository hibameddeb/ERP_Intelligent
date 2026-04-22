const express = require('express');
const router = express.Router();
const commandeController = require('../controllers/commandeController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, commandeController.getAllCommandes);
router.get('/mes-commandes', verifyToken, commandeController.getMesCommandes);
router.get('/:id', verifyToken, commandeController.getCommandeById);
router.post('/', verifyToken, commandeController.createCommande);
router.post('/:id/valider', verifyToken, commandeController.validerCommande);
router.post('/:id/cancel', verifyToken, commandeController.cancelCommande);

module.exports = router;