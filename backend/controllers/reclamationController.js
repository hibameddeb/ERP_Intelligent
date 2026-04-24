const pool = require("../config/db");

exports.createReclamation = async (req, res) => {
  const { id_commande, sujet, description, type_litige, priorite, id_destinataire } = req.body;
  const id_emetteur = req.user.id;

  try {
    const query = `
      INSERT INTO reclamation (id_commande, id_emetteur, id_destinataire, sujet, description, type_litige, priorite)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
    const values = [id_commande, id_emetteur, id_destinataire, sujet, description, type_litige, priorite];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("createReclamation error:", err);
    res.status(500).json({ error: "Erreur lors de la création de la réclamation" });
  }
};

// Admin: see all reclamations
exports.getReclamationsByAdmin = async (req, res) => {
  try {
    const query = `
      SELECT r.*, u.nom, u.prenom, f.nom_societe
      FROM reclamation r
      JOIN utilisateur u ON r.id_emetteur = u.id
      LEFT JOIN fournisseur f ON u.id = f.id_utilisateur
      ORDER BY r.created_at DESC`;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("getReclamationsByAdmin error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Fournisseur: see only their own reclamations
exports.getMesReclamations = async (req, res) => {
  const id_emetteur = req.user.id;
  try {
    const query = `
      SELECT r.*
      FROM reclamation r
      WHERE r.id_emetteur = $1
      ORDER BY r.created_at DESC`;
    const result = await pool.query(query, [id_emetteur]);
    res.json(result.rows);
  } catch (err) {
    console.error("getMesReclamations error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Update a reclamation (emitter only)
exports.updateReclamation = async (req, res) => {
  const { id } = req.params;
  const { sujet, description, type_litige, priorite, id_commande } = req.body;
  const userId = req.user.id;
  try {
    const query = `
      UPDATE reclamation
      SET sujet=$1, description=$2, type_litige=$3, priorite=$4, id_commande=$5
      WHERE id=$6 AND id_emetteur=$7
      RETURNING *`;
    const result = await pool.query(query, [sujet, description, type_litige, priorite, id_commande || null, id, userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Déclaration introuvable ou non autorisé" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("updateReclamation error:", err);
    res.status(500).json({ error: "Erreur lors de la mise à jour" });
  }
};