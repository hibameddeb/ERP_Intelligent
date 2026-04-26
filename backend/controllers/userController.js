const pool = require("../config/db");
const { logAction } = require("../utils/logs");
const {
    sendStatusEmail,
    sendTransferEmail,
    sendInvitationEmail,
} = require("../utils/mailer");
const crypto = require("crypto");
const {
    VALID_ROLES,
    VALID_TYPES,
    isValidEmail,
    isValidPhone,
    isValidIdentifiant,
    isValidPastDate,
    isPositiveInt,
    isNonEmpty,
} = require("../utils/validation");

// ─────────────────────────────────────────────────────────
// GET /users
// ─────────────────────────────────────────────────────────
exports.getUsers = async (req, res) => {
    const userRole = req.user.role;
    const userId   = req.user.id;
    const { roleFilter } = req.query;

    // Validation : roleFilter doit être un rôle connu (si fourni)
    if (roleFilter) {
        const normalized = roleFilter.toString().toUpperCase().trim();
        if (!VALID_ROLES.includes(normalized)) {
            return res.status(400).json({
                message: `Filtre de rôle invalide. Valeurs acceptées : ${VALID_ROLES.join(', ')}`,
            });
        }
    }

    try {
        let query = `
            SELECT u.id, u.nom, u.prenom, u.email, u.role, u.num_tlp, u.est_actif,
                   c.id AS client_id,
                   c.type_identifiant, c.identifiant, c.ville, c.activite, c.id_commercial,
                   COALESCE(com.region, c.region) AS region
            FROM utilisateur u
            LEFT JOIN client     c   ON u.id = c.id_utilisateur
            LEFT JOIN commercial com ON u.id = com.id_utilisateur
            WHERE 1=1
        `;
        const queryParams = [];

        if (userRole === "COMMERCIAL") {
            queryParams.push(userId);
            query += ` AND u.role = 'CLIENT' AND c.id_commercial = $${queryParams.length}`;
        } else if (userRole === "COMPTABLE") {
            query += ` AND u.role IN ('CLIENT', 'COMMERCIAL')`;
        } else if (userRole === "ADMIN") {
            if (roleFilter) {
                queryParams.push(roleFilter.toUpperCase().trim());
                query += ` AND u.role = $${queryParams.length}`;
            }
        } else {
            return res.status(403).json({ message: "Accès non autorisé à la liste." });
        }

        query += ` ORDER BY u.id ASC`;

        const result = await pool.query(query, queryParams);

        await logAction(
            req.user.id,
            "VIEW_USERS",
            `Consultation liste - Filtre: ${roleFilter || "Aucun"}`,
        );

        res.status(200).json(result.rows);
    } catch (err) {
        console.error("GET USERS ERROR:", err.message);
        res.status(500).json({ error: "Erreur lors de la récupération." });
    }
};

// ─────────────────────────────────────────────────────────
// GET /fournisseurs
// ─────────────────────────────────────────────────────────
exports.getFournisseurs = async (req, res) => {
    try {
        const query = `
            SELECT u.id, u.nom, u.prenom, u.email, u.role, u.num_tlp, u.est_actif,
                   f.token_invitation, f.expiration_token, f.statut_inscription,
                   f.nom_societe, f.matricule_fiscal, f.adresse_siege, f.rib, f.secteur_activite
            FROM utilisateur u
            JOIN fournisseur f ON u.id = f.id_utilisateur
            ORDER BY u.id ASC
        `;

        const result = await pool.query(query);

        await logAction(req.user.id, "VIEW_FOURNISSEURS", "Consultation liste fournisseurs");

        res.status(200).json(result.rows);
    } catch (err) {
        console.error("GET FOURNISSEURS ERROR:", err.message);
        res.status(500).json({ error: "Erreur lors de la récupération des fournisseurs." });
    }
};

