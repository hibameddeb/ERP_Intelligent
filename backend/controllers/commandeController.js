const pool = require('../config/db');

const logActivity = async (client, { id_utilisateur, action, description }) => {
    await client.query(
        `INSERT INTO log_activite (id_utilisateur, action, description, date_heure)
         VALUES ($1, $2, $3, NOW())`,
        [id_utilisateur, action, description]
    );
};

// ─────────────────────────────────────────────
// GET ALL
// ─────────────────────────────────────────────
const getAllCommandes = async (req, res) => {
    const db = await pool.connect();
    try {
const result = await db.query(`
    SELECT
        cmd.id,
        cmd.num_ordre,
        cmd.trimestre,
        cmd.type_en,
        cmd.statut,
        cmd.total_ttc,
        cmd.date_creation,
        cmd.date_validation,
        cmd.score_ia_confiance,
        cmd.alerte_fraude_ia,
        cmd.id_commercial,
        u_com.nom AS commercial_nom,
        u_com.prenom AS commercial_prenom,
        cmd.id_client,
        c.identifiant AS client_identifiant,
        c.adresse,
        c.ville,
        u_cli.nom AS client_nom,
        u_cli.prenom AS client_prenom
    FROM commande cmd
    LEFT JOIN utilisateur u_com ON u_com.id = cmd.id_commercial
    LEFT JOIN client c ON c.id_utilisateur = cmd.id_client
    LEFT JOIN utilisateur u_cli ON u_cli.id = cmd.id_client
    ORDER BY cmd.date_creation DESC
`);

        await logActivity(db, {
            id_utilisateur: req.user?.id || null,
            action: 'CONSULTER_COMMANDES',
            description: `Liste commandes (${result.rows.length})`,
        });

        return res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: err.message });
    } finally {
        db.release();
    }
};

// ─────────────────────────────────────────────
// GET BY ID
// ─────────────────────────────────────────────
const getCommandeById = async (req, res) => {
    const { id } = req.params;
    const db = await pool.connect();

    try {
        const cmdResult = await db.query(`
            SELECT
                cmd.*,
                u_com.nom AS commercial_nom,
                u_com.prenom AS commercial_prenom,
                c.identifiant AS client_identifiant,
                c.adresse AS client_adresse,
                c.ville AS client_ville,
                u_cli.nom AS client_nom,
                u_cli.prenom AS client_prenom
            FROM commande cmd
            LEFT JOIN utilisateur u_com ON u_com.id = cmd.id_commercial
            LEFT JOIN client c ON c.id_utilisateur = cmd.id_client
            LEFT JOIN utilisateur u_cli ON u_cli.id = cmd.id_client
            WHERE cmd.id = $1
        `, [id]);

        if (cmdResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Commande introuvable' });
        }

        const detailsResult = await db.query(`
            SELECT
                dc.*,
                p.nom_produit,
                p.taux_tva,
                p.taux_fodec,
                p.taux_dc,
                (dc.quantite_achetee * dc.prix_unitaire_ht_ap) AS total_ht_ligne
            FROM detail_commande dc
            LEFT JOIN produit p ON p.id = dc.id_produit
            WHERE dc.id_commande = $1
        `, [id]);

        return res.json({
            success: true,
            data: {
                commande: cmdResult.rows[0],
                details: detailsResult.rows
            }
        });

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    } finally {
        db.release();
    }
};

