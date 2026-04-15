const pool = require('../config/db');
const { logAction } = require('../utils/logs');
const { sendStockAlertEmail } = require('../utils/mailer');

exports.getAllProduits = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, 
            (SELECT image_url FROM produit_image WHERE id_produit = p.id AND is_primary = true LIMIT 1) as main_image
            FROM produit p 
            ORDER BY p.nom_produit ASC
        `);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Erreur lors de la récupération des produits." });
    }
};

exports.createProduit = async (req, res) => {
    // ✅ categorie et quantite ajoutés
    const { nom_produit, description, prix_unitaire_ht, taux_tva, taux_fodec, taux_dc, categorie, quantite } = req.body;
    const images = req.files;

    // ✅ Validation quantite
    if (quantite !== undefined && (isNaN(quantite) || parseInt(quantite) < 0)) {
        return res.status(400).json({ message: "La quantité doit être un entier positif." });
    }

    const db = await pool.connect();
    try {
        await db.query('BEGIN');

        const produitRes = await db.query(
            `INSERT INTO produit (nom_produit, description, prix_unitaire_ht, taux_tva, taux_fodec, taux_dc, categorie, quantite) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            [nom_produit, description, prix_unitaire_ht, taux_tva, taux_fodec, taux_dc,
             categorie || null, quantite !== undefined ? parseInt(quantite) : 0]
        );
        const produitId = produitRes.rows[0].id;

        if (images && images.length > 0) {
            for (let i = 0; i < images.length; i++) {
                const path = `/uploads/produits/${images[i].filename}`;
                const primary = (i === 0);
                await db.query(
                    `INSERT INTO produit_image (id_produit, image_url, is_primary) VALUES ($1, $2, $3)`,
                    [produitId, path, primary]
                );
            }
        }

        await db.query('COMMIT');
        await logAction(req.user.id, "CREATE_PRODUCT", `Produit créé : ${nom_produit}`);
        await checkAndNotifyStock(produitId, nom_produit, quantite);
        res.status(201).json({ message: "Produit créé avec succès." });

    } catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        db.release();
    }
};

exports.updateProduit = async (req, res) => {
    const { id } = req.params;
    const { nom_produit, description, prix_unitaire_ht, taux_tva, taux_fodec, taux_dc, categorie, quantite } = req.body;
    const images = req.files;

    console.log('req.body:', req.body);

    if (!nom_produit || !prix_unitaire_ht) {
        return res.status(400).json({ message: "Nom et prix sont obligatoires." });
    }

    const db = await pool.connect();
    try {
        await db.query('BEGIN');

        const result = await db.query(
            `UPDATE produit 
             SET nom_produit=$1, description=$2, prix_unitaire_ht=$3,
                 taux_tva=$4, taux_fodec=$5, taux_dc=$6, categorie=$7, quantite=$8,
                 updated_at=NOW()
             WHERE id=$9 RETURNING *`,
            [
                nom_produit,
                description || null,
                parseFloat(prix_unitaire_ht),
                parseFloat(taux_tva) || 0,
                parseFloat(taux_fodec) || 0,
                parseFloat(taux_dc) || 0,
                categorie || null,
                parseInt(quantite) || 0,  
                id
            ]
        );

        if (result.rowCount === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ message: "Produit non trouvé." });
        }

        if (images && images.length > 0) {
            for (const image of images) {
                const imagePath = `/uploads/produits/${image.filename}`;
                await db.query(
                    `INSERT INTO produit_image (id_produit, image_url, is_primary) VALUES ($1, $2, false)`,
                    [id, imagePath]
                );
            }
        }

        await db.query('COMMIT');
        await logAction(req.user.id, "UPDATE_PRODUCT", `Produit modifié ID: ${id}`);
        await checkAndNotifyStock(id, nom_produit, quantite);
        res.status(200).json({ message: "Produit mis à jour avec succès." });

    } catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        db.release();
    }
};
exports.deleteProduit = async (req, res) => {
    const { id } = req.params;
    try {
        // Check if any non-delivered orders contain this product
        const pendingOrders = await pool.query(
            `SELECT COUNT(*) 
             FROM commande_produit cp
             JOIN commande c ON c.id = cp.id_commande
             WHERE cp.id_produit = $1
             AND c.statut != 'livree'`,
            [id]
        );

        if (parseInt(pendingOrders.rows[0].count) > 0) {
            return res.status(400).json({
                message: "Impossible de supprimer ce produit : certaines commandes le contenant ne sont pas encore livrées."
            });
        }

        const result = await pool.query('DELETE FROM produit WHERE id = $1', [id]);
        if (result.rowCount === 0) return res.status(404).json({ message: "Produit non trouvé." });

        await logAction(req.user.id, "DELETE_PRODUCT", `Produit supprimé ID: ${id}`);
        res.status(200).json({ message: "Produit supprimé avec succès." });

    } catch (err) {
        res.status(500).json({ error: "Impossible de supprimer le produit (il est peut-être lié à des factures)." });
    }
};

exports.getProduitImages = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `SELECT * FROM produit_image WHERE id_produit = $1 ORDER BY is_primary DESC`,
            [id]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const checkAndNotifyStock = async (produitId, nomProduit, quantite) => {
    const qty = parseInt(quantite) || 0;
    if (qty > 5) return;

    const type    = qty === 0 ? 'STOCK_RUPTURE' : 'STOCK_FAIBLE';
    const message = qty === 0
        ? `Rupture de stock : "${nomProduit}" — plus aucune unité disponible.`
        : `Stock faible : "${nomProduit}" — seulement ${qty} unité(s) restante(s).`;

    try {
        
        const existing = await pool.query(
            `SELECT id FROM notification 
             WHERE id_produit = $1 AND type = $2 AND is_read = false`,
            [produitId, type]
        );
        if (existing.rows.length > 0) return; 

        await pool.query(
            `INSERT INTO notification (type, message, id_produit) VALUES ($1, $2, $3)`,
            [type, message, produitId]
        );
    } catch (err) {
        console.error('Notification insert failed:', err.message);
    }
};