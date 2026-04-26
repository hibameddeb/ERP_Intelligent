/**
 * À ajouter dans factureRoutes.js :
 * 
 * const { signerFacture } = require("../controllers/signerController");
 * router.post("/:id/signer", verifyToken, signerFacture);
 */

const pool        = require("../config/db");
const { generateTEIF } = require("../services/Xmlservices");
const { signTEIF }     = require("../services/signService");

const logActivity = async (client, { id_utilisateur, action, description }) => {
  await client.query(
    `INSERT INTO log_activite (id_utilisateur, action, description, date_heure) VALUES ($1, $2, $3, NOW())`,
    [id_utilisateur, action, description]
  );
};

/**
 * POST /api/factures/:id/signer
 * 1. Génère le XML TEIF depuis la DB
 * 2. Signe via clé USB TunTrust (PKCS#11)
 * 3. Sauvegarde la signature dans facture_vente.signature_tunstrust
 * 4. Met status_electronique = 'pending'
 */
const signerFacture = async (req, res) => {
  const { id } = req.params;
  const db     = await pool.connect();

  try {
    // 1. Vérifier que la facture existe et est payée
    const chk = await db.query(
      `SELECT id, statut, num_facture, signature_tunstrust FROM facture_vente WHERE id = $1`,
      [id]
    );

    if (!chk.rows.length) {
      return res.status(404).json({ success: false, message: "Facture introuvable." });
    }

    const facture = chk.rows[0];

    if (facture.statut !== "payée") {
      return res.status(400).json({
        success: false,
        message: "Seules les factures payées peuvent être signées.",
      });
    }

    if (facture.signature_tunstrust) {
      return res.status(400).json({
        success: false,
        message: "Cette facture est déjà signée.",
      });
    }

    // 2. Générer le XML TEIF (sans signature)
    console.log(`[signerFacture] Génération XML TEIF pour facture #${id}...`);
    const xmlWithoutSig = await generateTEIF(id);

    // 3. Signer via clé USB TunTrust
    console.log(`[signerFacture] Signature via clé USB TunTrust...`);
    const signedXml = await signTEIF(xmlWithoutSig);

    // 4. Extraire la valeur de signature du XML signé
    const sigMatch = signedXml.match(
      /<ds:SignatureValue>([\s\S]*?)<\/ds:SignatureValue>/
    );
    const signatureValue = sigMatch ? sigMatch[1].replace(/\s/g, "") : signedXml;

    // 5. Sauvegarder dans la DB
    await db.query(
      `UPDATE facture_vente 
       SET signature_tunstrust  = $1,
           status_electronique  = 'pending',
           tnn_message          = $2
       WHERE id = $3`,
      [signatureValue, signedXml, id]
    );

    await logActivity(db, {
      id_utilisateur: req.user?.id || null,
      action:        "SIGNER_FACTURE",
      description:   `Facture #${id} (${facture.num_facture}) signée via TunTrust`,
    });

    return res.json({
      success: true,
      message: `Facture ${facture.num_facture} signée avec succès.`,
      data: {
        id,
        num_facture:         facture.num_facture,
        signature_tunstrust: signatureValue,
        status_electronique: "pending",
        signed_xml:          signedXml,
      },
    });

  } catch (err) {
    console.error("[signerFacture]", err.message);

    // Message d'erreur clair si la clé USB n'est pas branchée
    if (err.message.includes("PKCS11_LIB") || err.message.includes("Aucune clé")) {
      return res.status(503).json({
        success: false,
        message: "Clé USB TunTrust non détectée. Vérifiez que la clé est branchée et le driver installé.",
        detail: err.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la signature.",
      detail: err.message,
    });
  } finally {
    db.release();
  }
};

module.exports = { signerFacture };