const pool = require('../config/db');

// ── Configuration des rôles ──────────────────────────────────────────────────
const ROLE_CLIENT     = 'CLIENT';
const ROLE_COMMERCIAL = 'COMMERCIAL';

// ─────────────────────────────────────────────────────────────────────────────
// Helper : récupère { id, role } du user authentifié, en tolérant les
// différentes clés possibles selon comment ton middleware d'auth signe le JWT.
// Renvoie { id: number|null, role: string (UPPERCASE)|'' }
// ─────────────────────────────────────────────────────────────────────────────
function getMe(req) {
  const u = req.user || {};
  const rawId   = u.id ?? u.userId ?? u.user_id ?? null;
  const rawRole = u.role ?? u.userRole ?? u.user_role ?? '';
  return {
    id: rawId == null ? null : parseInt(rawId, 10),
    role: String(rawRole).trim().toUpperCase(), // ← case-insensitive
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper : vérifie qu'un user a le droit de chatter avec un autre.
// COMMERCIAL ↔ ses clients ; CLIENT ↔ son commercial ; ADMIN libre.
// ─────────────────────────────────────────────────────────────────────────────
async function isConversationAllowed(me, otherId) {
  if (me.role === 'ADMIN') return true;

  if (me.role === ROLE_COMMERCIAL) {
    const r = await pool.query(
      `SELECT 1 FROM client WHERE id_utilisateur = $1 AND id_commercial = $2`,
      [otherId, me.id]
    );
    return r.rowCount > 0;
  }

  if (me.role === ROLE_CLIENT) {
    const r = await pool.query(
      `SELECT 1 FROM client WHERE id_utilisateur = $1 AND id_commercial = $2`,
      [me.id, otherId]
    );
    return r.rowCount > 0;
  }

  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /messages/contacts
// ─────────────────────────────────────────────────────────────────────────────
exports.getContacts = async (req, res) => {
  const me = getMe(req);
  console.log('[CHAT] getContacts - me:', me); // ← DEBUG, retire-le quand tout marche

  if (!me.id) {
    return res.status(401).json({ message: 'Non authentifié.' });
  }

  try {
    let contactsQuery, params;

    if (me.role === ROLE_COMMERCIAL) {
      contactsQuery = `
        SELECT u.id, u.nom, u.prenom, u.email, u.avatar, u.role
        FROM client c
        JOIN utilisateur u ON u.id = c.id_utilisateur
        WHERE c.id_commercial = $1
          AND UPPER(u.role) = $2
        ORDER BY u.prenom, u.nom
      `;
      params = [me.id, ROLE_CLIENT];
    } else if (me.role === ROLE_CLIENT) {
      contactsQuery = `
        SELECT u.id, u.nom, u.prenom, u.email, u.avatar, u.role
        FROM client c
        JOIN utilisateur u ON u.id = c.id_commercial
        WHERE c.id_utilisateur = $1
          AND UPPER(u.role) = $2
      `;
      params = [me.id, ROLE_COMMERCIAL];
    } else {
      console.warn(`[CHAT] Role non reconnu: "${me.role}" (id=${me.id})`);
      return res.status(403).json({
        message: 'Accès non autorisé.',
        debug: { role: me.role, id: me.id }, // ← retire-le quand tout marche
      });
    }

    const contactsResult = await pool.query(contactsQuery, params);
    const contacts = contactsResult.rows;

    if (contacts.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Pour chaque contact, on récupère son dernier message + le compteur non-lus.
    // On filtre toujours sur les 2 rôles pour rester strict sur le périmètre.
    const enriched = await Promise.all(contacts.map(async (c) => {
      const lastMsgRes = await pool.query(`
        SELECT contenu, date_envoi
        FROM message_chat
        WHERE ((id_expediteur = $1 AND id_destinataire = $2)
            OR (id_expediteur = $2 AND id_destinataire = $1))
        ORDER BY date_envoi DESC
        LIMIT 1
      `, [me.id, c.id]);

      const unreadRes = await pool.query(`
        SELECT COUNT(*) FROM message_chat
        WHERE id_expediteur = $1
          AND id_destinataire = $2
          AND lu = false
      `, [c.id, me.id]);

      return {
        ...c,
        last_message: lastMsgRes.rows[0]?.contenu || null,
        last_message_date: lastMsgRes.rows[0]?.date_envoi || null,
        unread_count: parseInt(unreadRes.rows[0].count) || 0,
      };
    }));

    // Tri par dernier message DESC (les plus récents en haut)
    enriched.sort((a, b) => {
      const da = a.last_message_date ? new Date(a.last_message_date).getTime() : 0;
      const db = b.last_message_date ? new Date(b.last_message_date).getTime() : 0;
      return db - da;
    });

    res.json({ success: true, data: enriched });
  } catch (err) {
    console.error('[CHAT] getContacts:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /messages/conversation/:userId
// ─────────────────────────────────────────────────────────────────────────────
exports.getConversation = async (req, res) => {
  const me = getMe(req);
  const otherId = parseInt(req.params.userId, 10);

  if (!me.id) return res.status(401).json({ message: 'Non authentifié.' });
  if (!otherId) return res.status(400).json({ message: 'userId invalide.' });

  const allowed = await isConversationAllowed(me, otherId);
  if (!allowed) return res.status(403).json({ message: 'Conversation non autorisée.' });

  try {
    const result = await pool.query(`
      SELECT m.*, u.nom, u.prenom, u.avatar
      FROM message_chat m
      JOIN utilisateur u ON u.id = m.id_expediteur
      WHERE (m.id_expediteur = $1 AND m.id_destinataire = $2)
         OR (m.id_expediteur = $2 AND m.id_destinataire = $1)
      ORDER BY m.date_envoi ASC
    `, [me.id, otherId]);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('[CHAT] getConversation:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /messages
// ─────────────────────────────────────────────────────────────────────────────
exports.sendMessage = async (req, res) => {
  const me = getMe(req);
  const { id_destinataire, contenu } = req.body;

  if (!me.id) return res.status(401).json({ message: 'Non authentifié.' });
  if (!id_destinataire || !contenu || !contenu.trim()) {
    return res.status(400).json({ message: 'id_destinataire et contenu sont requis.' });
  }
  if (parseInt(id_destinataire) === me.id) {
    return res.status(400).json({ message: 'Impossible de s\'envoyer un message à soi-même.' });
  }

  const allowed = await isConversationAllowed(me, parseInt(id_destinataire));
  if (!allowed) return res.status(403).json({ message: 'Conversation non autorisée.' });

  try {
    const insertResult = await pool.query(`
      INSERT INTO message_chat (id_expediteur, id_destinataire, contenu, lu, date_envoi)
      VALUES ($1, $2, $3, false, NOW())
      RETURNING *
    `, [me.id, id_destinataire, contenu.trim()]);

    const message = insertResult.rows[0];

    const senderResult = await pool.query(
      `SELECT nom, prenom, avatar FROM utilisateur WHERE id = $1`,
      [me.id]
    );
    const enriched = { ...message, ...senderResult.rows[0] };

    // Émission Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${me.id}`).emit('message:new', enriched);
      io.to(`user:${id_destinataire}`).emit('message:new', enriched);
    }

    res.json({ success: true, data: enriched });
  } catch (err) {
    console.error('[CHAT] sendMessage:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /messages/:userId/read
// ─────────────────────────────────────────────────────────────────────────────
exports.markAsRead = async (req, res) => {
  const me = getMe(req);
  const otherId = parseInt(req.params.userId, 10);

  if (!me.id) return res.status(401).json({ message: 'Non authentifié.' });
  if (!otherId) return res.status(400).json({ message: 'userId invalide.' });

  try {
    await pool.query(`
      UPDATE message_chat
      SET lu = true
      WHERE id_expediteur = $1 AND id_destinataire = $2 AND lu = false
    `, [otherId, me.id]);

    res.json({ success: true });
  } catch (err) {
    console.error('[CHAT] markAsRead:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /messages/unread/count
// ─────────────────────────────────────────────────────────────────────────────
exports.getUnreadCount = async (req, res) => {
  const me = getMe(req);
  if (!me.id) return res.status(401).json({ message: 'Non authentifié.' });

  try {
    const result = await pool.query(
      `SELECT COUNT(*) FROM message_chat WHERE id_destinataire = $1 AND lu = false`,
      [me.id]
    );
    res.json({ success: true, count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error('[CHAT] getUnreadCount:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};