// ─────────────────────────────────────────────────────────
// POST /users  — créer un compte staff / fournisseur
// ─────────────────────────────────────────────────────────
exports.createUser = async (req, res) => {
    const { nom, prenom, email, role, num_tlp, region } = req.body;

    // --- Champs obligatoires de base ---
    if (!isNonEmpty(nom, 100)) {
        return res.status(400).json({ message: "Le nom est obligatoire (1–100 caractères)." });
    }
    if (!isNonEmpty(prenom, 100)) {
        return res.status(400).json({ message: "Le prénom est obligatoire (1–100 caractères)." });
    }

    // Règle métier existante (conservée telle quelle)
    if (nom.trim().length + prenom.trim().length > 40) {
        return res.status(400).json({
            message: "Le cumul Nom + Prénom ne doit pas dépasser 40 caractères.",
        });
    }

    // --- Email ---
    if (!isNonEmpty(email)) {
        return res.status(400).json({ message: "L'email est obligatoire." });
    }
    if (!isValidEmail(email.trim())) {
        return res.status(400).json({ message: "Format d'email invalide." });
    }

    // --- Rôle ---
    if (!role || !VALID_ROLES.includes(role.toString().toUpperCase().trim())) {
        return res.status(400).json({
            message: `Rôle invalide. Valeurs acceptées : ${VALID_ROLES.join(', ')}`,
        });
    }

    // --- Règles métier sur le rôle (inchangées) ---
    if (role === "CLIENT") {
        return res.status(400).json({
            message: "La création d'un client doit passer par le flux de validation des demandes d'adhésion.",
        });
    }
    if (role === "ADMIN") {
        return res.status(403).json({
            message: "La création d'un compte administrateur est interdite via cette interface.",
        });
    }

    // --- Téléphone (obligatoire pour COMMERCIAL et FOURNISSEUR) ---
    if (num_tlp) {
        if (!isValidPhone(num_tlp.toString())) {
            return res.status(400).json({
                message: "Format de numéro de téléphone invalide (7–20 caractères, chiffres/+/-/espaces).",
            });
        }
    }

    // --- Région (COMMERCIAL) ---
    if (role === "COMMERCIAL") {
        if (!num_tlp) {
            return res.status(400).json({ message: "Le numéro de téléphone est obligatoire pour un commercial." });
        }
        if (!isNonEmpty(region, 100)) {
            return res.status(400).json({ message: "La région est obligatoire pour la création d'un compte commercial (1–100 caractères)." });
        }
    }

    // ── FOURNISSEUR : flux invitation ──────────────────────
    if (role === "FOURNISSEUR") {
        const db = await pool.connect();
        try {
            await db.query("BEGIN");

            const invitationToken  = crypto.randomUUID();
            const expirationToken  = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            const userRes = await db.query(
                `INSERT INTO utilisateur (nom, prenom, email, role, num_tlp, est_actif)
                 VALUES ($1, $2, $3, $4, $5, false) RETURNING id`,
                [nom.trim(), prenom.trim(), email.trim().toLowerCase(), role, num_tlp || null],
            );
            const userId = userRes.rows[0].id;

            await db.query(
                `INSERT INTO fournisseur (id_utilisateur, token_invitation, expiration_token, statut_inscription)
                 VALUES ($1, $2, $3, 'INVITE')`,
                [userId, invitationToken, expirationToken],
            );

            await db.query("COMMIT");

            await sendInvitationEmail(email.trim(), nom.trim(), prenom.trim(), role, invitationToken);

            await logAction(
                req.user.id,
                "ADMIN_INVITE_SUPPLIER",
                `Invitation envoyée à ${email} (${role}) - Token: ${invitationToken}`,
            );

            return res.status(200).json({
                message: `Invitation envoyée à ${prenom.trim()} ${nom.trim()} pour le rôle ${role}.`,
            });
        } catch (err) {
            await db.query("ROLLBACK");
            console.error(err.message);
            return res.status(500).json({ error: "Erreur lors de l'invitation du fournisseur." });
        } finally {
            db.release();
        }
    }

    // ── Autres rôles (COMMERCIAL, COMPTABLE…) ─────────────
    try {
        const userRes = await pool.query(
            `INSERT INTO utilisateur (nom, prenom, email, role, num_tlp, est_actif)
             VALUES ($1, $2, $3, $4, $5, false) RETURNING id`,
            [nom.trim(), prenom.trim(), email.trim().toLowerCase(), role, num_tlp || null],
        );
        const userId = userRes.rows[0].id;

        if (role === "COMMERCIAL") {
            await pool.query(
                `INSERT INTO commercial (id_utilisateur, telephone_pro, region)
                 VALUES ($1, $2, $3)`,
                [userId, num_tlp, region.trim()],
            );
        }

        await logAction(
            req.user.id,
            "ADMIN_CREATE_STAFF",
            `Création du compte personnel : ${email} (${role})${region ? ` - Région : ${region}` : ""}`,
        );

        res.status(201).json({ message: `Compte ${role} créé avec succès.` });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Erreur lors de la création de l'utilisateur." });
    }
};

