const pool = require('../config/db');

const logActivity = async (client, { id_utilisateur, action, description }) => {
    await client.query(
        `INSERT INTO log_activite (id_utilisateur, action, description, date_heure)
         VALUES ($1, $2, $3, NOW())`,
        [id_utilisateur, action, description]
    );
};


const getAllFactures = async (req, res) => {
    const db = await pool.connect();
    try {
        const result = await db.query(`
            SELECT
                f.id,
                f.num_facture,
                f.num_ordre,
                f.trimestre,
                f.type_en,
                f.statut,
                f.status_electronique,
                f.total_ttc,
                f.date_creation,
                f.date_validation,
                f.date_envois,
                f.score_ia_confiance,
                f.alerte_fraude_ia,
                f.id_commande,
                -- Commercial
                f.id_commercial,
                u_com.nom    AS commercial_nom,
                u_com.prenom AS commercial_prenom,
                -- Client
                f.id_client,
                c.identifiant AS client_identifiant,
                c.adresse     AS client_adresse,
                c.ville       AS client_ville,
                u_cli.nom    AS client_nom,
                u_cli.prenom AS client_prenom
            FROM facture f
            LEFT JOIN utilisateur u_com ON u_com.id = f.id_commercial
            LEFT JOIN client      c     ON c.id     = f.id_client
            LEFT JOIN utilisateur u_cli ON u_cli.id = c.id_utilisateur
            ORDER BY f.date_creation DESC
        `);

        await logActivity(db, {
            id_utilisateur: req.user?.id || null,
            action: 'CONSULTER_FACTURES',
            description: `Consultation liste factures (${result.rows.length} résultats)`,
        });

        return res.status(200).json({ success: true, count: result.rows.length, data: result.rows });
    } catch (err) {
        console.error('getAllFactures error:', err);
        return res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
    } finally { db.release(); }
};


const getFactureById = async (req, res) => {
    const { id } = req.params;
    const db = await pool.connect();
    try {
        const factureResult = await db.query(`
            SELECT
                f.*,
                u_com.nom    AS commercial_nom,
                u_com.prenom AS commercial_prenom,
                c.identifiant AS client_identifiant,
                c.adresse     AS client_adresse,
                c.ville       AS client_ville,
                u_cli.nom    AS client_nom,
                u_cli.prenom AS client_prenom
            FROM facture f
            LEFT JOIN utilisateur u_com ON u_com.id = f.id_commercial
            LEFT JOIN client      c     ON c.id     = f.id_client
            LEFT JOIN utilisateur u_cli ON u_cli.id = c.id_utilisateur
            WHERE f.id = $1
        `, [id]);

        if (factureResult.rows.length === 0)
            return res.status(404).json({ success: false, message: 'Facture introuvable.' });

        const detailsResult = await db.query(`
            SELECT
                df.id,
                df.id_produit,
                p.nom_produit,
                p.taux_tva,
                p.taux_fodec,
                p.taux_dc,
                df.quantite_achetee,
                df.prix_unitaire_ht_ap,
                (df.quantite_achetee * df.prix_unitaire_ht_ap) AS total_ht_ligne
            FROM detail_facture df
            LEFT JOIN produit p ON p.id = df.id_produit
            WHERE df.id_facture = $1
        `, [id]);

        await logActivity(db, {
            id_utilisateur: req.user?.id || null,
            action: 'CONSULTER_FACTURE',
            description: `Consultation facture #${id}`,
        });

        return res.status(200).json({
            success: true,
            data: { facture: factureResult.rows[0], details: detailsResult.rows },
        });
    } catch (err) {
        console.error('getFactureById error:', err);
        return res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
    } finally { db.release(); }
};

