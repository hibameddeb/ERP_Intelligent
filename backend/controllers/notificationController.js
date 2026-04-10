const pool = require('../config/db');

// Get all notifications (admin only)
exports.getNotifications = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT n.*, 
                   p.nom_produit, 
                   p.quantite
            FROM notification n
            LEFT JOIN produit p ON p.id = n.id_produit
            ORDER BY n.created_at DESC
            LIMIT 50
        `);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get unread count
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

// Mark one as read
exports.markAsRead = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query(`UPDATE notification SET is_read = true WHERE id = $1`, [id]);
        res.status(200).json({ message: "Marquée comme lue." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Mark all as read
exports.markAllAsRead = async (req, res) => {
    try {
        await pool.query(`UPDATE notification SET is_read = true`);
        res.status(200).json({ message: "Toutes marquées comme lues." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query(`DELETE FROM notification WHERE id = $1`, [id]);
        res.status(200).json({ message: "Supprimée." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};