// ─────────────────────────────────────────────────────────
// PUT /users/:id
// ─────────────────────────────────────────────────────────
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const {
        nom, prenom, email, num_tlp,
        type_identifiant, identifiant,
        adresse, ville, rue, activite,
        num_autorisation, date_autorisation, num_etablissement,
        id_commercial, region,
    } = req.body;

    // --- Validation ID paramètre ---
    if (!isPositiveInt(id)) {
        return res.status(400).json({ message: "Identifiant utilisateur invalide." });
    }

    // --- Champs communs obligatoires ---
    if (!isNonEmpty(nom, 100)) {
        return res.status(400).json({ message: "Le nom est obligatoire (1–100 caractères)." });
    }
    if (!isNonEmpty(prenom, 100)) {
        return res.status(400).json({ message: "Le prénom est obligatoire (1–100 caractères)." });
    }
    if (!isNonEmpty(email)) {
        return res.status(400).json({ message: "L'email est obligatoire." });
    }
    if (!isValidEmail(email.trim())) {
        return res.status(400).json({ message: "Format d'email invalide." });
    }

    // --- Téléphone (si fourni) ---
    if (num_tlp && !isValidPhone(num_tlp.toString())) {
        return res.status(400).json({
            message: "Format de numéro de téléphone invalide (7–20 caractères, chiffres/+/-/espaces).",
        });
    }

    const db = await pool.connect();
    try {
        await db.query("BEGIN");

        const userCheck = await db.query(
            "SELECT role FROM utilisateur WHERE id = $1",
            [id],
        );
        if (userCheck.rows.length === 0) {
            await db.query("ROLLBACK");
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        const currentRole = userCheck.rows[0].role;

        // --- Validations spécifiques CLIENT ---
        if (currentRole === "CLIENT") {

            // type_identifiant
            const normalizedType = (type_identifiant || '').toString().toUpperCase().trim();
            if (!VALID_TYPES.includes(normalizedType)) {
                await db.query("ROLLBACK");
                return res.status(400).json({
                    message: `Type d'identifiant invalide. Valeurs acceptées : ${VALID_TYPES.join(', ')}`,
                });
            }

            // identifiant selon type
            if (!identifiant || !isValidIdentifiant(identifiant.toString().trim(), normalizedType)) {
                const hints = {
                    MF: "7 chiffres suivis d'une lettre optionnelle (ex. 1234567A)",
                    CI: "8 chiffres exactement",
                    RC: "5 à 20 caractères alphanumériques",
                    SI: "4 à 20 caractères alphanumériques",
                    AU: "2 à 50 caractères",
                };
                await db.query("ROLLBACK");
                return res.status(400).json({
                    message: `Format d'identifiant invalide pour le type ${normalizedType}`,
                    hint: hints[normalizedType],
                });
            }

            // ville obligatoire
            if (!isNonEmpty(ville, 100)) {
                await db.query("ROLLBACK");
                return res.status(400).json({ message: "La ville est obligatoire (1–100 caractères)." });
            }

            // adresse obligatoire
            if (!isNonEmpty(adresse)) {
                await db.query("ROLLBACK");
                return res.status(400).json({ message: "L'adresse est obligatoire." });
            }
            if (adresse.toString().length > 2000) {
                await db.query("ROLLBACK");
                return res.status(400).json({ message: "L'adresse ne doit pas dépasser 2000 caractères." });
            }

            // date_autorisation (si fournie)
            if (date_autorisation && date_autorisation.toString().trim() !== '') {
                if (!isValidPastDate(date_autorisation.toString().trim())) {
                    await db.query("ROLLBACK");
                    return res.status(400).json({
                        message: "Date d'autorisation invalide.",
                        hint: "Format attendu : YYYY-MM-DD, date passée ou présente.",
                    });
                }
            }

            // num_autorisation (si fourni)
            if (num_autorisation !== undefined && num_autorisation !== null && num_autorisation !== '') {
                const parsed = parseInt(num_autorisation, 10);
                if (isNaN(parsed) || parsed <= 0) {
                    await db.query("ROLLBACK");
                    return res.status(400).json({
                        message: "Numéro d'autorisation invalide. Doit être un entier positif.",
                    });
                }
            }

            // num_etablissement (si fourni)
            if (num_etablissement && num_etablissement.toString().trim() !== '') {
                if (!/^[A-Z0-9]{3}$/i.test(num_etablissement.toString().trim())) {
                    await db.query("ROLLBACK");
                    return res.status(400).json({
                        message: "Numéro d'établissement invalide. Exactement 3 caractères alphanumériques.",
                    });
                }
            }

            // id_commercial (si fourni)
            if (id_commercial !== undefined && id_commercial !== null && id_commercial !== '') {
                if (!isPositiveInt(id_commercial)) {
                    await db.query("ROLLBACK");
                    return res.status(400).json({ message: "id_commercial doit être un entier positif." });
                }
            }
        }

        // --- Validations spécifiques COMMERCIAL ---
        if (currentRole === "COMMERCIAL") {
            if (!isNonEmpty(region, 100)) {
                await db.query("ROLLBACK");
                return res.status(400).json({ message: "La région est obligatoire pour un commercial (1–100 caractères)." });
            }
        }

        // ── UPDATE utilisateur ──────────────────────────────
        await db.query(
            `UPDATE utilisateur SET nom=$1, prenom=$2, email=$3, num_tlp=$4 WHERE id=$5`,
            [nom.trim(), prenom.trim(), email.trim().toLowerCase(), num_tlp || null, id],
        );

        if (currentRole === "CLIENT") {
            const normalizedType = (type_identifiant || '').toString().toUpperCase().trim();
            await db.query(
                `UPDATE client
                 SET type_identifiant=$1, identifiant=$2, adresse=$3, ville=$4, rue=$5,
                     activite=$6, num_autorisation=$7, date_autorisation=$8,
                     num_etablissement=$9, id_commercial=$10
                 WHERE id_utilisateur=$11`,
                [
                    normalizedType,
                    identifiant.toString().trim(),
                    adresse,
                    ville.toString().trim(),
                    rue || null,
                    activite || null,
                    num_autorisation ? parseInt(num_autorisation, 10) : null,
                    date_autorisation && date_autorisation.toString().trim() !== '' ? date_autorisation.toString().trim() : null,
                    num_etablissement ? num_etablissement.toString().trim().toUpperCase() : null,
                    id_commercial ? parseInt(id_commercial, 10) : null,
                    id,
                ],
            );
        }

        if (currentRole === "COMMERCIAL") {
            await db.query(
                `UPDATE commercial SET telephone_pro=$1, region=$2 WHERE id_utilisateur=$3`,
                [num_tlp || null, region.trim(), id],
            );
        }

        await db.query("COMMIT");

        await logAction(
            req.user.id,
            "ADMIN_UPDATE_USER",
            `Mise à jour du profil ID:${id} (${currentRole})${region ? ` - Région : ${region}` : ""}`,
        );

        res.status(200).json({ message: "Profil mis à jour avec succès." });
    } catch (err) {
        await db.query("ROLLBACK");
        console.error("UPDATE USER ERROR:", err.message);
        res.status(500).json({ error: "Erreur lors de la mise à jour." });
    } finally {
        db.release();
    }
};

