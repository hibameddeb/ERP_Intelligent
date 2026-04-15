const express = require('express');
const router = express.Router();
const commandeController = require('../controllers/commandeController');

router.get('/', commandeController.getAllCommandes);
router.get('/:id',commandeController.getCommandeById);
router.post('/',commandeController.createCommande);
router.post('/:id/valider', commandeController.validerCommande);
router.post('/:id/cancel',  commandeController.cancelCommande);

module.exports = router;