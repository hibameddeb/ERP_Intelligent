const pool = require('../config/db');
const { sendAdminNotification } = require('../utils/mailer');

// Valid identifier types (VARCHAR(3) column)
const VALID_TYPES = ['MF', 'CI', 'RC', 'SI', 'AU'];

exports.creerDemandeAdhesion = async (req, res) => {
    let values; // declared here so catch block can access it

    try {
        const rawBody = req.body;
        console.log(" Raw request body:", JSON.stringify(rawBody, null, 2));

       
        const rawType = (rawBody.type_identifiant || 'MF').toString().toUpperCase().trim();
        const normalizedType = VALID_TYPES.includes(rawType) ? rawType : 'MF';

        let num_autorisation = null;
        if (rawBody.num_autorisation !== undefined && rawBody.num_autorisation !== '') {
            const parsed = parseInt(rawBody.num_autorisation, 10);
            num_autorisation = isNaN(parsed) ? null : parsed;
        }

        // ─── num_etablissement: CHAR(3) column — max 3 chars ──────────────
        // ⚠️  Your DB column is CHAR(3) which only fits 3-character values.
        // If you need to store longer values, run this migration first:
        //   ALTER TABLE demande_adhesion ALTER COLUMN num_etablissement TYPE VARCHAR(50);
        const num_etablissement = (rawBody.num_etablissement || '').toString().trim().substring(0, 3) || null;

        const safeData = {
            nom:              (rawBody.nom     || '').toString().substring(0, 100).trim() || null,
            prenom:           (rawBody.prenom  || '').toString().substring(0, 100).trim() || null,
            email:            (rawBody.email   || '').toString().substring(0, 150).trim() || null, // col max=150
            num_tlp:          (rawBody.num_tlp || '').toString().substring(0, 20).trim()  || null,
            type_identifiant: normalizedType,                                                       // VARCHAR(3)
            identifiant:      (rawBody.identifiant || '').toString().substring(0, 50).trim() || null,
            adresse:          (rawBody.adresse || '').toString().trim() || null,                    // text (unlimited)
            ville:            (rawBody.ville   || '').toString().substring(0, 100).trim() || null,
            rue:              (rawBody.rue     || '').toString().substring(0, 255).trim() || null,
            activite:         (rawBody.activite || '').toString().trim() || null,                   // text (unlimited)
            num_autorisation,                                                                        // INTEGER
            date_autorisation: rawBody.date_autorisation || null,                                   // DATE
            num_etablissement,                                                                       // CHAR(3)
        };

        // ─── Validation ────────────────────────────────────────────────────
        const missing = [];
        if (!safeData.nom)              missing.push('nom');
        if (!safeData.prenom)           missing.push('prenom');
        if (!safeData.email)            missing.push('email');
        if (!safeData.type_identifiant) missing.push('type_identifiant');
        if (!safeData.identifiant)      missing.push('identifiant');
        if (!safeData.adresse)          missing.push('adresse');
        if (!safeData.ville)            missing.push('ville');

        if (missing.length > 0) {
            return res.status(400).json({ error: "Champs obligatoires manquants", fields: missing });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(safeData.email)) {
            return res.status(400).json({ error: "Format d'email invalide" });
        }

        console.log("✅ Safe values ready:");
        console.log("- type_identifiant:", `"${safeData.type_identifiant}"`);
        console.log("- num_autorisation:", safeData.num_autorisation, "(integer)");
        console.log("- num_etablissement:", `"${safeData.num_etablissement}"`);

        // ─── Insert ────────────────────────────────────────────────────────
        const query = `
            INSERT INTO demande_adhesion (
                nom, prenom, email, num_tlp,
                type_identifiant, identifiant, adresse, ville, rue,
                activite, num_autorisation, date_autorisation, num_etablissement
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
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
        ];

        console.log("📤 Executing query with", values.length, "values");
        console.log("Values:", values.map((v, i) => ({ [`$${i + 1}`]: v })));

        const result = await pool.query(query, values);
        const newRequestId = result.rows[0].id;
        console.log("🎉 INSERT SUCCESS - ID:", newRequestId);

        // ─── Admin email notification (non-blocking) ───────────────────────
        try {
            await sendAdminNotification(process.env.ADMIN_EMAIL, {
                id:          newRequestId,
                nom:         safeData.nom,
                prenom:      safeData.prenom,
                identifiant: safeData.identifiant,
                type:        safeData.type_identifiant,
            });
            console.log("📧 Email sent");
        } catch (emailError) {
            console.error("⚠️ Email failed (non-blocking):", emailError.message);
        }

        return res.status(201).json({
            success: true,
            message: "Demande créée avec succès!",
            id: newRequestId,
        });

    } catch (err) {
        console.error("💥 DETAILED ERROR:", {
            message: err.message,
            code:    err.code,
            detail:  err.detail  || null,
            hint:    err.hint    || null,
            where:   err.where   || null,
            values:  typeof values !== 'undefined'
                ? values.map((v, i) => ({ [`$${i + 1}`]: v }))
                : 'values not yet defined',
        });

        return res.status(500).json({ error: "Erreur serveur interne" });
    }
};