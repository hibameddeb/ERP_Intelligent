const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { verifyToken, isAdmin } = require('../middleware/auth'); 

router.post('/register-request', clientController.createClientRequest);

router.get('/request-details/:id', verifyToken, isAdmin, clientController.getRequestDetails);

router.get('/verify-rne/:matricule', verifyToken, isAdmin, clientController.verifyRNE);


router.post('/finalize-activation/:id', verifyToken, isAdmin, clientController.finalizeActivation);

module.exports = router;