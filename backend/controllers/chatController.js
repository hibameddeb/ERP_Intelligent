const pool = require("../config/db");

// ── Périmètre de ce contrôleur : chat support ADMIN ↔ FOURNISSEUR ────────────
const SUPPORT_ROLES = ['ADMIN', 'FOURNISSEUR'];

exports.sendMessage = async (req, res) => {
  const { id_destinataire, contenu } = req.body;
  const id_expediteur = req.user.id;

  if (!id_destinataire || !contenu) {
    return res.status(400).json({ error: "Destinataire et contenu requis" });
  }

  try {
    // Vérifier que les deux participants ont des rôles autorisés pour le support
    const check = await pool.query(
      `SELECT
         (SELECT role FROM utilisateur WHERE id = $1) AS role_expediteur,
         (SELECT role FROM utilisateur WHERE id = $2) AS role_destinataire`,
      [id_expediteur, id_destinataire]
    );
    const { role_expediteur, role_destinataire } = check.rows[0] || {};
    if (
      !SUPPORT_ROLES.includes(role_expediteur) ||
      !SUPPORT_ROLES.includes(role_destinataire)
    ) {
      return res.status(403).json({ error: "Conversation non autorisée pour le support" });
    }

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
    // Filtre : on ne récupère que les messages où les DEUX participants
    // sont ADMIN ou FOURNISSEUR (sinon ils appartiennent au système client/commercial)
    const query = `
      SELECT m.*
      FROM message_chat m
      JOIN utilisateur ue ON ue.id = m.id_expediteur
      JOIN utilisateur ud ON ud.id = m.id_destinataire
      WHERE
        ((m.id_expediteur = $1 AND m.id_destinataire = $2)
         OR (m.id_expediteur = $2 AND m.id_destinataire = $1))
        AND ue.role = ANY($3::varchar[])
        AND ud.role = ANY($3::varchar[])
      ORDER BY m.date_envoi ASC`;
    const result = await pool.query(query, [userId, contactId, SUPPORT_ROLES]);
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