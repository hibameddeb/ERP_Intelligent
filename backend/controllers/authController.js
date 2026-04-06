const pool = require('../config/db');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const { logAction } = require('../utils/logs');

// ─── HELPER : créer le transporteur email ────────────────────────────────────
const createTransporter = () => nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    tls: { rejectUnauthorized: false }
});

// ─── ACTIVATION DU COMPTE ─────────────────────────────────────────────────────
exports.activateUser = async (req, res) => {
    const { nom, prenom, email } = req.body;

    try {
        const userResult = await pool.query(
            'SELECT * FROM utilisateur WHERE email = $1 AND nom = $2 AND prenom = $3',
            [email, nom, prenom]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                message: "Les informations saisies ne correspondent à aucun compte pré-enregistré."
            });
        }

        const user = userResult.rows[0];

        if (user.password_hash && user.est_actif === true) {
            return res.status(400).json({ message: "Ce compte est déjà activé." });
        }

        const tempPassword = Math.random().toString(36).slice(-8);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(tempPassword, salt);

        await pool.query(
            'UPDATE utilisateur SET password_hash = $1, est_actif = true WHERE id = $2',
            [hashedPassword, user.id]
        );

        await createTransporter().sendMail({
            from: '"ERP Intelligente"',
            to: email,
            subject: 'Activation de votre accès ERP',
            text: `Bonjour ${prenom},\n\nVotre compte (Rôle: ${user.role}) a été activé avec succès.\n\nVoici votre mot de passe temporaire : ${tempPassword}\n\nCordialement.`
        });

        res.status(200).json({ message: "Succès ! Le mot de passe a été envoyé à votre email." });

    } catch (err) {
        console.error("❌ activateUser error:", err.message);
        res.status(500).json({ error: "Erreur serveur lors de l'activation.", detail: err.message });
    }
};

// ─── LOGIN (ÉTAPE 1 : IDENTIFIANTS + CHECK ACTIVITÉ) ─────────────────────────
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM utilisateur WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ message: "Identifiants incorrects." });
        }

        const user = result.rows[0];

        if (user.est_actif === false) {
            return res.status(403).json({
                message: "Votre compte est désactivé. Veuillez contacter l'administrateur."
            });
        }

        if (!user.password_hash) {
            return res.status(400).json({
                message: "Compte non activé. Veuillez utiliser la section activation."
            });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ message: "Identifiants incorrects." });

        // Génération du code 2FA
        const code2FA = Math.floor(100000 + Math.random() * 900000).toString();
        const expiration = new Date(Date.now() + 10 * 60000);

        await pool.query(
            'UPDATE utilisateur SET "code2FA" = $1, "expire2FA" = $2 WHERE id = $3',
            [code2FA, expiration, user.id]
        );

        await createTransporter().sendMail({
            from: '"Sécurité ERP"',
            to: user.email,
            subject: 'Votre code de vérification 2FA',
            text: `Votre code de sécurité est : ${code2FA}`
        });

        res.status(200).json({ message: "Code 2FA envoyé.", email: user.email });

    } catch (err) {
        console.error("❌ login error:", err.message);
        res.status(500).json({ error: "Erreur lors du login.", detail: err.message });
    }
};

// ─── VERIFY 2FA (ÉTAPE 2 : VALIDATION + JWT) ──────────────────────────────────
exports.verify2FA = async (req, res) => {
    const { email, code } = req.body;

    try {
        const result = await pool.query(
            'SELECT * FROM utilisateur WHERE email = $1 AND "code2FA" = $2',
            [email, code]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: "Code invalide." });
        }

        const user = result.rows[0];

        if (user.est_actif === false) {
            return res.status(403).json({ message: "Compte désactivé." });
        }

        if (new Date() > user.expire2FA) {
            return res.status(401).json({ message: "Code expiré." });
        }

        await pool.query(
            'UPDATE utilisateur SET "code2FA" = NULL, "expire2FA" = NULL, "derniere_connexion" = NOW() WHERE id = $1',
            [user.id]
        );

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'ma_cle_secrete_erp_2026',
            { expiresIn: '2h' }
        );

        res.status(200).json({
            message: "Connexion réussie !",
            token,
            user: {
                id: user.id,
                role: user.role,
                prenom: user.prenom,
                nom: user.nom,
                email: user.email,
                num_tlp: user.num_tlp,
                avatar: user.avatar
            }
        });

        await logAction(user.id, "CONNEXION", "Utilisateur connecté via 2FA.");

    } catch (err) {
        console.error("❌ verify2FA error:", err.message);
        res.status(500).json({ error: "Erreur lors de la vérification 2FA.", detail: err.message });
    }
};

// ─── MOT DE PASSE OUBLIÉ ──────────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const result = await pool.query('SELECT * FROM utilisateur WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        const user = result.rows[0];
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiration = new Date(Date.now() + 15 * 60000);

        await pool.query(
            'UPDATE utilisateur SET "code2FA" = $1, "expire2FA" = $2 WHERE id = $3',
            [resetCode, expiration, user.id]
        );

        await createTransporter().sendMail({
            from: '"Sécurité ERP"',
            to: email,
            subject: 'Réinitialisation de mot de passe',
            text: `Votre code de récupération est : ${resetCode}`
        });

        res.status(200).json({ message: "Code envoyé par email." });

    } catch (err) {
        console.error("❌ forgotPassword error:", err.message);
        res.status(500).json({ error: "Erreur lors de l'envoi du code.", detail: err.message });
    }
};

