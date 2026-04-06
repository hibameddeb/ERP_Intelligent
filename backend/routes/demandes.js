const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/authMiddleware'); 
const pool = require('../config/db');
const adminController = require('../controllers/adminController');


router.get('/rne/:identifiant',    verifyToken, adminController.consulterRNE);      
router.post('/valider/:idDemande', verifyToken, adminController.validerEtCreerClient); 
router.delete('/:id',              verifyToken, adminController.rejeterDemande);   
router.get('/', verifyToken, async (req, res) => {
    const result = await pool.query('SELECT * FROM demande_adhesion ORDER BY date_demande DESC');
    res.json(result.rows);
});

module.exports = router;