const express = require('express');
const router = express.Router();
const demandeController = require('../controllers/demandeController');

router.post('/soumettre', demandeController.creerDemandeAdhesion);

module.exports = router;