// ─── RESET MOT DE PASSE ───────────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
    const { email, code, newPassword } = req.body;

    try {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ message: "Mot de passe trop faible." });
        }

        const result = await pool.query(
            'SELECT * FROM utilisateur WHERE email = $1 AND "code2FA" = $2',
            [email, code]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: "Code incorrect." });
        }

        const user = result.rows[0];

        if (new Date() > user.expire2FA) {
            return res.status(401).json({ message: "Code expiré." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query(
            'UPDATE utilisateur SET password_hash = $1, "code2FA" = NULL, "expire2FA" = NULL WHERE id = $2',
            [hashedPassword, user.id]
        );

        res.status(200).json({ message: "Mot de passe modifié !" });
        await logAction(user.id, "RESET_PASSWORD", "Réinitialisation réussie.");

    } catch (err) {
        console.error("❌ resetPassword error:", err.message);
        res.status(500).json({ error: "Erreur lors de la réinitialisation.", detail: err.message });
    }
};

// ─── MISE À JOUR PROFIL ───────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { nom, prenom, num_tlp, adresse, ville, rue, activite } = req.body;

    try {
        if (!nom?.trim() || !prenom?.trim()) {
            return res.status(400).json({ error: "Nom et prénom sont obligatoires." });
        }

        await pool.query(
            'UPDATE utilisateur SET nom = $1, prenom = $2, num_tlp = $3 WHERE id = $4',
            [nom.trim(), prenom.trim(), num_tlp || null, userId]
        );

        if (req.user.role === 'CLIENT') {
            await pool.query(
                'UPDATE client SET adresse = $1, ville = $2, rue = $3, activite = $4 WHERE id_utilisateur = $5',
                [adresse || null, ville || null, rue || null, activite || null, userId]
            );
        }

        // ✅ Return updated fields so frontend can refresh state immediately (no re-login needed)
        const updatedUser = {
            nom: nom.trim(),
            prenom: prenom.trim(),
            num_tlp: num_tlp || null,
            ...(req.user.role === 'CLIENT' && { adresse, ville, rue, activite })
        };

        res.status(200).json({ message: "Profil mis à jour !", user: updatedUser });
        await logAction(userId, "UPDATE_PROFIL", `Modification profil : ${prenom} ${nom}`);

    } catch (err) {
        console.error("❌ updateProfile error:", err.message);
        res.status(500).json({ error: "Erreur de mise à jour.", detail: err.message });
    }
};

// ─── CHANGEMENT DE MOT DE PASSE (DEPUIS DASHBOARD) ────────────────────────────
exports.changePassword = async (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    try {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ error: "Mot de passe trop faible. Il doit contenir 8 caractères minimum, une majuscule, un chiffre et un caractère spécial." });
        }

        const result = await pool.query('SELECT password_hash FROM utilisateur WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Utilisateur introuvable.' });
        }

        const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
        if (!isMatch) return res.status(401).json({ error: 'Mot de passe actuel incorrect.' });

        const hashed = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE utilisateur SET password_hash = $1 WHERE id = $2', [hashed, userId]);

        res.status(200).json({ message: 'Mot de passe modifié avec succès.' });
        await logAction(userId, 'CHANGE_PASSWORD', "Mot de passe changé par l'utilisateur.");

    } catch (err) {
        console.error("❌ changePassword error:", err.message);
        res.status(500).json({ error: 'Erreur lors du changement.', detail: err.message });
    }
};

// ─── UPLOAD AVATAR ────────────────────────────────────────────────────────────
exports.uploadAvatar = async (req, res) => {
    const userId = req.user.id;

    if (!req.file) return res.status(400).json({ error: 'Aucune image fournie.' });

    // Limit: 2MB
    if (req.file.size > 2 * 1024 * 1024) {
        return res.status(400).json({ error: "L'image ne doit pas dépasser 2MB." });
    }

    try {
        const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        await pool.query('UPDATE utilisateur SET avatar = $1 WHERE id = $2', [base64, userId]);

        res.status(200).json({ message: 'Avatar mis à jour.', avatar: base64 });
        await logAction(userId, 'UPDATE_AVATAR', 'Nouvel avatar uploadé.');

    } catch (err) {
        console.error("❌ uploadAvatar error:", err.message);
        res.status(500).json({ error: "Erreur lors de l'upload.", detail: err.message });
    }
};

// ─── LOGS D'ACTIVITÉ ──────────────────────────────────────────────────────────
exports.getActivityLogs = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT log.id, log.action, log.date_heure, log.description,
                   u.nom, u.prenom, u.role
            FROM log_activite log
            JOIN utilisateur u ON log.id_utilisateur = u.id
            ORDER BY log.date_heure DESC
        `);
        res.status(200).json(result.rows);

    } catch (err) {
        console.error("❌ getActivityLogs error:", err.message);
        res.status(500).json({ error: "Erreur lors de la récupération des logs.", detail: err.message });
    }
};