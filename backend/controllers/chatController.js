const pool = require("../config/db");

exports.sendMessage = async (req, res) => {
  const { id_destinataire, contenu } = req.body;
  const id_expediteur = req.user.id;

  try {
    const query = `
      INSERT INTO message_chat (id_expediteur, id_destinataire, contenu)
      VALUES ($1, $2, $3) RETURNING *`;
    const result = await pool.query(query, [id_expediteur, id_destinataire, contenu]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("sendMessage error:", err);
    res.status(500).json({ error: "Erreur d'envoi du message" });
  }
};

exports.getConversation = async (req, res) => {
  const { contactId } = req.params;
  const userId = req.user.id;

  try {
    const query = `
      SELECT * FROM message_chat
      WHERE (id_expediteur = $1 AND id_destinataire = $2)
         OR (id_expediteur = $2 AND id_destinataire = $1)
      ORDER BY date_envoi ASC`;
    const result = await pool.query(query, [userId, contactId]);
    res.json(result.rows);
  } catch (err) {
    console.error("getConversation error:", err);
    res.status(500).json({ error: "Erreur récupération messages" });
  }
};
exports.getAdminContact = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nom, prenom, email
       FROM utilisateur
       WHERE role = 'ADMIN'
       LIMIT 1`
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Aucun administrateur trouvé" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("getAdminContact error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.getAdmins = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nom, prenom, email
       FROM utilisateur
       WHERE role = 'ADMIN'
       ORDER BY prenom ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getAdmins error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};