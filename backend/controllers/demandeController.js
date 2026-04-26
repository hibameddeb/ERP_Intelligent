const pool = require('../config/db');
const { sendAdminNotification } = require('../utils/mailer');

// Valid identifier types (VARCHAR(3) column)
const VALID_TYPES = ['MF', 'CI', 'RC', 'SI', 'AU'];

// --- Validation helpers ---

/**
 * Validates phone number format.
 * Accepts digits, spaces, +, -, () — between 7 and 20 characters.
 */
function isValidPhone(phone) {
    return /^[+\d][\d\s\-().]{6,19}$/.test(phone);
}

/**
 * Validates identifier according to its type.
 *
 * MF (Matricule Fiscal)  : 7 digits, optional letter suffix  e.g. 1234567A
 * CI (Carte d'Identité)  : 8 digits                          e.g. 12345678
 * RC (Registre Commerce) : alphanumeric 5–20 chars            e.g. B123456
 * SI (Situation Fiscale) : alphanumeric 4–20 chars
 * AU (Autre)             : any non-empty string, 2–50 chars
 */
function isValidIdentifiant(value, type) {
    const patterns = {
        MF: /^\d{7}[A-Z]?$/,
        CI: /^\d{8}$/,
        RC: /^[A-Z0-9]{5,20}$/i,
        SI: /^[A-Z0-9]{4,20}$/i,
        AU: /^.{2,50}$/,
    };
    const regex = patterns[type];
    return regex ? regex.test(value) : false;
}

/**
 * Validates a date string (YYYY-MM-DD) and ensures it is not in the future.
 */
function isValidPastDate(dateStr) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) return false;
    return parsed <= new Date();
}

/**
 * Validates num_etablissement: exactly 3 alphanumeric characters.
 */
function isValidNumEtablissement(value) {
    return /^[A-Z0-9]{3}$/i.test(value);
}

// --- Controller ---

