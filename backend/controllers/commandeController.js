const pool = require("../config/db");

const logActivity = async (client, { id_utilisateur, action, description }) => {
  await client.query(
    `INSERT INTO log_activite (id_utilisateur, action, description, date_heure)
     VALUES ($1, $2, $3, NOW())`,
    [id_utilisateur, action, description],
  );
};

const analyserFraudeIA = async (commande, lignes) => {
  const payload = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 256,
    system: `You are a fraud-detection engine for a B2B sales order system.
You receive a JSON summary of a sales order and must assess its fraud risk.
Respond ONLY with a valid JSON object — no markdown, no explanation — in this exact shape:
{
  "score_confiance": <number between 0 and 1, where 1 = fully trusted, 0 = highly suspicious>,
  "alerte_fraude":   <true | false>,
  "raison":          "<one short sentence explaining the main risk signal, or 'Aucune anomalie détectée'>"
}`,
    messages: [
      {
        role: "user",
        content: JSON.stringify({
          commande: {
            id:            commande.id,
            num_ordre:     commande.num_ordre,
            type_en:       commande.type_en,
            trimestre:     commande.trimestre,
            total_ht:      commande.total_ht,
            tva:           commande.tva,
            fodec:         commande.fodec,
            total_ttc:     commande.total_ttc,
            id_client:     commande.id_client,
            id_commercial: commande.id_commercial,
          },
          lignes: lignes.map((l) => ({
            id_produit:          l.id_produit,
            quantite:            l.quantite,
            prix_unitaire_ht_ap: l.prix_unitaire_ht_ap,
          })),
        }),
      },
    ],
  };

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${err}`);
  }

  const data   = await response.json();
  const raw    = data.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  const clean  = raw.replace(/```json|```/gi, "").trim();
  const parsed = JSON.parse(clean);

  return {
    score:  Number(parsed.score_confiance ?? 0),
    alerte: Boolean(parsed.alerte_fraude),
    raison: parsed.raison ?? "",
  };
};

// ─────────────────────────────────────────────
// GET ALL
// ─────────────────────────────────────────────
const getAllCommandes = async (req, res) => {
  const db = await pool.connect();
  try {
    const result = await db.query(`
      SELECT
        cmd.id, cmd.num_ordre, cmd.trimestre, cmd.type_en, cmd.statut,
        cmd.total_ht, cmd.tva, cmd.fodec, cmd.total_ttc,
        cmd.date_creation, cmd.date_validation,
        cmd.score_ia_confiance, cmd.alerte_fraude_ia,
        cmd.id_commercial,
        u_com.nom    AS commercial_nom,
        u_com.prenom AS commercial_prenom,
        cmd.id_client,
        c.identifiant AS client_identifiant,
        c.adresse, c.ville,
        u_cli.nom    AS client_nom,
        u_cli.prenom AS client_prenom
      FROM commande_vente cmd
      LEFT JOIN utilisateur u_com ON u_com.id = cmd.id_commercial
      LEFT JOIN client      c     ON c.id = cmd.id_client
      LEFT JOIN utilisateur u_cli ON u_cli.id = c.id_utilisateur
      ORDER BY cmd.date_creation DESC
    `);

    await logActivity(db, {
      id_utilisateur: req.user?.id || null,
      action: "CONSULTER_COMMANDES",
      description: `Liste commandes (${result.rows.length})`,
    });

    return res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("[getAllCommandes]", err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    db.release();
  }
};

// ─────────────────────────────────────────────
// GET MES COMMANDES (COMMERCIAL)
// ─────────────────────────────────────────────
const getMesCommandes = async (req, res) => {
  const db     = await pool.connect();
  const userId = req.user.id;
  try {
    const result = await db.query(`
      SELECT
        cmd.id, cmd.num_ordre, cmd.trimestre, cmd.type_en, cmd.statut,
        cmd.total_ht, cmd.tva, cmd.fodec, cmd.total_ttc,
        cmd.date_creation, cmd.date_validation,
        cmd.score_ia_confiance, cmd.alerte_fraude_ia,
        cmd.id_commercial,
        u_com.nom    AS commercial_nom,
        u_com.prenom AS commercial_prenom,
        cmd.id_client,
        c.identifiant AS client_identifiant,
        c.adresse, c.ville,
        u_cli.nom    AS client_nom,
        u_cli.prenom AS client_prenom
      FROM commande_vente cmd
      LEFT JOIN utilisateur u_com ON u_com.id = cmd.id_commercial
      LEFT JOIN client      c     ON c.id = cmd.id_client
      LEFT JOIN utilisateur u_cli ON u_cli.id = c.id_utilisateur
      WHERE cmd.id_commercial = $1
      ORDER BY cmd.date_creation DESC
    `, [userId]);

    await logActivity(db, {
      id_utilisateur: userId,
      action: "CONSULTER_MES_COMMANDES",
      description: `Liste mes commandes (${result.rows.length})`,
    });

    return res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("[getMesCommandes]", err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    db.release();
  }
};

// ─────────────────────────────────────────────
// GET BY ID
// ─────────────────────────────────────────────
const getCommandeById = async (req, res) => {
  const { id } = req.params;
  const db     = await pool.connect();

  try {
    const cmdResult = await db.query(`
      SELECT
        cmd.*,
        u_com.nom    AS commercial_nom,
        u_com.prenom AS commercial_prenom,
        c.identifiant AS client_identifiant,
        c.adresse     AS client_adresse,
        c.ville       AS client_ville,
        u_cli.nom    AS client_nom,
        u_cli.prenom AS client_prenom
      FROM commande_vente cmd
      LEFT JOIN utilisateur u_com ON u_com.id = cmd.id_commercial
      LEFT JOIN client      c     ON c.id = cmd.id_client
      LEFT JOIN utilisateur u_cli ON u_cli.id = c.id_utilisateur
      WHERE cmd.id = $1
    `, [id]);

    if (cmdResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Commande introuvable" });
    }

    const detailsResult = await db.query(`
      SELECT
        dcv.*,
        pe.nom_commercial                        AS nom_produit,
        pe.prix_vente_ht,
        COALESCE(pf.taux_tva,   0)               AS taux_tva,
        COALESCE(pf.taux_fodec, 0)               AS taux_fodec,
        COALESCE(pf.taux_dc,    0)               AS taux_dc,
        (dcv.quantite * dcv.prix_unitaire_ht_ap) AS total_ht_ligne
      FROM detail_commande_vente dcv
      LEFT JOIN produit_entreprise  pe ON pe.id = dcv.id_produit_entreprise
      LEFT JOIN produit_fournisseur pf ON pf.id = pe.id_produit_f
      WHERE dcv.id_commande_vente = $1
    `, [id]);

    return res.json({
      success: true,
      data: { commande: cmdResult.rows[0], details: detailsResult.rows },
    });
  } catch (err) {
    console.error("[getCommandeById]", err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    db.release();
  }
};

// ─────────────────────────────────────────────
// CREATE (with AI fraud scoring)
// ─────────────────────────────────────────────
const createCommande = async (req, res) => {
  const db = await pool.connect();

  try {
    await db.query("BEGIN");

    const {
      id_client,
      id_commercial,
      id_societe   = null,
      id_comptable = null,
      num_ordre    = null,
      trimestre    = null,
      type_en      = "DF",
      details      = [],
    } = req.body;

    if (!id_client || !id_commercial) {
      await db.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "id_client et id_commercial sont requis." });
    }

    if (!Array.isArray(details) || details.length === 0) {
      await db.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "Le panier doit contenir au moins une ligne." });
    }

    const clientCheck = await db.query(`
      SELECT c.id, u.est_actif FROM client c
      JOIN utilisateur u ON u.id = c.id_utilisateur
      WHERE c.id_utilisateur = $1
    `, [id_client]);

    if (!clientCheck.rows.length) { await db.query("ROLLBACK"); return res.status(404).json({ success: false, message: "Client introuvable." }); }
    if (!clientCheck.rows[0].est_actif) { await db.query("ROLLBACK"); return res.status(403).json({ success: false, message: "Client inactif." }); }

    const commercialCheck = await db.query(`SELECT id FROM utilisateur WHERE id = $1 AND role = 'COMMERCIAL'`, [id_commercial]);
    if (!commercialCheck.rows.length) { await db.query("ROLLBACK"); return res.status(400).json({ success: false, message: "Commercial invalide." }); }

    let nextOrder = num_ordre;
    if (!nextOrder) {
      const orderSeqRes = id_societe
        ? await db.query(`SELECT COALESCE(MAX(num_ordre), 0) + 1 AS next_order FROM commande_vente WHERE id_societe = $1`, [id_societe])
        : await db.query(`SELECT COALESCE(MAX(num_ordre), 0) + 1 AS next_order FROM commande_vente WHERE id_societe IS NULL`);
      nextOrder = orderSeqRes.rows[0].next_order;
    }

    let total_ht = 0, total_tva = 0, total_fodec = 0, total_ttc = 0;
    const lignes = [];

    for (const l of details) {
      const produitId = l.id_produit ?? l.id_produit_entreprise;
      if (!produitId) { await db.query("ROLLBACK"); return res.status(400).json({ success: false, message: "Chaque ligne doit contenir un id_produit." }); }

      const pRes = await db.query(`
        SELECT pe.id, pe.nom_commercial, pe.prix_vente_ht,
               COALESCE(pf.taux_tva,   0) AS taux_tva,
               COALESCE(pf.taux_fodec, 0) AS taux_fodec,
               COALESCE(pf.taux_dc,    0) AS taux_dc
        FROM produit_entreprise pe
        LEFT JOIN produit_fournisseur pf ON pf.id = pe.id_produit_f
        WHERE pe.id = $1`, [produitId]);

      if (!pRes.rows.length) { await db.query("ROLLBACK"); return res.status(400).json({ success: false, message: `Produit introuvable id=${produitId}.` }); }

      const p     = pRes.rows[0];
      const qty   = Number(l.quantite ?? l.quantite_achetee) || 0;
      const price = Number(l.prix_unitaire_ht_ap ?? p.prix_vente_ht) || 0;

      if (qty <= 0 || price < 0) { await db.query("ROLLBACK"); return res.status(400).json({ success: false, message: "Quantité et prix doivent être positifs." }); }

      const stockRes   = await db.query(`SELECT quantite FROM produit_entreprise WHERE id = $1 FOR UPDATE`, [produitId]);
      const stockDispo = Number(stockRes.rows[0]?.quantite ?? 0);
      if (stockDispo < qty) { await db.query("ROLLBACK"); return res.status(400).json({ success: false, message: `Stock insuffisant pour le produit id=${produitId}. Disponible : ${stockDispo}, demandé : ${qty}.` }); }

      const ligne_ht    = qty * price;
      const ligne_fodec = (ligne_ht * (Number(p.taux_fodec) || 0)) / 100;
      const ligne_tva   = ((ligne_ht + ligne_fodec) * (Number(p.taux_tva) || 0)) / 100;

      total_ht    += ligne_ht;
      total_fodec += ligne_fodec;
      total_tva   += ligne_tva;
      total_ttc   += ligne_ht + ligne_fodec + ligne_tva;

      lignes.push({ id_produit: produitId, quantite: qty, prix_unitaire_ht_ap: price });
    }

    const cmdRes = await db.query(`
      INSERT INTO commande_vente (
        id_client, id_commercial, id_comptable, id_societe,
        num_ordre, trimestre, type_en,
        total_ht, tva, fodec, total_ttc,
        statut, identifiant_global_unique, date_creation
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'en_attente',gen_random_uuid(),NOW())
      RETURNING *
    `, [clientCheck.rows[0].id, id_commercial, id_comptable, id_societe, nextOrder, trimestre, type_en,
        parseFloat(total_ht.toFixed(3)), parseFloat(total_tva.toFixed(3)), parseFloat(total_fodec.toFixed(3)), parseFloat(total_ttc.toFixed(3))]);

    const newCmd = cmdRes.rows[0];

    for (const ligne of lignes) {
      await db.query(`INSERT INTO detail_commande_vente (id_commande_vente, id_produit_entreprise, quantite, prix_unitaire_ht_ap) VALUES ($1,$2,$3,$4)`,
        [newCmd.id, ligne.id_produit, ligne.quantite, ligne.prix_unitaire_ht_ap]);
    }

    for (const ligne of lignes) {
      await db.query(`UPDATE produit_entreprise SET quantite = quantite - $1 WHERE id = $2`, [ligne.quantite, ligne.id_produit]);
    }

    await db.query("COMMIT");

    let scoreIA = null, alerteIA = false;
    try {
      const fraudeResult = await analyserFraudeIA(newCmd, lignes);
      scoreIA  = fraudeResult.score;
      alerteIA = fraudeResult.alerte;
      await db.query(`UPDATE commande_vente SET score_ia_confiance = $1, alerte_fraude_ia = $2 WHERE id = $3`, [scoreIA, alerteIA, newCmd.id]);
      await logActivity(db, { id_utilisateur: req.user?.id || null, action: "SCORING_IA_FRAUDE", description: `Commande #${newCmd.id} — score=${scoreIA} alerte=${alerteIA} | ${fraudeResult.raison}` });
    } catch (iaErr) {
      console.error("[createCommande] Scoring IA échoué (non bloquant):", iaErr.message);
    }

    await logActivity(db, { id_utilisateur: req.user?.id || null, action: "CREER_COMMANDE", description: `Commande #${newCmd.id} créée pour client ${id_client}` });

    return res.status(201).json({ success: true, data: { ...newCmd, score_ia_confiance: scoreIA, alerte_fraude_ia: alerteIA } });

  } catch (err) {
    await db.query("ROLLBACK").catch(() => {});
    console.error("[createCommande]", err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    db.release();
  }
};

