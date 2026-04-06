const pool = require('../config/db');
const { logAction } = require('../utils/logs');
const { sendStatusEmail } = require('../utils/mailer');

exports.getUsers = async (req, res) => {
    const userRole = req.user.role;
    const { roleFilter } = req.query;

    try {
        let query = `
            SELECT u.id, u.nom, u.prenom, u.email, u.role, u.num_tlp, u.est_actif,
                   c.type_identifiant, c.identifiant, c.ville, c.activite
            FROM utilisateur u
            LEFT JOIN client c ON u.id = c.id_utilisateur
            WHERE 1=1
        `;
        const queryParams = [];

        if (userRole === 'COMMERCIAL') {
            query += ` AND u.role = 'CLIENT'`;
        } 
        else if (userRole === 'COMPTABLE') {
            query += ` AND u.role IN ('CLIENT', 'COMMERCIAL')`;
        } 
        else if (userRole === 'ADMIN') {
            if (roleFilter) {
                queryParams.push(roleFilter.toUpperCase());
                query += ` AND u.role = $${queryParams.length}`;
            }
        } 
        else {
            return res.status(403).json({ message: "Accès non autorisé à la liste." });
        }

        query += ` ORDER BY u.id ASC`;

        const result = await pool.query(query, queryParams);

        
      

        await logAction(req.user.id, "VIEW_USERS", `Consultation liste - Filtre: ${roleFilter || 'Aucun'}`);

        res.status(200).json(result.rows);

    } catch (err) {
        console.error("GET USERS ERROR:", err.message);
        res.status(500).json({ error: "Erreur lors de la récupération." });
    }
};

exports.createUser = async (req, res) => {
    const { nom, prenom, email, role, num_tlp } = req.body;

  
    if ((nom.length + prenom.length) > 40) {
        return res.status(400).json({ message: "Le cumul Nom + Prénom ne doit pas dépasser 40 caractères." });
    }  if (role === 'CLIENT') {
        return res.status(400).json({ 
            message: "La création d'un client doit passer par le flux de validation des demandes d'adhésion." 
        });
    }

    try {
        const userRes = await pool.query(
            `INSERT INTO utilisateur (nom, prenom, email, role, num_tlp, est_actif) 
             VALUES ($1, $2, $3, $4, $5, false) RETURNING id`,
            [nom, prenom, email, role, num_tlp]
        );
        
        await logAction(req.user.id, "ADMIN_CREATE_STAFF", `Création du compte personnel : ${email} (${role})`);
        
        res.status(201).json({ message: `Compte ${role} créé avec succès.` });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Erreur lors de la création de l'utilisateur." });
    }
};

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { 
        nom, prenom, email, num_tlp,
        type_identifiant, identifiant, adresse, ville, rue, 
        activite, num_autorisation, date_autorisation, num_etablissement, id_commercial 
    } = req.body;

    const db = await pool.connect();
    try {
        await db.query('BEGIN');
        const userCheck = await db.query('SELECT role FROM utilisateur WHERE id = $1', [id]);
        if (userCheck.rows.length === 0) return res.status(404).json({ message: "Utilisateur non trouvé" });
        
        const currentRole = userCheck.rows[0].role;

    
        await db.query(
            `UPDATE utilisateur SET nom=$1, prenom=$2, email=$3, num_tlp=$4 WHERE id=$5`,
            [nom, prenom, email, num_tlp, id]
        );

        if (currentRole === 'CLIENT') {
            await db.query(
                `UPDATE client SET type_identifiant=$1, identifiant=$2, adresse=$3, ville=$4, rue=$5, activite=$6, num_autorisation=$7, date_autorisation=$8, num_etablissement=$9, id_commercial=$10 WHERE id_utilisateur=$11`,
                [type_identifiant, identifiant, adresse, ville, rue, activite, num_autorisation, date_autorisation, num_etablissement, id_commercial, id]
            );
        }

        await db.query('COMMIT');
        res.status(200).json({ message: "Profil mis à jour (le rôle reste inchangé)." });
    } catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        db.release();
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM utilisateur WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        await logAction(req.user.id, "ADMIN_DELETE_USER", `Suppression de l'utilisateur ID : ${id}`);
        
        res.status(200).json({ message: "Utilisateur (et ses données client) supprimé avec succès." });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Erreur lors de la suppression." });
    }
};


exports.toggleUserStatus = async (req, res) => {
    const { id } = req.params;
    const { est_actif } = req.body; 

    try {
        
        const result = await pool.query(
            'UPDATE utilisateur SET est_actif = $1 WHERE id = $2 RETURNING nom, prenom, email',
            [est_actif, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        const user = result.rows[0];
       let mailSent = true;
        try {
            await sendStatusEmail(user.email, user.prenom, est_actif);
        } catch (mailErr) {
            console.error("Email non envoyé:", mailErr.message);
            mailSent = false; 
        }

       
        const actionLabel = est_actif ? "ACTIVATION" : "DÉSACTIVATION";
       
        await logAction(
            req.user.id, 
            `ADMIN_${actionLabel}`, 
            `${actionLabel} du compte de ${user.prenom} ${user.nom} (${user.email})`
        );

        res.status(200).json({ 
                message: mailSent 
                    ? `Le compte a été ${est_actif ? 'activé' : 'désactivé'} et l'email a été envoyé.` 
                    : `Le compte a été ${est_actif ? 'activé' : 'désactivé'}, mais l'email n'a pas pu partir.` 
            });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Erreur lors du changement de statut." });
    }
};