exports.creerDemandeAdhesion = async (req, res) => {
    let values;

    try {
        const rawBody = req.body;
        console.log('Raw request body:', JSON.stringify(rawBody, null, 2));

        // --- 1. Sanitise & normalise ---

        const rawType = (rawBody.type_identifiant || 'MF').toString().toUpperCase().trim();
        const normalizedType = VALID_TYPES.includes(rawType) ? rawType : null;

        let num_autorisation = null;
        if (rawBody.num_autorisation !== undefined && rawBody.num_autorisation !== '') {
            const parsed = parseInt(rawBody.num_autorisation, 10);
            num_autorisation = isNaN(parsed) ? null : parsed;
        }

        const num_etablissement_raw = (rawBody.num_etablissement || '').toString().trim().toUpperCase();
        const num_etablissement = num_etablissement_raw.substring(0, 3) || null;

        const safeData = {
            nom:              (rawBody.nom     || '').toString().substring(0, 100).trim() || null,
            prenom:           (rawBody.prenom  || '').toString().substring(0, 100).trim() || null,
            email:            (rawBody.email   || '').toString().substring(0, 150).trim() || null,
            num_tlp:          (rawBody.num_tlp || '').toString().substring(0, 20).trim()  || null,
            type_identifiant: normalizedType,
            identifiant:      (rawBody.identifiant || '').toString().substring(0, 50).trim() || null,
            adresse:          (rawBody.adresse || '').toString().trim() || null,
            ville:            (rawBody.ville   || '').toString().substring(0, 100).trim() || null,
            rue:              (rawBody.rue     || '').toString().substring(0, 255).trim() || null,
            activite:         (rawBody.activite || '').toString().trim() || null,
            num_autorisation,
            date_autorisation: (rawBody.date_autorisation || '').toString().trim() || null,
            num_etablissement,
            region:           (rawBody.region || '').toString().substring(0, 100).trim() || null,
        };

        // --- 2. Champs obligatoires ---

        const missing = [];
        if (!safeData.nom)              missing.push('nom');
        if (!safeData.prenom)           missing.push('prenom');
        if (!safeData.email)            missing.push('email');
        if (!safeData.type_identifiant) missing.push('type_identifiant');
        if (!safeData.identifiant)      missing.push('identifiant');
        if (!safeData.adresse)          missing.push('adresse');
        if (!safeData.ville)            missing.push('ville');
        if (!safeData.region)           missing.push('region');

        if (missing.length > 0) {
            return res.status(400).json({ error: 'Champs obligatoires manquants', fields: missing });
        }

        // --- 3. Format email ---

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(safeData.email)) {
            return res.status(400).json({ error: "Format d'email invalide" });
        }

        // --- 4. Format téléphone (si fourni) ---

        if (safeData.num_tlp && !isValidPhone(safeData.num_tlp)) {
            return res.status(400).json({
                error: 'Format de numéro de téléphone invalide',
                hint: 'Chiffres, espaces, +, -, () autorisés — 7 à 20 caractères',
            });
        }

        // --- 5. Identifiant selon le type ---

        if (!isValidIdentifiant(safeData.identifiant, safeData.type_identifiant)) {
            const hints = {
                MF: '7 chiffres suivis d\'une lettre optionnelle (ex. 1234567A)',
                CI: '8 chiffres exactement',
                RC: '5 à 20 caractères alphanumériques',
                SI: '4 à 20 caractères alphanumériques',
                AU: '2 à 50 caractères',
            };
            return res.status(400).json({
                error: `Format d'identifiant invalide pour le type ${safeData.type_identifiant}`,
                hint: hints[safeData.type_identifiant] || 'Vérifiez le format',
            });
        }

        // --- 6. Date autorisation (si fournie) ---

        if (safeData.date_autorisation) {
            if (!isValidPastDate(safeData.date_autorisation)) {
                return res.status(400).json({
                    error: "Date d'autorisation invalide",
                    hint: 'Format attendu : YYYY-MM-DD, date passée ou présente uniquement',
                });
            }
        } else {
            safeData.date_autorisation = null;
        }

        // --- 7. num_autorisation (si fourni) ---

        if (safeData.num_autorisation !== null) {
            if (!Number.isInteger(safeData.num_autorisation) || safeData.num_autorisation <= 0) {
                return res.status(400).json({
                    error: "Numéro d'autorisation invalide",
                    hint: 'Doit être un entier positif',
                });
            }
        }

        // --- 8. num_etablissement (si fourni) ---

        if (safeData.num_etablissement) {
            if (!isValidNumEtablissement(safeData.num_etablissement)) {
                return res.status(400).json({
                    error: "Numéro d'établissement invalide",
                    hint: 'Exactement 3 caractères alphanumériques',
                });
            }
        }

        // --- 9. Longueur max pour les champs TEXT libres ---

        const TEXT_MAX = 2000; // ajustez selon votre métier
        if (safeData.adresse && safeData.adresse.length > TEXT_MAX) {
            return res.status(400).json({ error: `L'adresse ne doit pas dépasser ${TEXT_MAX} caractères` });
        }
        if (safeData.activite && safeData.activite.length > TEXT_MAX) {
            return res.status(400).json({ error: `L'activité ne doit pas dépasser ${TEXT_MAX} caractères` });
        }

        // --- INSERT ---

        const query = `
            INSERT INTO demande_adhesion (
                nom, prenom, email, num_tlp,
                type_identifiant, identifiant, adresse, ville, rue,
                activite, num_autorisation, date_autorisation, num_etablissement,
                region
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
            RETURNING id;
        `;

        values = [
            safeData.nom,               // $1  VARCHAR(100)
            safeData.prenom,            // $2  VARCHAR(100)
            safeData.email,             // $3  VARCHAR(150)
            safeData.num_tlp,           // $4  VARCHAR(20)
            safeData.type_identifiant,  // $5  VARCHAR(3)
            safeData.identifiant,       // $6  VARCHAR(50)
            safeData.adresse,           // $7  TEXT
            safeData.ville,             // $8  VARCHAR(100)
            safeData.rue,               // $9  VARCHAR(255)
            safeData.activite,          // $10 TEXT
            safeData.num_autorisation,  // $11 INTEGER
            safeData.date_autorisation, // $12 DATE
            safeData.num_etablissement, // $13 CHAR(3)
            safeData.region,            // $14 VARCHAR(100)
        ];

        const result = await pool.query(query, values);
        const newRequestId = result.rows[0].id;
        console.log('INSERT SUCCESS - ID:', newRequestId);

        try {
            await pool.query(
                `INSERT INTO notification (type, message, id_produit) VALUES ($1, $2, NULL)`,
                [
                    'DEMANDE_ADHESION',
                    `Nouvelle demande d'adhésion de ${safeData.prenom} ${safeData.nom} (${safeData.type_identifiant} : ${safeData.identifiant}) — Région : ${safeData.region}`,
                ]
            );
        } catch (notifErr) {
            console.error('Notification insert failed:', notifErr.message);
        }

        try {
            await sendAdminNotification(process.env.ADMIN_EMAIL, {
                id:          newRequestId,
                nom:         safeData.nom,
                prenom:      safeData.prenom,
                identifiant: safeData.identifiant,
                type:        safeData.type_identifiant,
                region:      safeData.region,
            });
        } catch (emailError) {
            console.error('Email failed (non-blocking):', emailError.message);
        }

        return res.status(201).json({
            success: true,
            message: 'Demande créée avec succès!',
            id: newRequestId,
        });

    } catch (err) {
        console.error('DETAILED ERROR:', {
            message: err.message,
            code:    err.code,
            detail:  err.detail  || null,
            hint:    err.hint    || null,
            where:   err.where   || null,
            values:  typeof values !== 'undefined'
                ? values.map((v, i) => ({ [`$${i + 1}`]: v }))
                : 'values not yet defined',
        });

        return res.status(500).json({ error: 'Erreur serveur interne' });
    }
};