// ─────────────────────────────────────────────────────────
// DELETE /users/:id
// ─────────────────────────────────────────────────────────
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    const { nouveau_commercial_id } = req.body;

    // --- Validation ID paramètre ---
    if (!isPositiveInt(id)) {
        return res.status(400).json({ message: "Identifiant utilisateur invalide." });
    }

    // --- Validation nouveau_commercial_id (si fourni) ---
    if (
        nouveau_commercial_id !== undefined &&
        nouveau_commercial_id !== null &&
        nouveau_commercial_id !== ''
    ) {
        if (!isPositiveInt(nouveau_commercial_id)) {
            return res.status(400).json({
                message: "nouveau_commercial_id doit être un entier positif.",
            });
        }
    }

    const db = await pool.connect();
    try {
        await db.query("BEGIN");

        const userCheck = await db.query(
            "SELECT role, nom, prenom, email FROM utilisateur WHERE id = $1",
            [id],
        );
        if (userCheck.rows.length === 0) {
            await db.query("ROLLBACK");
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        const { role, nom, prenom, email } = userCheck.rows[0];

        if (role === "ADMIN") {
            await db.query("ROLLBACK");
            return res.status(403).json({ message: "Suppression d'un administrateur interdite." });
        }

        if (role === "COMMERCIAL") {
            const clients = await db.query(
                `SELECT u.email, u.prenom, u.nom
                 FROM client c
                 JOIN utilisateur u ON u.id = c.id_utilisateur
                 WHERE c.id_commercial = $1`,
                [id],
            );

            if (clients.rows.length > 0) {
                if (!nouveau_commercial_id) {
                    await db.query("ROLLBACK");
                    return res.status(400).json({
                        message: "Ce commercial a des clients. Veuillez fournir un nouveau_commercial_id.",
                    });
                }

                const newComCheck = await db.query(
                    `SELECT id, nom, prenom, email FROM utilisateur
                     WHERE id = $1 AND role = 'COMMERCIAL'`,
                    [parseInt(nouveau_commercial_id, 10)],
                );
                if (newComCheck.rows.length === 0) {
                    await db.query("ROLLBACK");
                    return res.status(400).json({ message: "Nouveau commercial introuvable ou invalide." });
                }

                // Empêcher le transfert vers soi-même
                if (parseInt(nouveau_commercial_id, 10) === parseInt(id, 10)) {
                    await db.query("ROLLBACK");
                    return res.status(400).json({
                        message: "Le nouveau commercial ne peut pas être le même que celui supprimé.",
                    });
                }

                const newCom = newComCheck.rows[0];

                await db.query(
                    `UPDATE client SET id_commercial = $1 WHERE id_commercial = $2`,
                    [parseInt(nouveau_commercial_id, 10), id],
                );

                await sendStatusEmail(
                    email, prenom, false,
                    `Votre compte a été supprimé. Vos ${clients.rows.length} client(s) ont été transférés à ${newCom.prenom} ${newCom.nom}.`,
                );

                for (const client of clients.rows) {
                    await sendTransferEmail(
                        client.email, client.prenom,
                        `${prenom} ${nom}`,
                        `${newCom.prenom} ${newCom.nom}`,
                    );
                }
            }
        }

        await db.query("DELETE FROM utilisateur WHERE id = $1", [id]);

        await logAction(
            req.user.id,
            "ADMIN_DELETE_USER",
            `Suppression de ${prenom} ${nom} (${role}) - ID: ${id}`,
        );

        await db.query("COMMIT");
        res.status(200).json({ message: "Utilisateur supprimé avec succès." });
    } catch (err) {
        await db.query("ROLLBACK");
        console.error("DELETE USER ERROR:", err.message);
        res.status(500).json({ error: "Erreur lors de la suppression." });
    } finally {
        db.release();
    }
};

