const express = require('express');
const router = express.Router();
const commandeController = require('../controllers/commandeController');

router.get('/factures', commandeController.getFactures);  
router.get('/', commandeController.getAllCommandes);
router.get('/:id', commandeController.getCommandeById);
router.post('/', commandeController.createCommande);
router.delete('/:id', commandeController.deleteCommande);

module.exports = router;