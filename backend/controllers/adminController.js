const axios = require('axios');
const pool = require('../config/db');


exports.consulterRNE = async (req, res) => {
    const { identifiant } = req.params; 

    try {
        const response = await axios.get(`https://votre-api-rne.tn/api/verify/${identifiant}`, {
            headers: { 'Authorization': `Bearer ${process.env.RNE_API_KEY}` }
        });

        const rneData = response.data;

        if (rneData) {
            res.status(200).json({
                success: true,
                data: {
                    
                    adresse: rneData.address,
                    ville: rneData.city,
                    rue: rneData.street,
                    activite: rneData.main_activity
                }
            });
        }
    } catch (err) {
        res.status(404).json({ message: "Matricule non trouvé sur l'API officielle." });
    }
};

// 2. Transférer de 'demande_adhesion' vers 'utilisateur' et 'client'
exports.validerEtCreerClient = async (req, res) => {
    const { idDemande } = req.params;
    const { id_commercial, score_solvabilite_ia } = req.body; // Données remplies par l'admin
    
    const db = await pool.connect();
    try {
        await db.query('BEGIN');

        // Récupérer la demande temporaire
        const demande = await db.query('SELECT * FROM demande_adhesion WHERE id = $1', [idDemande]);
        const d = demande.rows[0];

        // Créer l'utilisateur (est_actif reste false jusqu'à l'activation par mail)
        const userRes = await db.query(
            `INSERT INTO utilisateur (nom, prenom, email, role, num_tlp, est_actif) 
             VALUES ($1, $2, $3, 'CLIENT', $4, false) RETURNING id`,
            [d.nom, d.prenom, d.email, d.num_tlp]
        );
        const newUserId = userRes.rows[0].id;

        // Créer le client avec les colonnes de ton image
        await db.query(
            `INSERT INTO client (
                id_utilisateur, type_identifiant, identifiant, adresse, 
                ville, rue, activite, num_etablissement, id_commercial, score_solvabilite_ia
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [newUserId, d.type_identifiant, d.identifiant, d.adresse, d.ville, d.rue, d.activite, d.num_etablissement, id_commercial, score_solvabilite_ia]
        );

        // Supprimer la demande traitée
        await db.query('DELETE FROM demande_adhesion WHERE id = $1', [idDemande]);

        await db.query('COMMIT');
        res.status(201).json({ message: "Client créé avec succès dans la base officielle." });
    } catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        db.release();
    }
};
exports.rejeterDemande = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM demande_adhesion WHERE id = $1', [id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Demande non trouvée." });
        }

        res.status(200).json({ message: "Demande rejetée et supprimée avec succès." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};