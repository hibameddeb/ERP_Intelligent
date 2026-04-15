const pool = require('../config/db');
const { logAction } = require('../utils/logs');
const { sendStatusEmail ,sendTransferEmail} = require('../utils/mailer');

exports.getUsers = async (req, res) => {
    const userRole = req.user.role;
    const userId   = req.user.id;
    const { roleFilter } = req.query;

    try {
        let query = `
            SELECT u.id, u.nom, u.prenom, u.email, u.role, u.num_tlp, u.est_actif,
                   c.id AS client_id,
                   c.type_identifiant, c.identifiant, c.ville, c.activite, c.id_commercial,
                   COALESCE(com.region, c.region) AS region
            FROM utilisateur u
            LEFT JOIN client     c   ON u.id = c.id_utilisateur
            LEFT JOIN commercial com ON u.id = com.id_utilisateur
            WHERE 1=1
        `;
        const queryParams = [];

        if (userRole === 'COMMERCIAL') {
            queryParams.push(userId);
            query += ` AND u.role = 'CLIENT' AND c.id_commercial = $${queryParams.length}`;
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
    const { nom, prenom, email, role, num_tlp, region } = req.body;

    if ((nom.length + prenom.length) > 40) {
        return res.status(400).json({ 
            message: "Le cumul Nom + Prénom ne doit pas dépasser 40 caractères." 
        });
    }

    if (role === 'CLIENT') {
        return res.status(400).json({ 
            message: "La création d'un client doit passer par le flux de validation des demandes d'adhésion." 
        });
    }

    if (role === 'ADMIN') {
        return res.status(403).json({ 
            message: "La création d'un compte administrateur est interdite via cette interface." 
        });
    }

    // Validation région obligatoire pour un COMMERCIAL
    if (role === 'COMMERCIAL' && (!region || !num_tlp)) {
        return res.status(400).json({ 
            message: "La région est obligatoire pour la création d'un compte commercial." 
        });
    }

    try {
        // Créer le compte utilisateur
        const userRes = await pool.query(
            `INSERT INTO utilisateur (nom, prenom, email, role, num_tlp, est_actif) 
             VALUES ($1, $2, $3, $4, $5, false) RETURNING id`,
            [nom, prenom, email, role, num_tlp]
        );

        const userId = userRes.rows[0].id;

        // Si c'est un COMMERCIAL → insérer dans la table dédiée avec la région
        if (role === 'COMMERCIAL') {
            await pool.query(
        `INSERT INTO commercial (id_utilisateur, telephone_pro, region) 
         VALUES ($1, $2, $3)`,
        [userId, num_tlp, region]
    );
        }

        await logAction(
            req.user.id, 
            "ADMIN_CREATE_STAFF", 
            `Création du compte personnel : ${email} (${role})${region ? ` - Région : ${region}` : ''}`
        );

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
        activite, num_autorisation, date_autorisation, num_etablissement, id_commercial , region
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

        if (currentRole === 'COMMERCIAL') {
            if (!region) {
                await db.query('ROLLBACK');
                return res.status(400).json({ message: "La région est obligatoire pour un commercial." });
            }
            await db.query(
                `UPDATE commercial 
                 SET telephone_pro=$1, region=$2
                 WHERE id_utilisateur=$3`,
                [num_tlp, region, id]
            );
        }
        await db.query('COMMIT');
        await logAction(
            req.user.id,
            "ADMIN_UPDATE_USER",
            `Mise à jour du profil ID:${id} (${currentRole})${region ? ` - Région : ${region}` : ''}`
        );

        res.status(200).json({ message: "Profil mis à jour avec succès." });

    } catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        db.release();
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    const { nouveau_commercial_id } = req.body; // ID du commercial cible

    const db = await pool.connect();
    try {
        await db.query('BEGIN');

        // 1. Vérifier le rôle et bloquer la suppression d'un ADMIN
        const userCheck = await db.query(
            'SELECT role, nom, prenom, email FROM utilisateur WHERE id = $1', [id]
        );
        if (userCheck.rows.length === 0)
            return res.status(404).json({ message: "Utilisateur non trouvé." });

        const { role, nom, prenom, email } = userCheck.rows[0];

        if (role === 'ADMIN')
            return res.status(403).json({ message: "Suppression d'un administrateur interdite." });

        // 2. Si c'est un COMMERCIAL, gérer le transfert de ses clients
        if (role === 'COMMERCIAL') {

            const clients = await db.query(
                `SELECT u.email, u.prenom, u.nom
                 FROM client c
                 JOIN utilisateur u ON u.id = c.id_utilisateur
                 WHERE c.id_commercial = $1`, [id]
            );

            if (clients.rows.length > 0) {

               
                if (!nouveau_commercial_id)
                    return res.status(400).json({ 
                        message: "Ce commercial a des clients. Veuillez fournir un nouveau_commercial_id." 
                    });

                // Vérifier que le nouveau commercial existe et est bien un COMMERCIAL
                const newComCheck = await db.query(
                    `SELECT id, nom, prenom, email FROM utilisateur 
                     WHERE id = $1 AND role = 'COMMERCIAL'`, [nouveau_commercial_id]
                );
                if (newComCheck.rows.length === 0)
                    return res.status(400).json({ message: "Nouveau commercial introuvable ou invalide." });

                const newCom = newComCheck.rows[0];

                // Transférer tous les clients
                await db.query(
                    `UPDATE client SET id_commercial = $1 WHERE id_commercial = $2`,
                    [nouveau_commercial_id, id]
                );

                // Notifier le commercial supprimé
                await sendStatusEmail(email, prenom, false, 
                    `Votre compte a été supprimé. Vos ${clients.rows.length} client(s) ont été transférés à ${newCom.prenom} ${newCom.nom}.`
                );

                // Notifier chaque client
                for (const client of clients.rows) {
                    await sendTransferEmail(
                        client.email, 
                        client.prenom,
                        `${prenom} ${nom}`,              // ancien commercial
                        `${newCom.prenom} ${newCom.nom}` // nouveau commercial
                    );
                }
            }
        }

        // 3. Supprimer l'utilisateur
        await db.query('DELETE FROM utilisateur WHERE id = $1', [id]);

        await logAction(req.user.id, "ADMIN_DELETE_USER", 
            `Suppression de ${prenom} ${nom} (${role}) - ID: ${id}`
        );

        await db.query('COMMIT');
        res.status(200).json({ message: "Utilisateur supprimé avec succès." });

    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err.message);
        res.status(500).json({ error: "Erreur lors de la suppression." });
    } finally {
        db.release();
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