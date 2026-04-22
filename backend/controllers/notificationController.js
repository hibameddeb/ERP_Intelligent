const pool = require('../config/db');

// ── Icons / labels per type ───────────────────────────────────────────────────
const TYPE_CONFIG = {
  COMMANDE_ACCEPTEE:  { label: 'Commande acceptée',   color: 'success' },
  COMMANDE_REFUSEE:   { label: 'Commande refusée',    color: 'danger'  },
  COMMANDE_NON_LIVREE:{ label: 'Non livrée',          color: 'danger'  },
  FACTURE_CREEE:      { label: 'Nouvelle facture',     color: 'info'    },
  STOCK_FAIBLE:       { label: 'Stock faible',         color: 'warning' },
  STOCK_RUPTURE:      { label: 'Rupture de stock',     color: 'danger'  },
};

// ── GET ALL ───────────────────────────────────────────────────────────────────
exports.getNotifications = async (req, res) => {
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
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
  }
};

// ── MARK ALL AS READ ──────────────────────────────────────────────────────────
exports.markAllAsRead = async (req, res) => {
  try {
    await pool.query(`UPDATE notification SET is_read = true`);
    res.status(200).json({ message: "Toutes marquées comme lues." });
  } catch (err) {
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
    res.status(500).json({ error: err.message });
  }
};