// ─────────────────────────────────────────────
// CANCEL
// ─────────────────────────────────────────────
const cancelCommande = async (req, res) => {
  const { id } = req.params;
  const db     = await pool.connect();

  try {
    const check = await db.query(`SELECT statut FROM commande_vente WHERE id = $1`, [id]);
    if (!check.rows.length) return res.status(404).json({ success: false, message: "Commande introuvable." });
    if (check.rows[0].statut !== "en_attente") return res.status(400).json({ success: false, message: "Impossible d'annuler cette commande." });

    await db.query("BEGIN");
    await db.query(`UPDATE commande_vente SET statut = 'annulée' WHERE id = $1`, [id]);

    const lignes = await db.query(`SELECT id_produit_entreprise, quantite FROM detail_commande_vente WHERE id_commande_vente = $1`, [id]);
    for (const l of lignes.rows) {
      await db.query(`UPDATE produit_entreprise SET quantite = quantite + $1 WHERE id = $2`, [l.quantite, l.id_produit_entreprise]);
    }

    await db.query("COMMIT");
    return res.json({ success: true });
  } catch (err) {
    await db.query("ROLLBACK").catch(() => {});
    console.error("[cancelCommande]", err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    db.release();
  }
};

// ─────────────────────────────────────────────
// VALIDER → crée automatiquement la facture de vente
// ─────────────────────────────────────────────
const validerCommande = async (req, res) => {
  const { id } = req.params;
  const db     = await pool.connect();

  try {
    await db.query("BEGIN");

    // 1. Vérifier la commande
    const cmdRes = await db.query(`SELECT * FROM commande_vente WHERE id = $1`, [id]);
    if (!cmdRes.rows.length) {
      await db.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Commande introuvable." });
    }

    const cmd = cmdRes.rows[0];
    if (cmd.statut !== "en_attente") {
      await db.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "Commande déjà traitée." });
    }

    // 2. Marquer la commande comme validée
    await db.query(
      `UPDATE commande_vente SET statut = 'validée', date_validation = NOW() WHERE id = $1`,
      [id]
    );

    // 3. Récupérer les lignes de la commande
    const lignesRes = await db.query(
      `SELECT * FROM detail_commande_vente WHERE id_commande_vente = $1`,
      [id]
    );
    const lignes = lignesRes.rows;

    // 4. Générer le numéro de facture
    const numFactureRes = await db.query(
      `SELECT COALESCE(MAX(CAST(NULLIF(regexp_replace(num_facture, '[^0-9]', '', 'g'), '') AS INTEGER)), 0) + 1 AS next
       FROM facture_vente`
    );
    const nextNum   = numFactureRes.rows[0].next;
    const numFac    = `FAC-${String(nextNum).padStart(6, "0")}`;

    // 4b. Si id_societe est null sur la commande, prendre la première société disponible
    let idSociete = cmd.id_societe;
    if (!idSociete) {
      const socRes = await db.query(`SELECT id FROM societe LIMIT 1`);
      if (!socRes.rows.length) {
        await db.query("ROLLBACK");
        return res.status(500).json({ success: false, message: "Aucune société trouvée dans la base." });
      }
      idSociete = socRes.rows[0].id;
    }

    // 5. Créer la facture de vente
    const factureRes = await db.query(`
      INSERT INTO facture_vente (
        id_commande_vente, id_client, id_societe,
        id_commercial, id_comptable,
        num_facture, trimestre, type_en,
        total_ht, tva, fodec, total_ttc,
        score_ia_confiance, alerte_fraude_ia,
        statut, status_electronique,
        identifiant_global_unique, date_creation
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14,
        'brouillon', NULL,
        gen_random_uuid(), NOW()
      ) RETURNING *
    `, [
      cmd.id,
      cmd.id_client,
      idSociete,
      cmd.id_commercial,
      req.user?.id || cmd.id_comptable,
      numFac,
      cmd.trimestre,
      cmd.type_en,
      cmd.total_ht,
      cmd.tva,
      cmd.fodec,
      cmd.total_ttc,
      cmd.score_ia_confiance,
      cmd.alerte_fraude_ia,
    ]);

    const newFacture = factureRes.rows[0];

    // 6. Copier les lignes commande → lignes facture
    for (const ligne of lignes) {
      await db.query(`
        INSERT INTO detail_facture_vente (id_facture_vente, id_produit_entreprise, quantite, prix_unitaire_ht_ap)
        VALUES ($1, $2, $3, $4)
      `, [newFacture.id, ligne.id_produit_entreprise, ligne.quantite, ligne.prix_unitaire_ht_ap]);
    }

    await db.query("COMMIT");

    await logActivity(db, {
      id_utilisateur: req.user?.id || null,
      action: "VALIDER_COMMANDE",
      description: `Commande #${id} validée → Facture ${numFac} créée (#${newFacture.id})`,
    });

    return res.json({
      success: true,
      message: `Commande validée. Facture ${numFac} créée.`,
      data: { facture: newFacture },
    });

  } catch (err) {
    await db.query("ROLLBACK").catch(() => {});
    console.error("[validerCommande]", err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    db.release();
  }
};

module.exports = {
  getAllCommandes,
  getMesCommandes,
  getCommandeById,
  createCommande,
  validerCommande,
  cancelCommande,
};