// ─────────────────────────────────────────────────────────
// PATCH /users/:id/status
// ─────────────────────────────────────────────────────────
exports.toggleUserStatus = async (req, res) => {
    const { id } = req.params;
    const { est_actif } = req.body;

    // --- Validation ID paramètre ---
    if (!isPositiveInt(id)) {
        return res.status(400).json({ message: "Identifiant utilisateur invalide." });
    }

    // --- Validation est_actif : doit être un booléen strict ---
    if (typeof est_actif !== 'boolean') {
        return res.status(400).json({
            message: "Le champ est_actif doit être un booléen (true ou false).",
        });
    }

    try {
        const result = await pool.query(
            "UPDATE utilisateur SET est_actif = $1 WHERE id = $2 RETURNING nom, prenom, email",
            [est_actif, id],
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        const user = result.rows[0];
        let mailSent = true;
        try {
            await sendStatusEmail(user.email, user.prenom, est_actif);
        } catch (mailErr) {
            console.error("Email non envoyé:", mailErr.message);
            mailSent = false;
        }

        const actionLabel = est_actif ? "ACTIVATION" : "DÉSACTIVATION";

        await logAction(
            req.user.id,
            `ADMIN_${actionLabel}`,
            `${actionLabel} du compte de ${user.prenom} ${user.nom} (${user.email})`,
        );

        res.status(200).json({
            message: mailSent
                ? `Le compte a été ${est_actif ? "activé" : "désactivé"} et l'email a été envoyé.`
                : `Le compte a été ${est_actif ? "activé" : "désactivé"}, mais l'email n'a pas pu partir.`,
        });
    } catch (err) {
        console.error("TOGGLE STATUS ERROR:", err.message);
        res.status(500).json({ error: "Erreur lors du changement de statut." });
    }
};