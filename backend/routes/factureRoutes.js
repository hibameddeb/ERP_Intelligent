
const express = require('express');
const router = express.Router();
const factureController = require('../controllers/factureController');
router.get('/factures', factureController.getAllFactures);
router.get('/factures/:id', factureController.getFactureById);
router.post('/factures', factureController.createFacture);
router.patch('/factures/:id/emettre', factureController.emettreFacture);
router.patch('/factures/:id/payer', factureController.payerFacture);
router.patch('/factures/:id/annuler', factureController.annulerFacture);