const createFacture = async (req, res) => {
    const db = await pool.connect();
    try {
        await db.query('BEGIN');

        const {
            id_client, id_commercial, id_societe, id_comptable,
            trimestre, type_en, details = []
        } = req.body;

        if (!id_client || !id_commercial) {
            await db.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'id_client et id_commercial sont requis.' });
        }
        if (!Array.isArray(details) || details.length === 0) {
            await db.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'Au moins un produit est requis.' });
        }

      
        const clientCheck = await db.query(
            `SELECT c.id, u.est_actif FROM client c
             JOIN utilisateur u ON c.id_utilisateur = u.id
             WHERE c.id_utilisateur = $1`, [id_client]
        );
        if (clientCheck.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ success: false, message: `Client introuvable id=${id_client}.` });
        }
        if (!clientCheck.rows[0].est_actif) {
            await db.query('ROLLBACK');
            return res.status(403).json({ success: false, message: "Le compte de ce client est inactif." });
        }
        const real_id_client = clientCheck.rows[0].id;

       
        let total_ttc = 0;
        const lignesValidees = [];

        for (const ligne of details) {
            if (!ligne.id_produit || !ligne.quantite_achetee) {
                await db.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'Chaque ligne doit avoir id_produit et quantite_achetee.' });
            }

            const produitRes = await db.query(
                'SELECT prix_unitaire_ht, taux_tva, taux_fodec, taux_dc, nom_produit FROM produit WHERE id = $1',
                [ligne.id_produit]
            );
            if (produitRes.rows.length === 0) {
                await db.query('ROLLBACK');
                return res.status(400).json({ success: false, message: `Produit id=${ligne.id_produit} introuvable.` });
            }

            const p       = produitRes.rows[0];
            const qty     = parseFloat(ligne.quantite_achetee) || 0;
            const prix_ht = parseFloat(ligne.prix_unitaire_ht_ap || p.prix_unitaire_ht) || 0;

            if (qty <= 0 || prix_ht < 0) {
                await db.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'Quantité et prix doivent être positifs.' });
            }

            const montant_ht = prix_ht * qty;
            const fodec = montant_ht * (parseFloat(p.taux_fodec) || 0) / 100;
            const tva   = (montant_ht + fodec) * (parseFloat(p.taux_tva) || 0) / 100;
            const dc    = montant_ht * (parseFloat(p.taux_dc) || 0) / 100;
            total_ttc  += (montant_ht + fodec + tva - dc);
            lignesValidees.push({ ...ligne, prix_ht, qty });
        }

        // ── Insertion facture ─────────────────────────────────────────────────
        const numFacture = `FAC-${Date.now()}`;
        const factureRes = await db.query(`
            INSERT INTO facture
                (id_client, id_commercial, id_societe, id_comptable,
                 num_facture, trimestre, type_en, statut, total_ttc,
                 identifiant_global_unique, date_creation)
            VALUES ($1,$2,$3,$4,$5,$6,$7,'BROUILLON',$8,gen_random_uuid(),NOW())
            RETURNING *
        `, [real_id_client, id_commercial, id_societe||null, id_comptable||null,
            numFacture, trimestre||null, type_en||'DF', parseFloat(total_ttc.toFixed(3))]);

        const newFacture = factureRes.rows[0];

        // ── Insertion détails ─────────────────────────────────────────────────
        const insertedDetails = [];
        for (const ligne of lignesValidees) {
            const detailRes = await db.query(`
                INSERT INTO detail_facture (id_facture, id_produit, quantite_achetee, prix_unitaire_ht_ap)
                VALUES ($1,$2,$3,$4) RETURNING *
            `, [newFacture.id, ligne.id_produit, ligne.qty, ligne.prix_ht]);
            insertedDetails.push(detailRes.rows[0]);
        }

        await logActivity(db, {
            id_utilisateur: req.user?.id || id_commercial,
            action: 'CREER_FACTURE',
            description: `Création facture manuelle #${newFacture.id} (${numFacture})`,
        });

        await db.query('COMMIT');
        return res.status(201).json({
            success: true,
            message: 'Facture créée avec succès.',
            data: { facture: newFacture, details: insertedDetails },
        });

    } catch (err) {
        await db.query('ROLLBACK');
        console.error('createFacture error:', err);
        return res.status(500).json({ success: false, message: 'Erreur création.', error: err.message });
    } finally { db.release(); }
};