// ─────────────────────────────────────────────
// CREATE COMMANDE (FIXED)
// ─────────────────────────────────────────────
const createCommande = async (req, res) => {
    const db = await pool.connect();

    try {
        await db.query('BEGIN');

        const {
            id_client,
            id_commercial,
            id_societe,
            id_comptable,
            trimestre,
            details = []
        } = req.body;

        const type_en = 'DF';

        if (!id_client || !id_commercial) {
            await db.query('ROLLBACK');
            return res.status(400).json({ message: 'id_client et id_commercial requis' });
        }

        if (!Array.isArray(details) || details.length === 0) {
            await db.query('ROLLBACK');
            return res.status(400).json({ message: 'details requis' });
        }

        const clientCheck = await db.query(`
            SELECT u.id, u.est_actif
            FROM client c
            JOIN utilisateur u ON u.id = c.id_utilisateur
            WHERE c.id_utilisateur = $1
        `, [id_client]);

        if (!clientCheck.rows.length) {
            await db.query('ROLLBACK');
            return res.status(404).json({ message: 'Client introuvable' });
        }

        if (!clientCheck.rows[0].est_actif) {
            await db.query('ROLLBACK');
            return res.status(403).json({ message: 'Client inactif' });
        }

        // commercial check
        const commercialCheck = await db.query(
            `SELECT id FROM utilisateur WHERE id=$1 AND role='COMMERCIAL'`,
            [id_commercial]
        );

        if (!commercialCheck.rows.length) {
            await db.query('ROLLBACK');
            return res.status(400).json({ message: 'Commercial invalide' });
        }

        let total_ttc = 0;
        const lignes = [];

        for (const l of details) {
            const pRes = await db.query(
                `SELECT * FROM produit WHERE id=$1`,
                [l.id_produit]
            );

            if (!pRes.rows.length) {
                await db.query('ROLLBACK');
                return res.status(400).json({ message: 'Produit introuvable' });
            }

            const p = pRes.rows[0];
            const qty = Number(l.quantite_achetee);
            const price = Number(l.prix_unitaire_ht_ap || p.prix_unitaire_ht);

            const ht = qty * price;
            const f = ht * (p.taux_fodec || 0) / 100;
            const t = (ht + f) * (p.taux_tva || 0) / 100;
            const d = ht * (p.taux_dc || 0) / 100;

            total_ttc += ht + f + t - d;

            lignes.push({ ...l, price, qty });
        }

        const cmdRes = await db.query(`
            INSERT INTO commande (
                id_client, id_commercial, id_societe, id_comptable,
                trimestre, type_en, statut, total_ttc,
                identifiant_global_unique, date_creation
            )
            VALUES ($1,$2,$3,$4,$5,$6,'EN_ATTENTE',$7,gen_random_uuid(),NOW())
            RETURNING *
        `, [
            id_client,
            id_commercial,
            id_societe || null,
            id_comptable || null,
            trimestre || null,
            type_en,
            total_ttc.toFixed(3)
        ]);

        const newCmd = cmdRes.rows[0];

        for (const l of lignes) {
            await db.query(`
                INSERT INTO detail_commande
                (id_commande,id_produit,quantite_achetee,prix_unitaire_ht_ap)
                VALUES ($1,$2,$3,$4)
            `, [newCmd.id, l.id_produit, l.qty, l.price]);
        }

        await db.query('COMMIT');

        return res.status(201).json({
            success: true,
            data: newCmd
        });

    } catch (err) {
        await db.query('ROLLBACK');
        return res.status(500).json({ message: err.message });
    } finally {
        db.release();
    }
};

// ─────────────────────────────────────────────
// CANCEL COMMANDE (NEW)
// ─────────────────────────────────────────────
const cancelCommande = async (req, res) => {
    const { id } = req.params;
    const db = await pool.connect();

    try {
        const check = await db.query(
            `SELECT statut FROM commande WHERE id=$1`,
            [id]
        );

        if (!check.rows.length) {
            return res.status(404).json({ message: 'Introuvable' });
        }

        if (check.rows[0].statut !== 'EN_ATTENTE') {
            return res.status(400).json({ message: 'Impossible à annuler' });
        }

        await db.query(
            `UPDATE commande SET statut='ANNULEE' WHERE id=$1`,
            [id]
        );

        return res.json({ success: true });

    } finally {
        db.release();
    }
};

// ─────────────────────────────────────────────
// VALIDATE COMMANDE
// ─────────────────────────────────────────────
const validerCommande = async (req, res) => {
    const { id } = req.params;
    const db = await pool.connect();

    try {
        const cmd = await db.query(`SELECT * FROM commande WHERE id=$1`, [id]);

        if (!cmd.rows.length) {
            return res.status(404).json({ message: 'Introuvable' });
        }

        if (cmd.rows[0].statut !== 'EN_ATTENTE') {
            return res.status(400).json({ message: 'Déjà traitée' });
        }

        await db.query(
            `UPDATE commande SET statut='VALIDEE', date_validation=NOW() WHERE id=$1`,
            [id]
        );

        return res.json({ success: true });

    } finally {
        db.release();
    }
};

module.exports = {
    getAllCommandes,
    getCommandeById,
    createCommande,
    validerCommande,
    cancelCommande
};