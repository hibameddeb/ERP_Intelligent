// controllers/paymentController.js
// ⚠️ FIX SSL sandbox Konnect — retirer en production
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const axios      = require("axios");
const https      = require("https");
const pool       = require("../config/db");

// ✅ Utilise le mailer existant du projet (EMAIL_USER + EMAIL_PASS)
const { sendPaymentLinkEmail } = require("../utils/mailer");

// Agent HTTPS — ignore certificats auto-signés (sandbox uniquement)
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const KONNECT_BASE   = process.env.KONNECT_BASE_URL || "https://api.sandbox.konnect.network/api/v2";
const KONNECT_KEY    = process.env.KONNECT_API_KEY;
const KONNECT_WALLET = process.env.KONNECT_WALLET_ID;

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/facture/:id/initier
// ✅ Vrai flux : Admin → génère lien Konnect → EMAIL au fournisseur
//               Le fournisseur saisit SES coordonnées bancaires
// ─────────────────────────────────────────────────────────────────────────────
const initierPaiementFacture = async (req, res) => {
  const { id } = req.params;

  console.log("\n🔵 ══ initierPaiementFacture ══");
  console.log("   facture id     :", id);
  console.log("   KONNECT_KEY    :", KONNECT_KEY    ? "✅ présent" : "❌ MANQUANT");
  console.log("   KONNECT_WALLET :", KONNECT_WALLET ? "✅ présent" : "❌ MANQUANT");
  console.log("   EMAIL_USER     :", process.env.EMAIL_USER || "❌ MANQUANT");

  const db = await pool.connect();
  try {

    // ── STEP 1 : Récupérer facture + fournisseur ──────────────────────────
    console.log("🔵 STEP 1 — Récupération facture...");
    const result = await db.query(`
      SELECT fa.id, fa.num_facture, fa.total_ttc, fa.total_ht, fa.statut,
             u.nom        AS fournisseur_nom,
             u.prenom     AS fournisseur_prenom,
             u.email      AS fournisseur_email
      FROM facture_achat fa
      LEFT JOIN utilisateur u ON u.id = fa.id_fournisseur
      WHERE fa.id = $1
    `, [id]);

    if (!result.rows.length) {
      console.log("❌ STEP 1 — Facture introuvable");
      return res.status(404).json({ success: false, message: "Facture introuvable." });
    }

    const f = result.rows[0];
    console.log("✅ STEP 1 — Facture:", f.num_facture, "| Statut:", f.statut, "| Email:", f.fournisseur_email);

    if (f.statut !== "non_payée") {
      console.log("❌ STEP 1 — Statut invalide :", f.statut);
      return res.status(400).json({
        success: false,
        message: `Statut invalide : "${f.statut}". Seules les factures "non_payée" peuvent être payées.`,
      });
    }

    if (!f.fournisseur_email) {
      console.log("❌ STEP 1 — Email fournisseur manquant");
      return res.status(400).json({ success: false, message: "Le fournisseur n'a pas d'adresse email." });
    }

    // ── STEP 2 : Appel Konnect API ─────────────────────────────────────────
    console.log("🔵 STEP 2 — Appel Konnect API...");
    const montantMillimes = Math.round(parseFloat(f.total_ttc) * 1000);
    console.log("   montant millimes :", montantMillimes);

    let payUrl, paymentRef;
    try {
      const konnectRes = await axios.post(
        `${KONNECT_BASE}/payments/init-payment`,
        {
          receiverWalletId:       KONNECT_WALLET,
          token:                  "TND",
          amount:                 montantMillimes,
          type:                   "immediate",
          description:            `Paiement facture ${f.num_facture}`,
          acceptedPaymentMethods: ["bank_card", "e-DINAR", "wallet"],
          lifespan:               60,
          checkoutForm:           true,
          silentWebhook:          true,
          webhook:                `${process.env.APP_URL}/api/payment/webhook`,
          successUrl:             `${process.env.APP_URL}/payment/success`,
          failUrl:                `${process.env.APP_URL}/payment/fail`,
          orderId:                `facture-${id}`,
          firstName:              f.fournisseur_prenom,
          lastName:               f.fournisseur_nom,
          email:                  f.fournisseur_email,
        },
        {
          headers:    { "x-api-key": KONNECT_KEY, "Content-Type": "application/json" },
          httpsAgent,
        }
      );
      payUrl     = konnectRes.data.payUrl;
      paymentRef = konnectRes.data.paymentRef;
      console.log("✅ STEP 2 — Konnect OK | paymentRef:", paymentRef);
    } catch (kErr) {
      console.log("❌ STEP 2 — Erreur Konnect:", kErr.response?.data || kErr.message);
      return res.status(500).json({
        success: false,
        message: "Erreur Konnect API : " + (kErr.response?.data?.message || kErr.message),
        detail:  kErr.response?.data,
      });
    }

    // ── STEP 3 : Sauvegarder en base ──────────────────────────────────────
    console.log("🔵 STEP 3 — Sauvegarde en base...");
    try {
      await db.query(`
        ALTER TABLE facture_achat
          ADD COLUMN IF NOT EXISTS konnect_payment_ref VARCHAR(150),
          ADD COLUMN IF NOT EXISTS konnect_pay_url     TEXT;
      `);
      await db.query(
        `UPDATE facture_achat SET konnect_payment_ref=$1, konnect_pay_url=$2 WHERE id=$3`,
        [paymentRef, payUrl, id]
      );
      console.log("✅ STEP 3 — Sauvegarde OK");
    } catch (dbErr) {
      console.log("⚠️  STEP 3 — DB warning (non bloquant):", dbErr.message);
    }

    // ── STEP 4 : Envoyer email au fournisseur via mailer.js ───────────────
    console.log("🔵 STEP 4 — Envoi email à:", f.fournisseur_email);
    try {
      await sendPaymentLinkEmail(
        f.fournisseur_email,
        f.fournisseur_prenom,
        f.fournisseur_nom,
        f.num_facture,
        f.total_ttc,
        payUrl
      );
      console.log("✅ STEP 4 — Email envoyé !");
    } catch (mailErr) {
      console.log("⚠️  STEP 4 — Email échoué (non bloquant):", mailErr.message);
    }

    // ── STEP 5 : Notification interne ─────────────────────────────────────
    try {
      await db.query(`
        INSERT INTO notification (type, message, id_facture_achat, is_read, created_at)
        VALUES ('LIEN_ENVOYE', $1, $2, false, NOW())
      `, [`Lien de paiement envoyé à ${f.fournisseur_email} pour la facture ${f.num_facture}.`, id]);
      console.log("✅ STEP 5 — Notification créée");
    } catch (_) {}

    console.log("✅ ══ Succès total ══\n");
    return res.json({
      success: true,
      message: `Lien de paiement envoyé à ${f.fournisseur_email}`,
      email:   f.fournisseur_email,
      payUrl,
    });

  } catch (err) {
    console.error("❌ ══ ERREUR GLOBALE ══");
    console.error("   Message :", err.message);
    console.error("   Stack   :", err.stack);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    db.release();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/facture/:id/simuler
// 🧪 Simulation PFE — marque directement payée sans vrai paiement
// ─────────────────────────────────────────────────────────────────────────────
const simulerPaiement = async (req, res) => {
  const { id } = req.params;
  console.log("\n🧪 ══ simulerPaiement — id:", id);
  const db = await pool.connect();
  try {
    const chk = await db.query(
      "SELECT statut, num_facture, total_ttc FROM facture_achat WHERE id=$1", [id]
    );
    if (!chk.rows.length)
      return res.status(404).json({ success: false, message: "Facture introuvable." });

    const { statut, num_facture, total_ttc } = chk.rows[0];
    console.log("   statut actuel :", statut);

    if (statut === "payée")
      return res.status(400).json({ success: false, message: "Facture déjà payée." });
    if (statut !== "non_payée")
      return res.status(400).json({ success: false, message: `Statut invalide : ${statut}. Seules les factures "non_payée" peuvent être payées.` });

    // Simuler délai réseau (réaliste pour la démo)
    await new Promise(r => setTimeout(r, 2000));

    // Créer colonnes si manquantes
    try {
      await db.query(`
        ALTER TABLE facture_achat
          ADD COLUMN IF NOT EXISTS konnect_payment_ref VARCHAR(150),
          ADD COLUMN IF NOT EXISTS konnect_pay_url     TEXT;
      `);
    } catch (_) {}

    await db.query(`
      UPDATE facture_achat
      SET statut              = 'payée',
          date_paiement       = NOW(),
          konnect_payment_ref = 'DEMO-' || floor(random()*999999)::text
      WHERE id = $1
    `, [id]);

    console.log("✅ Facture", num_facture, "simulée payée");

    try {
      await db.query(`
        INSERT INTO notification (type, message, id_facture_achat, is_read, created_at)
        VALUES ('FACTURE_PAYEE', $1, $2, false, NOW())
      `, [`Facture ${num_facture} payée (démo PFE) — ${parseFloat(total_ttc).toFixed(3)} DT.`, id]);
    } catch (_) {}

    return res.json({ success: true, message: "Paiement simulé avec succès." });
  } catch (err) {
    console.error("[simulerPaiement]", err.message);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    db.release();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/webhook — appelé par Konnect quand fournisseur a payé
// ─────────────────────────────────────────────────────────────────────────────
const webhookPaiement = async (req, res) => {
  const { payment_ref, status } = req.body;
  console.log("\n🔔 webhook — ref:", payment_ref, "status:", status);
  if (!payment_ref) return res.status(400).json({ message: "payment_ref manquant." });
  const db = await pool.connect();
  try {
    if (status === "completed") {
      const updated = await db.query(`
        UPDATE facture_achat SET statut='payée', date_paiement=NOW()
        WHERE konnect_payment_ref=$1 RETURNING id, num_facture
      `, [payment_ref]);
      if (updated.rows.length) {
        const f = updated.rows[0];
        console.log("✅ Facture", f.num_facture, "payée via webhook");
        try {
          await db.query(`
            INSERT INTO notification (type, message, id_facture_achat, is_read, created_at)
            VALUES ('FACTURE_PAYEE', $1, $2, false, NOW())
          `, [`Facture ${f.num_facture} payée par le fournisseur via Konnect.`, f.id]);
        } catch (_) {}
      }
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  } finally {
    db.release();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payment/facture/:id/verifier — polling frontend
// ─────────────────────────────────────────────────────────────────────────────
const verifierPaiement = async (req, res) => {
  const { id } = req.params;
  const db = await pool.connect();
  try {
    const result = await db.query(
      "SELECT statut, konnect_payment_ref FROM facture_achat WHERE id=$1", [id]
    );
    if (!result.rows.length)
      return res.status(404).json({ success: false, message: "Facture introuvable." });

    const { statut, konnect_payment_ref } = result.rows[0];
    if (statut === "payée") return res.json({ success: true, statut: "payée" });

    // Vérifier chez Konnect si pas encore confirmé en base
    if (konnect_payment_ref && !konnect_payment_ref.startsWith("DEMO")) {
      try {
        const kRes = await axios.get(
          `${KONNECT_BASE}/payments/${konnect_payment_ref}`,
          { headers: { "x-api-key": KONNECT_KEY }, httpsAgent }
        );
        if (kRes.data?.payment?.status === "completed") {
          await db.query(
            "UPDATE facture_achat SET statut='payée', date_paiement=NOW() WHERE id=$1", [id]
          );
          return res.json({ success: true, statut: "payée" });
        }
      } catch (_) {}
    }

    return res.json({ success: true, statut });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    db.release();
  }
};

module.exports = { initierPaiementFacture, simulerPaiement, webhookPaiement, verifierPaiement };