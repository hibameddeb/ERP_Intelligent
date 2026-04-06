const pool = require('../config/db');
const { logAction } = require('../utils/logs');

// 1. Récupérer tous les produits
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

// Extrait de produitController.js
exports.createProduit = async (req, res) => {
    const { nom_produit, description, prix_unitaire_ht, taux_tva, taux_fodec, taux_dc } = req.body;
    const images = req.files; // Supposons que tu utilises Multer pour l'upload

    const db = await pool.connect();
    try {
        await db.query('BEGIN'); // On démarre la transaction

        // 1. On insère le produit
        const produitRes = await db.query(
            `INSERT INTO produit (nom_produit, description, prix_unitaire_ht, taux_tva, taux_fodec, taux_dc) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [nom_produit, description, prix_unitaire_ht, taux_tva, taux_fodec, taux_dc]
        );
        const produitId = produitRes.rows[0].id;

        // 2. On insère chaque image dans la nouvelle table produit_image
        if (images && images.length > 0) {
            for (let i = 0; i < images.length; i++) {
                const path = `/uploads/produits/${images[i].filename}`;
                const primary = (i === 0); // La première image devient l'image principale par défaut
                
                await db.query(
                    `INSERT INTO produit_image (id_produit, image_url, is_primary) VALUES ($1, $2, $3)`,
                    [produitId, path, primary]
                );
            }
        }

        await db.query('COMMIT'); // On valide tout
        res.status(201).json({ message: "Produit et images créés !" });

    } catch (err) {
        await db.query('ROLLBACK'); // En cas d'erreur, on annule TOUT (pas de produit sans images ou vice-versa)
        res.status(500).json({ error: err.message });
    } finally {
        db.release();
    }
};

exports.updateProduit = async (req, res) => {
    const { id } = req.params;
    const { nom_produit, description, prix_unitaire_ht, taux_tva, taux_fodec, taux_dc } = req.body;
    const images = req.files;

    const db = await pool.connect();
    try {
        await db.query('BEGIN');

        // 1. Mettre à jour les infos du produit
        const result = await db.query(
            `UPDATE produit SET nom_produit=$1, description=$2, prix_unitaire_ht=$3, 
             taux_tva=$4, taux_fodec=$5, taux_dc=$6 WHERE id=$7 RETURNING *`,
            [nom_produit, description, prix_unitaire_ht, taux_tva, taux_fodec, taux_dc, id]
        );

        if (result.rowCount === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ message: "Produit non trouvé." });
        }

        // 2. Insérer les nouvelles images — toujours is_primary = false
        if (images && images.length > 0) {
            for (const image of images) {
                const imagePath = `/uploads/produits/${image.filename}`;
                await db.query(
                    `INSERT INTO produit_image (id_produit, image_url, is_primary) 
                     VALUES ($1, $2, false)`,  // ← toujours false, la principale reste intacte
                    [id, imagePath]
                );
            }
        }

        await db.query('COMMIT');
        await logAction(req.user.id, "UPDATE_PRODUCT", `Produit modifié ID: ${id}`);
        res.status(200).json({ message: "Produit mis à jour avec succès." });

    } catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        db.release();
    }
};

// 4. Supprimer un produit
exports.deleteProduit = async (req, res) => {
    const { id } = req.params;
    try {
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