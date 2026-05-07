const pool = require("../config/db");
const PDFDocument = require("pdfkit");

const logActivity = async (client, { id_utilisateur, action, description }) => {
  await client.query(
    `INSERT INTO log_activite (id_utilisateur, action, description, date_heure)
     VALUES ($1, $2, $3, NOW())`,
    [id_utilisateur, action, description],
  );
};

// ─────────────────────────────────────────────
// NOTIFICATION HELPER
// ─────────────────────────────────────────────
const createNotification = async (client, { type, message, id_commande_achat = null, id_facture_achat = null }) => {
  try {
    await client.query(
      `INSERT INTO notification (type, message, id_commande_achat, id_facture_achat, is_read, created_at)
       VALUES ($1, $2, $3, $4, false, NOW())`,
      [type, message, id_commande_achat, id_facture_achat]
    );
  } catch (err) {
    console.error("[createNotification]", err.message);
  }
};

// ─────────────────────────────────────────────
// GET ALL PURCHASE ORDERS (ADMIN)
// ─────────────────────────────────────────────
const getAllCommandesAchat = async (req, res) => {
  const db = await pool.connect();
  try {
    const result = await db.query(`
      SELECT
        ca.id, ca.num_ordre, ca.type_en, ca.statut, ca.total_ht,
        ca.date_creation, ca.date_envoi, ca.date_acceptation,
        ca.date_livraison, ca.date_archivage, ca.id_admin,
        u_admin.nom AS admin_nom, u_admin.prenom AS admin_prenom,
        ca.id_fournisseur,
        u_four.nom AS fournisseur_nom, u_four.prenom AS fournisseur_prenom,
        f.nom_societe AS fournisseur_societe
      FROM commande_achat ca
      LEFT JOIN utilisateur u_admin ON u_admin.id = ca.id_admin
      LEFT JOIN fournisseur f ON f.id_utilisateur = ca.id_fournisseur
      LEFT JOIN utilisateur u_four ON u_four.id = f.id_utilisateur
      ORDER BY ca.date_creation DESC
    `);
    await logActivity(db, {
      id_utilisateur: req.user?.id || null,
      action: "CONSULTER_COMMANDES_ACHAT",
      description: `Liste commandes d'achat (${result.rows.length})`,
    });
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("[getAllCommandesAchat]", err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    db.release();
  }
};

// ─────────────────────────────────────────────
// GET COMMANDES BY FOURNISSEUR
// ─────────────────────────────────────────────
const getCommandesByFournisseur = async (req, res) => {
  const { id_fournisseur } = req.params;
  const db = await pool.connect();
  try {
    if (req.user.role === "FOURNISSEUR" && String(req.user.id) !== String(id_fournisseur)) {
      return res.status(403).json({ success: false, message: "Accès refusé." });
    }
    const result = await db.query(
      `SELECT ca.id, ca.num_ordre, ca.type_en, ca.statut, ca.total_ht,
        ca.date_creation, ca.date_envoi, ca.date_acceptation,
        ca.date_livraison, ca.date_archivage, ca.id_admin,
        u_admin.nom AS admin_nom, u_admin.prenom AS admin_prenom,
        ca.id_fournisseur,
        u_four.nom AS fournisseur_nom, u_four.prenom AS fournisseur_prenom,
        f.nom_societe AS fournisseur_societe
      FROM commande_achat ca
      LEFT JOIN utilisateur u_admin ON u_admin.id = ca.id_admin
      LEFT JOIN fournisseur f ON f.id_utilisateur = ca.id_fournisseur
      LEFT JOIN utilisateur u_four ON u_four.id = f.id_utilisateur
      WHERE ca.id_fournisseur = $1
      ORDER BY ca.date_creation DESC`,
      [id_fournisseur],
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("[getCommandesByFournisseur]", err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    db.release();
  }
};

// ─────────────────────────────────────────────
// GET MY ORDERS (FOURNISSEUR ONLY)
// ─────────────────────────────────────────────
const getMesCommandes = async (req, res) => {
  const db = await pool.connect();
  try {
    if (req.user.role !== "FOURNISSEUR") {
      return res.status(403).json({ success: false, message: "Accès réservé aux fournisseurs." });
    }
    const result = await db.query(
      `SELECT ca.id, ca.num_ordre, ca.type_en, ca.statut, ca.total_ht,
        fa.total_ttc, fa.tva, fa.fodec,
        ca.date_creation, ca.date_envoi, ca.date_acceptation,
        ca.date_livraison, ca.date_archivage, ca.id_admin,
        u_admin.nom AS admin_nom, u_admin.prenom AS admin_prenom,
        ca.id_fournisseur,
        u_four.nom AS fournisseur_nom, u_four.prenom AS fournisseur_prenom,
        f.nom_societe AS fournisseur_societe,
        (SELECT COUNT(*)::int FROM detail_commande_achat dca WHERE dca.id_commande_achat = ca.id) AS items_count
      FROM commande_achat ca
      LEFT JOIN utilisateur u_admin ON u_admin.id = ca.id_admin
      LEFT JOIN fournisseur f ON f.id_utilisateur = ca.id_fournisseur
      LEFT JOIN utilisateur u_four ON u_four.id = f.id_utilisateur
      LEFT JOIN facture_achat fa ON fa.id_commande_achat = ca.id
      WHERE ca.id_fournisseur = $1
      ORDER BY ca.date_creation DESC`,
      [req.user.id],
    );
    await logActivity(db, {
      id_utilisateur: req.user.id,
      action: "CONSULTER_MES_COMMANDES",
      description: `Consultation commandes fournisseur (${result.rows.length})`,
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
// GET PURCHASE ORDER BY ID
// ─────────────────────────────────────────────
const getCommandeAchatById = async (req, res) => {
  const { id } = req.params;
  const db = await pool.connect();
  try {
    const cmdResult = await db.query(
      `SELECT ca.*, u_admin.nom AS admin_nom, u_admin.prenom AS admin_prenom,
        u_four.nom AS fournisseur_nom, u_four.prenom AS fournisseur_prenom,
        f.nom_societe AS fournisseur_societe
      FROM commande_achat ca
      LEFT JOIN utilisateur u_admin ON u_admin.id = ca.id_admin
      LEFT JOIN fournisseur f ON f.id_utilisateur = ca.id_fournisseur
      LEFT JOIN utilisateur u_four ON u_four.id = f.id_utilisateur
      WHERE ca.id = $1`,
      [id],
    );
    if (cmdResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Commande d'achat introuvable" });
    }
    const commande = cmdResult.rows[0];
    if (req.user.role === "FOURNISSEUR" && String(req.user.id) !== String(commande.id_fournisseur)) {
      return res.status(403).json({ success: false, message: "Accès refusé." });
    }
    const detailsResult = await db.query(
      `SELECT dca.*, pf.nom_produit_f AS produit_fournisseur_nom,
        pf.prix_unitaire_ht, pf.taux_tva, pf.taux_fodec, pf.taux_dc,
        (dca.quantite * dca.prix_unitaire_ht) AS total_ht_ligne
      FROM detail_commande_achat dca
      LEFT JOIN produit_fournisseur pf ON pf.id = dca.id_produit_fournisseur
      WHERE dca.id_commande_achat = $1`,
      [id],
    );
    return res.json({ success: true, data: { commande, details: detailsResult.rows } });
  } catch (err) {
    console.error("[getCommandeAchatById]", err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    db.release();
  }
};

// ─────────────────────────────────────────────
// CREATE PURCHASE ORDER (ADMIN only)
// ─────────────────────────────────────────────
const createCommandeAchat = async (req, res) => {
  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    const { id_fournisseur, num_ordre = null, type_en = "DF", details = [] } = req.body;
    const id_admin = req.user?.id;
    const id_societe = 1;

    if (!id_admin) { await db.query("ROLLBACK"); return res.status(401).json({ success: false, message: "Authentification requise." }); }
    if (!id_fournisseur) { await db.query("ROLLBACK"); return res.status(400).json({ success: false, message: "id_fournisseur est requis." }); }
    if (!Array.isArray(details) || details.length === 0) { await db.query("ROLLBACK"); return res.status(400).json({ success: false, message: "Le panier doit contenir au moins une ligne." }); }

    const fournisseurCheck = await db.query(
      `SELECT f.id_utilisateur, u.est_actif FROM fournisseur f JOIN utilisateur u ON u.id = f.id_utilisateur WHERE f.id_utilisateur = $1`,
      [id_fournisseur],
    );
    if (!fournisseurCheck.rows.length) { await db.query("ROLLBACK"); return res.status(404).json({ success: false, message: "Fournisseur introuvable." }); }
    if (!fournisseurCheck.rows[0].est_actif) { await db.query("ROLLBACK"); return res.status(403).json({ success: false, message: "Fournisseur inactif." }); }

    let nextOrder = num_ordre;
    if (!nextOrder) {
      const orderSeqRes = await db.query(
        `SELECT COALESCE(MAX(num_ordre), 0) + 1 AS next_order FROM commande_achat WHERE id_fournisseur = $1`,
        [id_fournisseur],
      );
      nextOrder = orderSeqRes.rows[0].next_order;
    }

    let total_ht = 0;
    const lignes = [];
    for (const line of details) {
      const productId = line.id_produit_fournisseur;
      if (!productId) { await db.query("ROLLBACK"); return res.status(400).json({ success: false, message: "Chaque ligne doit contenir un id_produit_fournisseur." }); }
      const productRes = await db.query(`SELECT * FROM produit_fournisseur WHERE id = $1`, [productId]);
      if (!productRes.rows.length) { await db.query("ROLLBACK"); return res.status(400).json({ success: false, message: `Produit fournisseur introuvable id=${productId}.` }); }
      const prod = productRes.rows[0];
      const quantite = Number(line.quantite) || 0;
      const prix_unitaire_ht = Number(line.prix_unitaire_ht ?? prod.prix_unitaire_ht) || 0;
      if (quantite <= 0 || prix_unitaire_ht < 0) { await db.query("ROLLBACK"); return res.status(400).json({ success: false, message: "Quantité et prix doivent être positifs." }); }
      total_ht += quantite * prix_unitaire_ht;
      lignes.push({ productId, quantite, prix_unitaire_ht });
    }

    const insertResult = await db.query(
      `INSERT INTO commande_achat (id_admin, id_fournisseur, id_societe, num_ordre, type_en, statut, total_ht, date_creation)
       VALUES ($1,$2,$3,$4,$5,'en attente',$6,NOW()) RETURNING *`,
      [id_admin, id_fournisseur, id_societe, nextOrder, type_en, total_ht],
    );
    const newCommande = insertResult.rows[0];

    for (const line of lignes) {
      await db.query(
        `INSERT INTO detail_commande_achat (id_commande_achat, id_produit_fournisseur, quantite, prix_unitaire_ht) VALUES ($1,$2,$3,$4)`,
        [newCommande.id, line.productId, line.quantite, line.prix_unitaire_ht],
      );
    }

    await logActivity(db, {
      id_utilisateur: id_admin,
      action: "CREER_COMMANDE_ACHAT",
      description: `Commande #${newCommande.id} créée`,
    });

    await db.query("COMMIT");
    return res.status(201).json({ success: true, data: newCommande });
  } catch (err) {
    await db.query("ROLLBACK");
    console.error("[createCommandeAchat]", err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    db.release();
  }
};

// ─────────────────────────────────────────────
// CANCEL PURCHASE ORDER
// ─────────────────────────────────────────────
const cancelCommandeAchat = async (req, res) => {
  const { id } = req.params;
  const db = await pool.connect();
  try {
    const cmd = await db.query(`SELECT statut, id_fournisseur FROM commande_achat WHERE id = $1`, [id]);
    if (!cmd.rows.length) return res.status(404).json({ success: false, message: "Commande d'achat introuvable." });
    if (req.user.role === "FOURNISSEUR" && String(req.user.id) !== String(cmd.rows[0].id_fournisseur)) {
      return res.status(403).json({ success: false, message: "Accès refusé." });
    }
    if (cmd.rows[0].statut === "acceptée") {
      return res.status(400).json({ success: false, message: "Impossible d'annuler une commande acceptée." });
    }

    await db.query(`UPDATE commande_achat SET statut = 'refusée' WHERE id = $1`, [id]);

    await logActivity(db, {
      id_utilisateur: req.user?.id || null,
      action: "REFUSER_COMMANDE_ACHAT",
      description: `Commande #${id} refusée`,
    });

    // ── Notification: commande refusée ──
    await createNotification(db, {
      type: "COMMANDE_REFUSEE",
      message: `La commande #${id} a été refusée par le fournisseur.`,
      id_commande_achat: parseInt(id),
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("[cancelCommandeAchat]", err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    db.release();
  }
};

// ─────────────────────────────────────────────
// VALIDATE PURCHASE ORDER
// ─────────────────────────────────────────────
const validerCommandeAchat = async (req, res) => {
  const { id } = req.params;
  const { date_livraison } = req.body;
  const db = await pool.connect();
  try {
    if (!date_livraison) {
      return res.status(400).json({ success: false, message: "La date de livraison est obligatoire pour accepter une commande." });
    }
    const parsedDate = new Date(date_livraison);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ success: false, message: "Date de livraison invalide." });
    }
    if (parsedDate <= new Date()) {
      return res.status(400).json({ success: false, message: "La date de livraison doit être dans le futur." });
    }

    const cmd = await db.query(`SELECT statut, id_fournisseur FROM commande_achat WHERE id = $1`, [id]);
    if (!cmd.rows.length) return res.status(404).json({ success: false, message: "Commande d'achat introuvable." });
    if (req.user.role === "FOURNISSEUR" && String(req.user.id) !== String(cmd.rows[0].id_fournisseur)) {
      return res.status(403).json({ success: false, message: "Accès refusé." });
    }
    if (cmd.rows[0].statut === "acceptée") {
      return res.status(400).json({ success: false, message: "Commande déjà acceptée." });
    }

    const updated = await db.query(
      `UPDATE commande_achat SET statut = 'acceptée', date_acceptation = NOW(), date_livraison = $2 WHERE id = $1 RETURNING *`,
      [id, date_livraison],
    );

    await logActivity(db, {
      id_utilisateur: req.user?.id || null,
      action: "VALIDER_COMMANDE_ACHAT",
      description: `Commande #${id} acceptée — livraison prévue le ${date_livraison}`,
    });

    // ── Notification: commande acceptée ──
    await createNotification(db, {
      type: "COMMANDE_ACCEPTEE",
      message: `La commande #${id} a été acceptée. Livraison prévue le ${new Date(date_livraison).toLocaleDateString("fr-FR")}.`,
      id_commande_achat: parseInt(id),
    });

    return res.json({ success: true, data: updated.rows[0] });
  } catch (err) {
    console.error("[validerCommandeAchat]", err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    db.release();
  }
};

// ─────────────────────────────────────────────
// MARQUER LIVRAISON (ADMIN) → crée facture si livrée
// ─────────────────────────────────────────────
const marquerLivraison = async (req, res) => {
  const { id } = req.params;
  const { livree } = req.body;
  const db = await pool.connect();
  try {
    if (typeof livree !== "boolean") {
      return res.status(400).json({ success: false, message: "Le champ 'livree' (booléen) est obligatoire." });
    }

    await db.query("BEGIN");

    const cmdRes = await db.query(`SELECT * FROM commande_achat WHERE id = $1`, [id]);
    if (!cmdRes.rows.length) {
      await db.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Commande d'achat introuvable." });
    }
    const commande = cmdRes.rows[0];

    if (commande.statut !== "acceptée") {
      await db.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "Seule une commande acceptée peut être marquée comme livrée ou non." });
    }

    if (commande.date_livraison) {
      const dateLivraisonPrevue = new Date(commande.date_livraison);
      if (new Date() < dateLivraisonPrevue) {
        await db.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: `Livraison impossible avant la date prévue (${dateLivraisonPrevue.toLocaleDateString("fr-FR")}).`,
        });
      }
    }

    // ── Non livrée → refusée ──
    if (!livree) {
      await db.query(`UPDATE commande_achat SET statut = 'refusée' WHERE id = $1`, [id]);
      await logActivity(db, { id_utilisateur: req.user?.id || null, action: "MARQUER_NON_LIVREE", description: `Commande #${id} marquée non livrée` });

      await createNotification(db, {
        type: "COMMANDE_NON_LIVREE",
        message: `La commande #${id} a été marquée comme non livrée.`,
        id_commande_achat: parseInt(id),
      });

      await db.query("COMMIT");
      return res.json({ success: true, message: "Commande marquée non livrée." });
    }

    // ── Vérifier qu'une facture n'existe pas déjà ──
    const factureExist = await db.query(`SELECT id FROM facture_achat WHERE id_commande_achat = $1`, [id]);
    if (factureExist.rows.length) {
      await db.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "Une facture existe déjà pour cette commande." });
    }

    // ── Calcul des totaux ──
    const detailsRes = await db.query(
      `SELECT dca.id_produit_fournisseur, dca.quantite, dca.prix_unitaire_ht,
         COALESCE(pf.taux_tva, 0) AS taux_tva, COALESCE(pf.taux_fodec, 0) AS taux_fodec
       FROM detail_commande_achat dca
       LEFT JOIN produit_fournisseur pf ON pf.id = dca.id_produit_fournisseur
       WHERE dca.id_commande_achat = $1`,
      [id]
    );

    let total_ht = 0, total_tva = 0, total_fodec = 0;
    for (const row of detailsRes.rows) {
      const ht    = Number(row.quantite) * Number(row.prix_unitaire_ht);
      const fodec = ht * (Number(row.taux_fodec) / 100);
      const tva   = (ht + fodec) * (Number(row.taux_tva) / 100);
      total_ht += ht; total_fodec += fodec; total_tva += tva;
    }
    const total_ttc = total_ht + total_fodec + total_tva;

    // ── Numéro de facture ──
    const seqRes = await db.query(
      `SELECT COUNT(*)::int AS cnt FROM facture_achat WHERE EXTRACT(YEAR FROM date_creation) = EXTRACT(YEAR FROM NOW())`
    );
    const seq         = (seqRes.rows[0].cnt + 1).toString().padStart(5, "0");
    const year        = new Date().getFullYear();
    const num_facture = `FAC-${year}-${seq}`;
    const month       = new Date().getMonth() + 1;
    const trimestre   = `T${Math.ceil(month / 3)}-${year}`;
    const dateEcheance = new Date();
    dateEcheance.setDate(dateEcheance.getDate() + 30);

    // ── Insérer la facture ──
    const factureRes = await db.query(
      `INSERT INTO facture_achat
         (identifiant_global_unique, id_commande_achat, id_fournisseur, id_societe,
          num_facture, trimestre, statut, total_ht, tva, fodec, total_ttc,
          date_creation, date_reception, date_echeance)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'non_payée', $6, $7, $8, $9, NOW(), NOW(), $10)
       RETURNING *`,
      [id, commande.id_fournisseur, commande.id_societe, num_facture, trimestre,
       total_ht.toFixed(2), total_tva.toFixed(2), total_fodec.toFixed(2), total_ttc.toFixed(2), dateEcheance]
    );
    const newFacture = factureRes.rows[0];

    // ── Détails facture ──
    for (const row of detailsRes.rows) {
      await db.query(
        `INSERT INTO detail_facture_achat (id_facture_achat, id_produit_fournisseur, quantite, prix_unitaire_ht)
         VALUES ($1, $2, $3, $4)`,
        [newFacture.id, row.id_produit_fournisseur, row.quantite, Number(row.prix_unitaire_ht).toFixed(2)]
      );
    }

    // ── AUTO-RESTOCK : si le produit est déjà au catalogue (produit_entreprise),
    //    on ajoute automatiquement la quantité livrée à son stock.
    //    Si le produit n'est pas encore importé, on ne fait rien — l'admin
    //    l'importera manuellement depuis l'interface "Importer depuis facture".
    for (const row of detailsRes.rows) {
      const qte = parseInt(row.quantite) || 0;
      if (qte <= 0) continue;
      await db.query(
        `UPDATE produit_entreprise
            SET quantite   = quantite + $1,
                updated_at = NOW()
          WHERE id_produit_f = $2`,
        [qte, row.id_produit_fournisseur]
      );
    }

    // ── Vérifier stock faible pour chaque produit de la commande
    //    (après le restock, donc on voit le stock à jour) ──
    for (const row of detailsRes.rows) {
      const peRes = await db.query(
        `SELECT id, nom_commercial, quantite FROM produit_entreprise WHERE id_produit_f = $1`,
        [row.id_produit_fournisseur]
      );
      for (const pe of peRes.rows) {
        const qty = parseInt(pe.quantite) || 0;
        if (qty === 0) {
          await createNotification(db, {
            type: "STOCK_RUPTURE",
            message: `Rupture de stock : "${pe.nom_commercial}" — plus aucune unité disponible.`,
          });
        } else if (qty <= 5) {
          await createNotification(db, {
            type: "STOCK_FAIBLE",
            message: `Stock faible : "${pe.nom_commercial}" — seulement ${qty} unité(s) restante(s).`,
          });
        }
      }
    }

    // ── Mettre à jour statut commande ──
    await db.query(`UPDATE commande_achat SET statut = 'livrée' WHERE id = $1`, [id]);

    await logActivity(db, {
      id_utilisateur: req.user?.id || null,
      action: "MARQUER_LIVREE_FACTURE",
      description: `Commande #${id} livrée — Facture ${num_facture} créée (TTC: ${total_ttc.toFixed(2)})`,
    });

    // ── Notification: nouvelle facture créée ──
    await createNotification(db, {
      type: "FACTURE_CREEE",
      message: `Nouvelle facture ${num_facture} créée automatiquement suite à la livraison de la commande #${id}. Total TTC : ${total_ttc.toFixed(2)} DT.`,
      id_commande_achat: parseInt(id),
      id_facture_achat:  newFacture.id,
    });

    await db.query("COMMIT");
    return res.status(201).json({ success: true, message: "Commande marquée livrée et facture créée.", data: { facture: newFacture } });
  } catch (err) {
    await db.query("ROLLBACK");
    console.error("[marquerLivraison]", err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    db.release();
  }
};
// ─────────────────────────────────────────────
// EXPORT PDF — BON DE COMMANDE
// ─────────────────────────────────────────────
const getCommandePdf = async (req, res) => {
  const { id } = req.params;
  const db = await pool.connect();
  try {
    // ── Récupérer commande + société + détails ──
    const cmdRes = await db.query(
      `SELECT ca.*,
              u_admin.nom AS admin_nom, u_admin.prenom AS admin_prenom,
              u_four.nom  AS fournisseur_nom, u_four.prenom AS fournisseur_prenom,
              u_four.email AS fournisseur_email,
              f.nom_societe     AS fournisseur_societe,
              f.adresse_siege   AS fournisseur_adresse,
              f.matricule_fiscal AS fournisseur_mf,
              f.secteur_activite AS fournisseur_secteur,
              s.raison_sociale   AS societe_nom,
              s.activite         AS forme_juridique,
              s.matricule_fiscal,
              s.categorie        AS code_categorie,
              s.num_etablissement AS code_etablissement,
              s.rue       AS societe_adresse,
              s.num       AS societe_numero,
              s.ville     AS societe_ville,
              s.code_postal AS societe_cp,
              s.email     AS societe_email,
              s.num_tlp    AS societe_tel
       FROM commande_achat ca
       LEFT JOIN utilisateur u_admin ON u_admin.id = ca.id_admin
       LEFT JOIN fournisseur f       ON f.id_utilisateur = ca.id_fournisseur
       LEFT JOIN utilisateur u_four  ON u_four.id = f.id_utilisateur
       LEFT JOIN societe s           ON s.id = ca.id_societe
       WHERE ca.id = $1`,
      [id]
    );
    if (!cmdRes.rows.length) {
      return res.status(404).json({ success: false, message: "Commande introuvable." });
    }
    const cmd = cmdRes.rows[0];

    // ── Sécurité : un fournisseur ne voit que ses commandes ──
    if (req.user.role === "FOURNISSEUR" && String(req.user.id) !== String(cmd.id_fournisseur)) {
      return res.status(403).json({ success: false, message: "Accès refusé." });
    }

    const detRes = await db.query(
      `SELECT dca.*, pf.nom_produit_f, pf.taux_tva, pf.taux_fodec
       FROM detail_commande_achat dca
       LEFT JOIN produit_fournisseur pf ON pf.id = dca.id_produit_fournisseur
       WHERE dca.id_commande_achat = $1
       ORDER BY dca.id`,
      [id]
    );
    const lignes = detRes.rows;

    // ── Calcul totaux (même formule que marquerLivraison) ──
    let total_ht = 0, total_fodec = 0, total_tva = 0;
    for (const l of lignes) {
      const ht    = Number(l.quantite) * Number(l.prix_unitaire_ht);
      const fodec = ht * (Number(l.taux_fodec || 0) / 100);
      const tva   = (ht + fodec) * (Number(l.taux_tva || 0) / 100);
      total_ht    += ht;
      total_fodec += fodec;
      total_tva   += tva;
    }
    const total_ttc = total_ht + total_fodec + total_tva;

    // ── Helpers format ──
    const fmt   = n => `${(Number(n) || 0).toFixed(3)} DT`;
    const fmtD  = d => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

    // ── PDF setup ──
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="commande-${cmd.num_ordre || cmd.id}.pdf"`);
    doc.pipe(res);

    // ── Couleurs ──
    const C_DARK = "#0F172A", C_MUTED = "#64748B", C_BORDER = "#E2E8F0", C_ACCENT = "#0F766E", C_BG = "#F8FAFC";

    // ============ EN-TÊTE SOCIÉTÉ ============
    const matricule = [cmd.matricule_fiscal, cmd.code_categorie, cmd.code_etablissement].filter(Boolean).join("/");
    doc.font("Helvetica-Bold").fontSize(18).fillColor(C_DARK).text(cmd.societe_nom || "Société", 40, 40);
    doc.font("Helvetica").fontSize(9).fillColor(C_MUTED);
    if (cmd.forme_juridique) doc.text(cmd.forme_juridique, 40, 62);
    doc.text(`${cmd.societe_numero || ""} ${cmd.societe_adresse || ""}`.trim(), 40, 75);
    doc.text(`${cmd.societe_cp || ""} ${cmd.societe_ville || ""}`.trim(), 40, 88);
    if (cmd.societe_tel)   doc.text(`Tél : ${cmd.societe_tel}`, 40, 101);
    if (cmd.societe_email) doc.text(`Email : ${cmd.societe_email}`, 40, 114);
    if (matricule)         doc.text(`MF : ${matricule}`, 40, 127);

    // ── Bloc titre commande à droite ──
    doc.roundedRect(380, 40, 175, 100, 6).fillAndStroke(C_BG, C_BORDER);
    doc.font("Helvetica-Bold").fontSize(14).fillColor(C_ACCENT).text("BON DE COMMANDE", 395, 52, { width: 145 });
    doc.font("Helvetica").fontSize(9).fillColor(C_MUTED);
    doc.text(`N° interne : ${cmd.id}`, 395, 75);
    doc.text(`N° ordre : ${cmd.num_ordre || "—"}`, 395, 88);
    doc.text(`Type : ${cmd.type_en || "—"}`, 395, 101);
    doc.text(`Date : ${fmtD(cmd.date_creation)}`, 395, 114);
    doc.font("Helvetica-Bold").fontSize(9).fillColor(C_DARK).text(`Statut : ${cmd.statut}`, 395, 127);

    // ============ DESTINATAIRE (FOURNISSEUR) ============
    const yDest = 165;
    doc.font("Helvetica-Bold").fontSize(10).fillColor(C_MUTED).text("FOURNISSEUR", 40, yDest);
    doc.roundedRect(40, yDest + 14, 515, 90, 6).fillAndStroke(C_BG, C_BORDER);

    doc.font("Helvetica-Bold").fontSize(12).fillColor(C_DARK).text(cmd.fournisseur_societe || "—", 55, yDest + 26);
    doc.font("Helvetica").fontSize(9).fillColor(C_MUTED);
    const four = `${cmd.fournisseur_prenom || ""} ${cmd.fournisseur_nom || ""}`.trim();
    if (four)                    doc.text(four, 55, yDest + 44);
    if (cmd.fournisseur_adresse) doc.text(cmd.fournisseur_adresse, 55, yDest + 57);
    if (cmd.fournisseur_email)   doc.text(`Email : ${cmd.fournisseur_email}`, 55, yDest + 70);
    if (cmd.fournisseur_mf)      doc.text(`MF : ${cmd.fournisseur_mf}`, 55, yDest + 83);

    // ── Dates ──
    if (cmd.date_acceptation || cmd.date_livraison) {
      doc.font("Helvetica").fontSize(9).fillColor(C_MUTED);
      let xDate = 320;
      if (cmd.date_acceptation) { doc.text(`Acceptée : ${fmtD(cmd.date_acceptation)}`, xDate, yDest + 44); }
      if (cmd.date_livraison)   { doc.text(`Livraison : ${fmtD(cmd.date_livraison)}`,   xDate, yDest + 57); }
    }

    // ============ TABLEAU DES LIGNES ============
    let y = yDest + 125;
    const cols = [
      { x: 40,  w: 230, label: "Produit",       align: "left"  },
      { x: 270, w: 50,  label: "Qté",           align: "right" },
      { x: 320, w: 75,  label: "PU HT",         align: "right" },
      { x: 395, w: 45,  label: "TVA",           align: "right" },
      { x: 440, w: 45,  label: "FODEC",         align: "right" },
      { x: 485, w: 70,  label: "Sous-total HT", align: "right" },
    ];

    // Header
    doc.rect(40, y, 515, 22).fill(C_ACCENT);
    doc.font("Helvetica-Bold").fontSize(9).fillColor("white");
    cols.forEach(c => doc.text(c.label, c.x + 5, y + 7, { width: c.w - 10, align: c.align }));
    y += 22;

    // Lignes
    doc.font("Helvetica").fontSize(9).fillColor(C_DARK);
    lignes.forEach((l, i) => {
      // Saut de page si besoin
      if (y > 720) {
        doc.addPage();
        y = 50;
      }
      if (i % 2 === 0) {
        doc.rect(40, y, 515, 20).fill(C_BG);
        doc.fillColor(C_DARK);
      }
      const qte  = Number(l.quantite) || 0;
      const pu   = Number(l.prix_unitaire_ht) || 0;
      const sub  = qte * pu;
      const row = [
        l.nom_produit_f || `Produit #${l.id_produit_fournisseur}`,
        qte.toString(),
        fmt(pu),
        `${l.taux_tva || 0}%`,
        `${l.taux_fodec || 0}%`,
        fmt(sub),
      ];
      doc.font("Helvetica").fontSize(9).fillColor(C_DARK);
      cols.forEach((c, j) => doc.text(row[j], c.x + 5, y + 6, { width: c.w - 10, align: c.align }));
      y += 20;
    });

    // ============ RÉCAP TOTAUX ============
    y += 15;
    if (y > 700) { doc.addPage(); y = 50; }

    const recapX = 340, recapW = 215;
    doc.roundedRect(recapX, y, recapW, 95, 6).fillAndStroke(C_BG, C_BORDER);

    const recapLine = (label, value, bold = false, big = false) => {
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(big ? 12 : 10).fillColor(bold ? C_DARK : C_MUTED);
      doc.text(label, recapX + 12, y + 8, { width: 90, align: "left" });
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fillColor(bold ? C_ACCENT : C_DARK);
      doc.text(value, recapX + 105, y + 8, { width: recapW - 117, align: "right" });
      y += big ? 24 : 20;
    };
    recapLine("Total HT", fmt(total_ht));
    recapLine("FODEC",    fmt(total_fodec));
    recapLine("TVA",      fmt(total_tva));
    doc.moveTo(recapX + 12, y + 4).lineTo(recapX + recapW - 12, y + 4).strokeColor(C_BORDER).stroke();
    y += 8;
    recapLine("TOTAL TTC", fmt(total_ttc), true, true);

    // ============ PIED DE PAGE ============
    const pageH = doc.page.height;
    doc.font("Helvetica").fontSize(8).fillColor(C_MUTED);
    doc.text(`Document généré le ${new Date().toLocaleString("fr-FR")}`, 40, pageH - 50);
    doc.text(`${cmd.societe_nom || ""} — ${cmd.societe_email || ""}`.trim(), 40, pageH - 38, {
      width: 515, align: "center"
    });

    doc.end();

    // Log (best-effort, ne bloque pas le stream)
    try {
      await logActivity(db, {
        id_utilisateur: req.user?.id || null,
        action: "EXPORT_PDF_COMMANDE",
        description: `PDF de la commande #${id} téléchargé`,
      });
    } catch (_) {}
  } catch (err) {
    console.error("[getCommandePdf]", err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: err.message });
    }
  } finally {
    db.release();
  }
};

module.exports = {
  getAllCommandesAchat,
  getCommandesByFournisseur,
  getMesCommandes,
  getCommandeAchatById,
  createCommandeAchat,
  cancelCommandeAchat,
  validerCommandeAchat,
  marquerLivraison,
  getCommandePdf
};