const pool = require("../config/db");


const getAllProduitsEntreprise = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        pe.*,
        pf.nom_produit_f        AS fournisseur_nom_produit,
        pf.prix_unitaire_ht     AS fournisseur_prix_ht,
        pf.taux_tva,
        pf.taux_fodec,
        pf.taux_dc,
        f.nom_societe           AS fournisseur_societe,
        (
          SELECT image_url FROM produit_image
          WHERE id_produit = pf.id AND is_primary = true LIMIT 1
        ) AS main_image
      FROM produit_entreprise pe
      LEFT JOIN produit_fournisseur pf ON pf.id = pe.id_produit_f
      LEFT JOIN fournisseur f ON f.id_utilisateur = pf.id_fournisseur
      ORDER BY pe.id DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("[getAllProduitsEntreprise]", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


const getProduitEntrepriseById = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(`
      SELECT
        pe.*,
        pf.nom_produit_f, pf.prix_unitaire_ht AS fournisseur_prix_ht,
        pf.taux_tva, pf.taux_fodec, pf.taux_dc,
        f.nom_societe AS fournisseur_societe,
        (
          SELECT image_url FROM produit_image
          WHERE id_produit = pf.id AND is_primary = true LIMIT 1
        ) AS main_image
      FROM produit_entreprise pe
      LEFT JOIN produit_fournisseur pf ON pf.id = pe.id_produit_f
      LEFT JOIN fournisseur f ON f.id_utilisateur = pf.id_fournisseur
      WHERE pe.id = $1
    `, [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: "Produit introuvable." });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


const getProduitsFromFacture = async (req, res) => {
  const { id_facture } = req.params;
  try {
    const { rows } = await pool.query(`
      SELECT
        dfa.id                  AS detail_id,
        dfa.id_facture_achat,
        dfa.id_produit_fournisseur,
        dfa.quantite,
        dfa.prix_unitaire_ht,
        pf.nom_produit_f,
        pf.description_f,
        pf.taux_tva,
        pf.taux_fodec,
        pf.taux_dc,
        f.nom_societe           AS fournisseur_societe,
        (
          SELECT image_url FROM produit_image
          WHERE id_produit = pf.id AND is_primary = true LIMIT 1
        ) AS main_image,
        -- flag: already imported?
        EXISTS (
          SELECT 1 FROM produit_entreprise pe
          WHERE pe.id_produit_f = dfa.id_produit_fournisseur
        ) AS already_imported
      FROM detail_facture_achat dfa
      JOIN produit_fournisseur pf ON pf.id = dfa.id_produit_fournisseur
      LEFT JOIN fournisseur f ON f.id_utilisateur = pf.id_fournisseur
      WHERE dfa.id_facture_achat = $1
      ORDER BY dfa.id
    `, [id_facture]);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("[getProduitsFromFacture]", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const getFacturesAchat = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        fa.id, fa.num_facture, fa.date_creation, fa.statut, fa.total_ttc,
        f.nom_societe AS fournisseur_societe
      FROM facture_achat fa
      LEFT JOIN fournisseur f ON f.id_utilisateur = fa.id_fournisseur
      ORDER BY fa.date_creation DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


const createProduitEntreprise = async (req, res) => {
  const {
    id_produit_f,
    nom_commercial,
    description_interne,
    quantite,
    prix_vente_ht,
  } = req.body;

  if (!nom_commercial || prix_vente_ht === undefined || prix_vente_ht === null) {
    return res.status(400).json({
      success: false,
      message: "Champs obligatoires : nom_commercial, prix_vente_ht",
    });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (id_produit_f) {
      const check = await client.query(
        "SELECT id FROM produit_fournisseur WHERE id = $1", [id_produit_f]
      );
      if (!check.rows.length) {
        await client.query("ROLLBACK");
        return res.status(404).json({ success: false, message: "Produit fournisseur introuvable." });
      }

      // ── Stock validation: cannot exceed total invoiced quantity ──
      const stockRes = await client.query(`
        SELECT COALESCE(SUM(dfa.quantite), 0) AS total_facture
        FROM detail_facture_achat dfa
        WHERE dfa.id_produit_fournisseur = $1
      `, [id_produit_f]);

      const totalFacture = parseFloat(stockRes.rows[0].total_facture);
      const qteRequested = parseInt(quantite) || 0;

      if (qteRequested > totalFacture) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: `Quantité invalide : vous avez reçu ${totalFacture} unité(s) en facture. Vous ne pouvez pas en enregistrer ${qteRequested}.`,
          max_quantite: totalFacture,
        });
      }
    }

    const { rows } = await client.query(`
      INSERT INTO produit_entreprise
        (id_produit_f, nom_commercial, description_interne, quantite, prix_vente_ht, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `, [
      id_produit_f || null,
      nom_commercial,
      description_interne || null,
      parseInt(quantite) || 0,
      parseFloat(prix_vente_ht),
    ]);

    await client.query("COMMIT");
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[createProduitEntreprise]", err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
};

const updateProduitEntreprise = async (req, res) => {
  const { id } = req.params;
  const { nom_commercial, description_interne, quantite, prix_vente_ht } = req.body;

  try {
    // ── Stock validation on update ──
    if (quantite !== undefined && quantite !== null) {
      const existing = await pool.query(
        "SELECT id_produit_f FROM produit_entreprise WHERE id = $1", [id]
      );
      if (!existing.rows.length) {
        return res.status(404).json({ success: false, message: "Produit introuvable." });
      }

      const id_produit_f = existing.rows[0].id_produit_f;

      if (id_produit_f) {
        const stockRes = await pool.query(`
          SELECT COALESCE(SUM(dfa.quantite), 0) AS total_facture
          FROM detail_facture_achat dfa
          WHERE dfa.id_produit_fournisseur = $1
        `, [id_produit_f]);

        const totalFacture = parseFloat(stockRes.rows[0].total_facture);
        const qteRequested = parseInt(quantite);

        if (qteRequested > totalFacture) {
          return res.status(400).json({
            success: false,
            message: `Quantité invalide : vous avez reçu ${totalFacture} unité(s) en facture. Vous ne pouvez pas en enregistrer ${qteRequested}.`,
            max_quantite: totalFacture,
          });
        }
      }
    }

    const { rows } = await pool.query(`
      UPDATE produit_entreprise SET
        nom_commercial      = COALESCE($1, nom_commercial),
        description_interne = COALESCE($2, description_interne),
        quantite            = COALESCE($3, quantite),
        prix_vente_ht       = COALESCE($4, prix_vente_ht),
        updated_at          = NOW()
      WHERE id = $5
      RETURNING *
    `, [nom_commercial, description_interne, quantite ? parseInt(quantite) : null,
        prix_vente_ht ? parseFloat(prix_vente_ht) : null, id]);

    if (!rows.length) return res.status(404).json({ success: false, message: "Produit introuvable." });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("[updateProduitEntreprise]", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


const deleteProduitEntreprise = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM produit_entreprise WHERE id = $1 RETURNING id", [id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: "Produit introuvable." });
    res.json({ success: true });
  } catch (err) {
    console.error("[deleteProduitEntreprise]", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET MAX STOCK for a produit_fournisseur (sum of all invoiced quantities) ──
const getMaxQuantite = async (req, res) => {
  const { id_produit_f } = req.params;
  try {
    const { rows } = await pool.query(`
      SELECT COALESCE(SUM(quantite), 0) AS total_facture
      FROM detail_facture_achat
      WHERE id_produit_fournisseur = $1
    `, [id_produit_f]);
    res.json({ success: true, max_quantite: parseFloat(rows[0].total_facture) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllProduitsEntreprise,
  getProduitEntrepriseById,
  getProduitsFromFacture,
  getFacturesAchat,
  createProduitEntreprise,
  updateProduitEntreprise,
  deleteProduitEntreprise,
  getMaxQuantite,
};