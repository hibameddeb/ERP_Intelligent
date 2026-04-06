const pool = require('../config/db');

const logAction = async (userId, action, description) => {
    try {
        await pool.query(
            'INSERT INTO log_activite (id_utilisateur, action, date_heure, description) VALUES ($1, $2, NOW(), $3)',
            [userId, action, description]
        );
    } catch (err) {
        console.error("Erreur log_activite:", err.message);
    }
};

module.exports = { logAction };