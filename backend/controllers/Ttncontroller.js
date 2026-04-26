/**
 * ttnController.js
 * Routes à ajouter dans factureRoutes.js :
 * 
 *   const ttnController = require("../controllers/ttnController");
 *   router.post("/:id/envoyer-ttn",  verifyToken, ttnController.envoyerATTN);
 *   router.get("/:id/statut-ttn",    verifyToken, ttnController.consulterStatutTTN);
 *   router.get("/ttn/recherche",     verifyToken, ttnController.rechercherTTN);
 */

const pool              = require("../config/db");
const { generateTEIF }  = require("../services/Xmlservices");
const { signTEIF }      = require("../services/signService");
const { saveEfact, consultEfact } = require("../services/ttnService");

const logActivity = async (client, { id_utilisateur, action, description }) => {
  await client.query(
    `INSERT INTO log_activite (id_utilisateur, action, description, date_heure) VALUES ($1, $2, $3, NOW())`,
    [id_utilisateur, action, description]
  );
};

/**
 * POST /api/factures/:id/envoyer-ttn
 * 1. Génère le XML TEIF
 * 2. Signe avec clé USB TunTrust
 * 3. Envoie à TTN via saveEfact
 * 4. Sauvegarde idSaveEfact + generatedRef en DB
 */
const envoyerATTN = async (req, res) => {
  const { id } = req.params;
  const db     = await pool.connect();

  try {
    // 1. Vérifier la facture
    const chk = await db.query(
      `SELECT id, num_facture, statut, signature_tunstrust, status_electronique FROM facture_vente WHERE id = $1`,
      [id]
    );

    if (!chk.rows.length) {
      return res.status(404).json({ success: false, message: "Facture introuvable." });
    }

    const facture = chk.rows[0];

    if (facture.statut !== "payée") {
      return res.status(400).json({ success: false, message: "Seules les factures payées peuvent être envoyées à TTN." });
    }

    if (facture.status_electronique === "submitted" || facture.status_electronique === "accepted") {
      return res.status(400).json({ success: false, message: "Cette facture a déjà été envoyée à TTN." });
    }

    // 2. Générer XML TEIF
    console.log(`[TTN] Génération XML TEIF pour facture #${id}...`);
    const xmlWithoutSig = await generateTEIF(id);

    // 3. Signer avec TunTrust
    console.log(`[TTN] Signature XML...`);
    const signedXml = await signTEIF(xmlWithoutSig);

    // 4. Envoyer à TTN
    console.log(`[TTN] Envoi à TTN saveEfact...`);
    const ttnResponse = await saveEfact(signedXml);

    // 5. Mettre à jour la facture en DB
    await db.query(
      `UPDATE facture_vente
       SET status_electronique  = 'submitted',
           signature_tunstrust  = $1,
           tnn_message          = $2,
           date_envoi           = NOW()
       WHERE id = $3`,
      [signedXml, ttnResponse.message, id]
    );

    await logActivity(db, {
      id_utilisateur: req.user?.id || null,
      action:        "ENVOYER_TTN",
      description:   `Facture #${id} (${facture.num_facture}) envoyée à TTN — idSaveEfact: ${ttnResponse.idSaveEfact}`,
    });

    return res.json({
      success:      true,
      message:      `Facture ${facture.num_facture} envoyée à TTN avec succès.`,
      idSaveEfact:  ttnResponse.idSaveEfact,
      generatedRef: ttnResponse.generatedRef,
      ttnMessage:   ttnResponse.message,
    });

  } catch (err) {
    console.error("[envoyerATTN]", err.message);

    // Erreur clé USB
    if (err.message.includes("PKCS11") || err.message.includes("clé")) {
      return res.status(503).json({
        success: false,
        message: "Clé USB TunTrust non détectée.",
        detail:  err.message,
      });
    }

    return res.status(500).json({ success: false, message: err.message });
  } finally {
    db.release();
  }
};

/**
 * GET /api/factures/:id/statut-ttn
 * Consulte le statut d'une facture chez TTN via consultEfact
 */
const consulterStatutTTN = async (req, res) => {
  const { id } = req.params;
  const db     = await pool.connect();

  try {
    const chk = await db.query(
      `SELECT num_facture, total_ht, total_ttc, status_electronique FROM facture_vente WHERE id = $1`,
      [id]
    );

    if (!chk.rows.length) {
      return res.status(404).json({ success: false, message: "Facture introuvable." });
    }

    const f = chk.rows[0];

    // Recherche par numéro de facture
    const results = await consultEfact({ documentNumber: f.num_facture });

    if (!results.length) {
      return res.json({ success: true, message: "Facture non trouvée chez TTN.", data: [] });
    }

    const ttnFacture = results[0];

    // Mettre à jour le statut en DB selon la réponse TTN
    let newStatus = f.status_electronique;
    if (ttnFacture.listAcknowlegments && ttnFacture.listAcknowlegments.length > 0) {
      newStatus = "rejected";
    } else if (ttnFacture.generatedRef) {
      newStatus = "accepted";
    }

    if (newStatus !== f.status_electronique) {
      await db.query(
        `UPDATE facture_vente SET status_electronique = $1, code_qr = $2 WHERE id = $3`,
        [newStatus, ttnFacture.generatedRef || null, id]
      );
    }

    return res.json({
      success:      true,
      status:       newStatus,
      generatedRef: ttnFacture.generatedRef,
      idSaveEfact:  ttnFacture.idSaveEfact,
      acquittements: ttnFacture.listAcknowlegments,
      data:         ttnFacture,
    });

  } catch (err) {
    console.error("[consulterStatutTTN]", err.message);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    db.release();
  }
};

/**
 * GET /api/factures/ttn/recherche?documentNumber=...&dateDebut=...&dateFin=...
 * Recherche libre dans TTN
 */
const rechercherTTN = async (req, res) => {
  try {
    const {
      documentNumber,
      generatedRef,
      idSaveEfact,
      dateDebutDocument,
      dateFinDocument,
    } = req.query;

    const results = await consultEfact({
      documentNumber,
      generatedRef,
      idSaveEfact:       idSaveEfact ? Number(idSaveEfact) : null,
      dateDebutDocument: dateDebutDocument ? new Date(dateDebutDocument) : null,
      dateFinDocument:   dateFinDocument   ? new Date(dateFinDocument)   : null,
    });

    return res.json({ success: true, count: results.length, data: results });
  } catch (err) {
    console.error("[rechercherTTN]", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { envoyerATTN, consulterStatutTTN, rechercherTTN };