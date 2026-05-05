const pool = require('../config/db');

// ── GET ALL ───────────────────────────────────────────────────────────────────
exports.getNotifications = async (req, res) => {
  // Étape 1 : on tente la requête complète
  try {
    const result = await pool.query(`
      SELECT
        n.*,
        p.nom_produit,
        p.quantite                          AS produit_quantite,
        ca.num_ordre                        AS commande_num_ordre,
        ca.statut                           AS commande_statut,
        fa.num_facture
      FROM notification n
      LEFT JOIN produit        p  ON p.id  = n.id_produit
      LEFT JOIN commande_achat ca ON ca.id = n.id_commande_achat
      LEFT JOIN facture_achat  fa ON fa.id = n.id_facture_achat
      ORDER BY n.created_at DESC
      LIMIT 80
    `);
    return res.status(200).json(result.rows);
  } catch (err) {
    // ⚠️  On log l'erreur exacte pour diagnostic
    console.error('[NOTIF] Full query failed:', err.message);
    console.error('[NOTIF] Detail:', err.detail || '(no detail)');
    console.error('[NOTIF] Hint:',   err.hint   || '(no hint)');
  }

  // Étape 2 : fallback sans jointures (au cas où une table/colonne manque)
  try {
    console.warn('[NOTIF] Falling back to plain query (no joins)');
    const result = await pool.query(`
      SELECT * FROM notification
      ORDER BY created_at DESC
      LIMIT 80
    `);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('[NOTIF] Plain query also failed:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

// ── GET UNREAD COUNT ──────────────────────────────────────────────────────────
exports.getUnreadCount = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) FROM notification WHERE is_read = false`
    );
    res.status(200).json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error('[NOTIF] getUnreadCount failed:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ── MARK ONE AS READ ──────────────────────────────────────────────────────────
exports.markAsRead = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`UPDATE notification SET is_read = true WHERE id = $1`, [id]);
    res.status(200).json({ message: "Marquée comme lue." });
  } catch (err) {
    console.error('[NOTIF] markAsRead failed:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ── MARK ALL AS READ ──────────────────────────────────────────────────────────
exports.markAllAsRead = async (req, res) => {
  try {
    await pool.query(`UPDATE notification SET is_read = true`);
    res.status(200).json({ message: "Toutes marquées comme lues." });
  } catch (err) {
    console.error('[NOTIF] markAllAsRead failed:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ── DELETE ────────────────────────────────────────────────────────────────────
exports.deleteNotification = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`DELETE FROM notification WHERE id = $1`, [id]);
    res.status(200).json({ message: "Supprimée." });
  } catch (err) {
    console.error('[NOTIF] deleteNotification failed:', err.message);
    res.status(500).json({ error: err.message });
  }
};