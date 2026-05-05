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
          WHERE id_produit = pf.id
          ORDER BY is_primary DESC, id ASC
          LIMIT 1
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
          WHERE id_produit = pf.id
          ORDER BY is_primary DESC, id ASC
          LIMIT 1
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
          WHERE id_produit = pf.id
          ORDER BY is_primary DESC, id ASC
          LIMIT 1
        ) AS main_image,
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


// ─────────────────────────────────────────────
// CREATE produit_entreprise (premier import manuel uniquement)
//
// Règles :
//   1. Un produit_fournisseur ne peut être importé qu'UNE seule fois.
//      Le réapprovisionnement suivant se fait automatiquement à la
//      livraison (voir marquerLivraison).
//   2. La quantité importée ne peut pas dépasser ce qui a été livré
//      (commandes en statut 'livrée').
// ─────────────────────────────────────────────
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
      // 1. Le produit_fournisseur existe-t-il ?
      const check = await client.query(
        "SELECT id FROM produit_fournisseur WHERE id = $1", [id_produit_f]
      );
      if (!check.rows.length) {
        await client.query("ROLLBACK");
        return res.status(404).json({
          success: false,
          message: "Produit fournisseur introuvable."
        });
      }

      // 2. Empêcher la double importation
      const dup = await client.query(
        "SELECT id FROM produit_entreprise WHERE id_produit_f = $1",
        [id_produit_f]
      );
      if (dup.rows.length) {
        await client.query("ROLLBACK");
        return res.status(409).json({
          success: false,
          message: "Ce produit est déjà importé. Le réapprovisionnement est automatique à la livraison.",
          existing_id: dup.rows[0].id,
        });
      }

      // 3. Validation contre les quantités livrées
      const stockRes = await client.query(`
        SELECT COALESCE(SUM(dfa.quantite), 0) AS total_livre
        FROM detail_facture_achat dfa
        JOIN facture_achat   fa ON fa.id = dfa.id_facture_achat
        JOIN commande_achat  ca ON ca.id = fa.id_commande_achat
        WHERE dfa.id_produit_fournisseur = $1
          AND ca.statut = 'livrée'
      `, [id_produit_f]);

      const totalLivre   = parseFloat(stockRes.rows[0].total_livre) || 0;
      const qteRequested = parseInt(quantite) || 0;

      if (qteRequested > totalLivre) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: `Quantité invalide : ${totalLivre} unité(s) livrée(s). Vous ne pouvez pas en enregistrer ${qteRequested}.`,
          max_quantite: totalLivre,
        });
      }
    }

    const qte = Math.max(0, parseInt(quantite) || 0);

    const { rows } = await client.query(`
      INSERT INTO produit_entreprise
        (id_produit_f, nom_commercial, description_interne, quantite, prix_vente_ht, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `, [
      id_produit_f || null,
      nom_commercial,
      description_interne || null,
      qte,
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


// ─────────────────────────────────────────────
// UPDATE produit_entreprise
//
// L'admin peut éditer librement nom_commercial, description, prix.
// Pour la quantité : on autorise les corrections manuelles tant
// qu'elles restent >= 0 et <= total livré.
// Le restock automatique à la livraison passe par UPDATE direct
// dans marquerLivraison, ce qui ne déclenche pas cet endpoint.
// ─────────────────────────────────────────────
const updateProduitEntreprise = async (req, res) => {
  const { id } = req.params;
  const { nom_commercial, description_interne, quantite, prix_vente_ht } = req.body;

  try {
    if (quantite !== undefined && quantite !== null) {
      const qteRequested = parseInt(quantite);

      if (Number.isNaN(qteRequested) || qteRequested < 0) {
        return res.status(400).json({
          success: false,
          message: "La quantité doit être un entier positif ou zéro.",
        });
      }

      const existing = await pool.query(
        "SELECT id_produit_f FROM produit_entreprise WHERE id = $1", [id]
      );
      if (!existing.rows.length) {
        return res.status(404).json({ success: false, message: "Produit introuvable." });
      }

      const id_produit_f = existing.rows[0].id_produit_f;

      if (id_produit_f) {
        const stockRes = await pool.query(`
          SELECT COALESCE(SUM(dfa.quantite), 0) AS total_livre
          FROM detail_facture_achat dfa
          JOIN facture_achat   fa ON fa.id = dfa.id_facture_achat
          JOIN commande_achat  ca ON ca.id = fa.id_commande_achat
          WHERE dfa.id_produit_fournisseur = $1
            AND ca.statut = 'livrée'
        `, [id_produit_f]);

        const totalLivre = parseFloat(stockRes.rows[0].total_livre) || 0;

        if (qteRequested > totalLivre) {
          return res.status(400).json({
            success: false,
            message: `Quantité invalide : ${totalLivre} unité(s) livrée(s) au total. Vous ne pouvez pas en enregistrer ${qteRequested}.`,
            max_quantite: totalLivre,
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
    `, [
      nom_commercial,
      description_interne,
      quantite !== undefined && quantite !== null ? parseInt(quantite) : null,
      prix_vente_ht !== undefined && prix_vente_ht !== null ? parseFloat(prix_vente_ht) : null,
      id,
    ]);

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


// ─────────────────────────────────────────────
// GET MAX QUANTITE pour le frontend
//
// Retourne le total livré pour ce produit_fournisseur
// (commandes en statut 'livrée'). Utilisé par l'UI pour
// limiter la saisie lors de l'import manuel.
// ─────────────────────────────────────────────
const getMaxQuantite = async (req, res) => {
  const { id_produit_f } = req.params;
  try {
    const { rows } = await pool.query(`
      SELECT COALESCE(SUM(dfa.quantite), 0) AS total_livre
      FROM detail_facture_achat dfa
      JOIN facture_achat   fa ON fa.id = dfa.id_facture_achat
      JOIN commande_achat  ca ON ca.id = fa.id_commande_achat
      WHERE dfa.id_produit_fournisseur = $1
        AND ca.statut = 'livrée'
    `, [id_produit_f]);

    res.json({
      success: true,
      max_quantite: parseFloat(rows[0].total_livre) || 0,
    });
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