// ─── EMETTRE (BROUILLON → EMISE) ─────────────────────────────────────────────
const emettreFacture = async (req, res) => {
    const { id } = req.params;
    const db = await pool.connect();
    try {
        await db.query('BEGIN');

        const checkRes = await db.query('SELECT id, statut, num_facture FROM facture WHERE id = $1', [id]);
        if (checkRes.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Facture introuvable.' });
        }
        if (checkRes.rows[0].statut !== 'BROUILLON') {
            await db.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: `Statut actuel="${checkRes.rows[0].statut}". Seuls les brouillons peuvent être émis.`,
            });
        }

        const result = await db.query(`
            UPDATE facture
            SET statut = 'EMISE', date_validation = NOW(), date_envois = NOW()
            WHERE id = $1 RETURNING *
        `, [id]);

        await logActivity(db, {
            id_utilisateur: req.user?.id || null,
            action: 'EMETTRE_FACTURE',
            description: `Émission facture #${id} (${checkRes.rows[0].num_facture})`,
        });

        await db.query('COMMIT');
        return res.status(200).json({ success: true, message: `Facture #${id} émise.`, data: result.rows[0] });

    } catch (err) {
        await db.query('ROLLBACK');
        console.error('emettreFacture error:', err);
        return res.status(500).json({ success: false, message: 'Erreur émission.', error: err.message });
    } finally { db.release(); }
};

// ─── MARQUER PAYÉE ────────────────────────────────────────────────────────────
const payerFacture = async (req, res) => {
    const { id } = req.params;
    const db = await pool.connect();
    try {
        const checkRes = await db.query('SELECT id, statut FROM facture WHERE id = $1', [id]);
        if (checkRes.rows.length === 0)
            return res.status(404).json({ success: false, message: 'Facture introuvable.' });
        if (checkRes.rows[0].statut !== 'EMISE')
            return res.status(400).json({ success: false, message: `Statut="${checkRes.rows[0].statut}". Seules les factures EMISES peuvent être marquées payées.` });

        const result = await db.query(
            `UPDATE facture SET statut = 'PAYEE' WHERE id = $1 RETURNING *`, [id]
        );

        await logActivity(db, {
            id_utilisateur: req.user?.id || null,
            action: 'PAYER_FACTURE',
            description: `Facture #${id} marquée PAYEE`,
        });

        return res.status(200).json({ success: true, message: `Facture #${id} marquée payée.`, data: result.rows[0] });
    } catch (err) {
        console.error('payerFacture error:', err);
        return res.status(500).json({ success: false, message: 'Erreur.', error: err.message });
    } finally { db.release(); }
};

// ─── ANNULER ──────────────────────────────────────────────────────────────────
const annulerFacture = async (req, res) => {
    const { id } = req.params;
    const db = await pool.connect();
    try {
        const checkRes = await db.query('SELECT id, statut FROM facture WHERE id = $1', [id]);
        if (checkRes.rows.length === 0)
            return res.status(404).json({ success: false, message: 'Facture introuvable.' });
        if (checkRes.rows[0].statut === 'PAYEE')
            return res.status(403).json({ success: false, message: 'Impossible d\'annuler une facture déjà payée.' });

        const result = await db.query(
            `UPDATE facture SET statut = 'ANNULEE' WHERE id = $1 RETURNING *`, [id]
        );

        await logActivity(db, {
            id_utilisateur: req.user?.id || null,
            action: 'ANNULER_FACTURE',
            description: `Facture #${id} annulée`,
        });

        return res.status(200).json({ success: true, message: `Facture #${id} annulée.`, data: result.rows[0] });
    } catch (err) {
        console.error('annulerFacture error:', err);
        return res.status(500).json({ success: false, message: 'Erreur.', error: err.message });
    } finally { db.release(); }
};

// ─── LOGS ─────────────────────────────────────────────────────────────────────
const getActivityLogs = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT log.id, log.action, log.date_heure, log.description,
                   u.nom, u.prenom, u.role
            FROM log_activite log
            JOIN utilisateur u ON log.id_utilisateur = u.id
            ORDER BY log.date_heure DESC
        `);
        return res.status(200).json(result.rows);
    } catch (err) {
        console.error('getActivityLogs error:', err.message);
        return res.status(500).json({ error: 'Erreur logs.', detail: err.message });
    }
};

module.exports = {
    getAllFactures,
    getFactureById,
    createFacture,
    emettreFacture,
    payerFacture,
    annulerFacture,
    getActivityLogs,
};