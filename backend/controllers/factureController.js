const pool = require("../config/db");

const logActivity = async (client, { id_utilisateur, action, description }) => {
  await client.query(
    `INSERT INTO log_activite (id_utilisateur, action, description, date_heure) VALUES ($1, $2, $3, NOW())`,
    [id_utilisateur, action, description]
  );
};

const getAllFactures = async (req, res) => {
  const db = await pool.connect();
  try {
    const result = await db.query(`
      SELECT f.id, f.num_facture, f.id_commande_vente, f.trimestre, f.type_en,
        f.statut, f.status_electronique, f.total_ht, f.tva, f.fodec, f.total_ttc,
        f.date_creation, f.date_validation, f.date_envoi, f.date_echeance, f.date_paiement,
        f.score_ia_confiance, f.alerte_fraude_ia, f.id_commercial,
        u_com.nom AS commercial_nom, u_com.prenom AS commercial_prenom,
        f.id_client, c.identifiant AS client_identifiant, c.adresse AS client_adresse, c.ville AS client_ville,
        u_cli.nom AS client_nom, u_cli.prenom AS client_prenom
      FROM facture_vente f
      LEFT JOIN utilisateur u_com ON u_com.id = f.id_commercial
      LEFT JOIN client c ON c.id = f.id_client
      LEFT JOIN utilisateur u_cli ON u_cli.id = c.id_utilisateur
      ORDER BY f.date_creation DESC
    `);
    await logActivity(db, { id_utilisateur: req.user?.id || null, action: "CONSULTER_FACTURES", description: `Liste factures vente (${result.rows.length})` });
    return res.status(200).json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    console.error("getAllFactures error:", err);
    return res.status(500).json({ success: false, message: "Erreur serveur", error: err.message });
  } finally { db.release(); }
};

const getFactureById = async (req, res) => {
  const { id } = req.params;
  const db = await pool.connect();
  try {
    const factureResult = await db.query(`
      SELECT f.*, u_com.nom AS commercial_nom, u_com.prenom AS commercial_prenom,
             c.identifiant AS client_identifiant, c.adresse AS client_adresse, c.ville AS client_ville,
             u_cli.nom AS client_nom, u_cli.prenom AS client_prenom
      FROM facture_vente f
      LEFT JOIN utilisateur u_com ON u_com.id = f.id_commercial
      LEFT JOIN client c ON c.id = f.id_client
      LEFT JOIN utilisateur u_cli ON u_cli.id = c.id_utilisateur
      WHERE f.id = $1
    `, [id]);
    if (!factureResult.rows.length) return res.status(404).json({ success: false, message: "Facture introuvable." });
    const detailsResult = await db.query(`
      SELECT dfv.*, pe.nom_commercial AS nom_produit, pe.taux_tva, pe.taux_fodec, pe.taux_dc,
             (dfv.quantite * dfv.prix_unitaire_ht_ap) AS total_ht_ligne
      FROM detail_facture_vente dfv
      LEFT JOIN produit_entreprise pe ON pe.id = dfv.id_produit_entreprise
      WHERE dfv.id_facture_vente = $1
    `, [id]);
    await logActivity(db, { id_utilisateur: req.user?.id || null, action: "CONSULTER_FACTURE", description: `Facture vente #${id}` });
    return res.status(200).json({ success: true, data: { facture: factureResult.rows[0], details: detailsResult.rows } });
  } catch (err) {
    console.error("getFactureById error:", err);
    return res.status(500).json({ success: false, message: "Erreur serveur", error: err.message });
  } finally { db.release(); }
};

const createFacture = async (req, res) => {
  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    const { id_client, id_commercial, id_societe, id_comptable, id_commande_vente, num_facture, trimestre, type_en = "DF", details = [] } = req.body;
    if (!id_client || !id_societe) { await db.query("ROLLBACK"); return res.status(400).json({ success: false, message: "id_client et id_societe sont requis." }); }
    if (!details.length) { await db.query("ROLLBACK"); return res.status(400).json({ success: false, message: "Au moins un produit est requis." }); }
    const clientCheck = await db.query(`SELECT c.id, u.est_actif FROM client c JOIN utilisateur u ON c.id_utilisateur = u.id WHERE c.id = $1`, [id_client]);
    if (!clientCheck.rows.length) { await db.query("ROLLBACK"); return res.status(404).json({ success: false, message: "Client introuvable." }); }
    if (!clientCheck.rows[0].est_actif) { await db.query("ROLLBACK"); return res.status(403).json({ success: false, message: "Client inactif." }); }
    let total_ht = 0, total_tva = 0, total_fodec = 0, total_ttc = 0;
    const lignesValidees = [];
    for (const ligne of details) {
      const pRes = await db.query(`SELECT prix_vente_ht, taux_tva, taux_fodec, taux_dc FROM produit_entreprise WHERE id = $1`, [ligne.id_produit]);
      if (!pRes.rows.length) { await db.query("ROLLBACK"); return res.status(400).json({ success: false, message: `Produit id=${ligne.id_produit} introuvable.` }); }
      const p = pRes.rows[0];
      const qty = parseFloat(ligne.quantite) || 0;
      const prix_ht = parseFloat(ligne.prix_unitaire_ht_ap ?? p.prix_vente_ht) || 0;
      const montant_ht = prix_ht * qty;
      const fodec = (montant_ht * (parseFloat(p.taux_fodec) || 0)) / 100;
      const tva = ((montant_ht + fodec) * (parseFloat(p.taux_tva) || 0)) / 100;
      const dc = (montant_ht * (parseFloat(p.taux_dc) || 0)) / 100;
      total_ht += montant_ht; total_fodec += fodec; total_tva += tva; total_ttc += montant_ht + fodec + tva - dc;
      lignesValidees.push({ id_produit: ligne.id_produit, quantite: qty, prix_unitaire_ht_ap: prix_ht });
    }
    const invoiceNumber = num_facture || `FAC-${Date.now()}`;
    const factureRes = await db.query(`
      INSERT INTO facture_vente (id_commande_vente, id_client, id_societe, id_commercial, id_comptable, num_facture, trimestre, type_en, total_ht, tva, fodec, total_ttc, statut, identifiant_global_unique, date_creation)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'brouillon',gen_random_uuid(),NOW()) RETURNING *
    `, [id_commande_vente || null, clientCheck.rows[0].id, id_societe, id_commercial || null, id_comptable || null, invoiceNumber, trimestre || null, type_en, parseFloat(total_ht.toFixed(3)), parseFloat(total_tva.toFixed(2)), parseFloat(total_fodec.toFixed(2)), parseFloat(total_ttc.toFixed(3))]);
    const newFacture = factureRes.rows[0];
    for (const ligne of lignesValidees) {
      await db.query(`INSERT INTO detail_facture_vente (id_facture_vente, id_produit_entreprise, quantite, prix_unitaire_ht_ap) VALUES ($1,$2,$3,$4)`, [newFacture.id, ligne.id_produit, ligne.quantite, ligne.prix_unitaire_ht_ap]);
    }
    await logActivity(db, { id_utilisateur: req.user?.id || id_commercial, action: "CREER_FACTURE", description: `Création facture vente #${newFacture.id}` });
    await db.query("COMMIT");
    return res.status(201).json({ success: true, message: "Facture créée.", data: { facture: newFacture } });
  } catch (err) {
    await db.query("ROLLBACK");
    console.error("createFacture error:", err);
    return res.status(500).json({ success: false, message: "Erreur création.", error: err.message });
  } finally { db.release(); }
};

const emettreFacture = async (req, res) => {
  const { id } = req.params; const db = await pool.connect();
  try {
    await db.query("BEGIN");
    const chk = await db.query("SELECT statut FROM facture_vente WHERE id=$1", [id]);
    if (!chk.rows.length) { await db.query("ROLLBACK"); return res.status(404).json({ success: false, message: "Facture introuvable." }); }
    if (chk.rows[0].statut !== "brouillon") { await db.query("ROLLBACK"); return res.status(400).json({ success: false, message: "Seuls les brouillons peuvent être émis." }); }
    const r = await db.query(`UPDATE facture_vente SET statut='envoyée', date_validation=NOW(), date_envoi=NOW() WHERE id=$1 RETURNING *`, [id]);
    await logActivity(db, { id_utilisateur: req.user?.id || null, action: "EMETTRE_FACTURE", description: `Émission facture #${id}` });
    await db.query("COMMIT");
    return res.status(200).json({ success: true, data: r.rows[0] });
  } catch (err) { await db.query("ROLLBACK"); return res.status(500).json({ success: false, message: err.message }); }
  finally { db.release(); }
};

const payerFacture = async (req, res) => {
  const { id } = req.params; const db = await pool.connect();
  try {
    const chk = await db.query("SELECT statut FROM facture_vente WHERE id=$1", [id]);
    if (!chk.rows.length) return res.status(404).json({ success: false, message: "Facture introuvable." });
    if (chk.rows[0].statut !== "envoyée") return res.status(400).json({ success: false, message: "Seules les factures envoyées peuvent être payées." });
    const r = await db.query(`UPDATE facture_vente SET statut='payée', date_paiement=NOW() WHERE id=$1 RETURNING *`, [id]);
    await logActivity(db, { id_utilisateur: req.user?.id || null, action: "PAYER_FACTURE", description: `Facture #${id} payée` });
    return res.status(200).json({ success: true, data: r.rows[0] });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
  finally { db.release(); }
};

const annulerFacture = async (req, res) => {
  const { id } = req.params; const db = await pool.connect();
  try {
    const chk = await db.query("SELECT statut FROM facture_vente WHERE id=$1", [id]);
    if (!chk.rows.length) return res.status(404).json({ success: false, message: "Facture introuvable." });
    if (chk.rows[0].statut === "payée") return res.status(403).json({ success: false, message: "Impossible d'annuler une facture payée." });
    const r = await db.query(`UPDATE facture_vente SET statut='annulée' WHERE id=$1 RETURNING *`, [id]);
    await logActivity(db, { id_utilisateur: req.user?.id || null, action: "ANNULER_FACTURE", description: `Facture #${id} annulée` });
    return res.status(200).json({ success: true, data: r.rows[0] });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
  finally { db.release(); }
};

// ─────────────────────────────────────────────────────────────────────────────
// FACTURES ACHAT
// fournisseur PK is id_utilisateur (no numeric id column)
// ─────────────────────────────────────────────────────────────────────────────

const getAllFacturesAchat = async (req, res) => {
  const db = await pool.connect();
  try {
    const result = await db.query(`
      SELECT
        fa.id, fa.num_facture, fa.id_commande_achat, fa.trimestre, fa.statut,
        fa.total_ht, fa.tva, fa.fodec, fa.total_ttc,
        fa.date_creation, fa.date_reception, fa.date_echeance, fa.date_paiement,
        fa.id_fournisseur,
        u_f.nom    AS fournisseur_nom,
        u_f.prenom AS fournisseur_prenom,
        u_f.email  AS fournisseur_email
      FROM facture_achat fa
      LEFT JOIN fournisseur  fo  ON fo.id_utilisateur = fa.id_fournisseur
      LEFT JOIN utilisateur  u_f ON u_f.id            = fo.id_utilisateur
      ORDER BY fa.date_creation DESC
    `);
    await logActivity(db, { id_utilisateur: req.user?.id || null, action: "CONSULTER_FACTURES_ACHAT", description: `Liste factures achat (${result.rows.length})` });
    return res.status(200).json({ success: true, count: result.rows.length, data: result.rows });
  } catch (err) {
    console.error("getAllFacturesAchat error:", err);
    return res.status(500).json({ success: false, message: "Erreur serveur", error: err.message });
  } finally { db.release(); }
};

const getFactureAchatById = async (req, res) => {
  const { id } = req.params; const db = await pool.connect();
  try {
    const factureResult = await db.query(`
      SELECT fa.*,
             u_f.nom    AS fournisseur_nom,
             u_f.prenom AS fournisseur_prenom,
             u_f.email  AS fournisseur_email
      FROM facture_achat fa
      LEFT JOIN fournisseur  fo  ON fo.id_utilisateur = fa.id_fournisseur
      LEFT JOIN utilisateur  u_f ON u_f.id            = fo.id_utilisateur
      WHERE fa.id = $1
    `, [id]);
    if (!factureResult.rows.length) return res.status(404).json({ success: false, message: "Facture achat introuvable." });
    const detailsResult = await db.query(`
      SELECT dfa.*, pf.nom_produit_f AS nom_produit, pf.taux_tva, pf.taux_fodec,
             (dfa.quantite * dfa.prix_unitaire_ht) AS total_ht_ligne
      FROM detail_facture_achat dfa
      LEFT JOIN produit_fournisseur pf ON pf.id = dfa.id_produit_fournisseur
      WHERE dfa.id_facture_achat = $1
    `, [id]);
    await logActivity(db, { id_utilisateur: req.user?.id || null, action: "CONSULTER_FACTURE_ACHAT", description: `Facture achat #${id}` });
    return res.status(200).json({ success: true, data: { facture: factureResult.rows[0], details: detailsResult.rows } });
  } catch (err) {
    console.error("getFactureAchatById error:", err);
    return res.status(500).json({ success: false, message: "Erreur serveur", error: err.message });
  } finally { db.release(); }
};

const createFactureAchat = async (req, res) => {
  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    const { id_fournisseur, id_societe, id_comptable, id_commande_achat, num_facture, trimestre, date_echeance, details = [] } = req.body;
    if (!id_fournisseur || !id_societe) { await db.query("ROLLBACK"); return res.status(400).json({ success: false, message: "id_fournisseur et id_societe sont requis." }); }
    if (!details.length) { await db.query("ROLLBACK"); return res.status(400).json({ success: false, message: "Au moins un produit est requis." }); }

    // ✅ FIXED: fournisseur PK is id_utilisateur
    const fCheck = await db.query(`SELECT id_utilisateur FROM fournisseur WHERE id_utilisateur = $1`, [id_fournisseur]);
    if (!fCheck.rows.length) { await db.query("ROLLBACK"); return res.status(404).json({ success: false, message: "Fournisseur introuvable." }); }

    let total_ht = 0, total_tva = 0, total_fodec = 0, total_ttc = 0;
    const lignesValidees = [];
    for (const ligne of details) {
      const pRes = await db.query(`SELECT prix_unitaire_ht, taux_tva, taux_fodec FROM produit_fournisseur WHERE id = $1`, [ligne.id_produit_fournisseur]);
      if (!pRes.rows.length) { await db.query("ROLLBACK"); return res.status(400).json({ success: false, message: `Produit fournisseur id=${ligne.id_produit_fournisseur} introuvable.` }); }
      const p = pRes.rows[0];
      const qty = parseFloat(ligne.quantite) || 0;
      const prix_ht = parseFloat(ligne.prix_unitaire_ht ?? p.prix_unitaire_ht) || 0;
      const montant_ht = prix_ht * qty;
      const fodec = (montant_ht * (parseFloat(p.taux_fodec) || 0)) / 100;
      const tva = ((montant_ht + fodec) * (parseFloat(p.taux_tva) || 0)) / 100;
      total_ht += montant_ht; total_fodec += fodec; total_tva += tva; total_ttc += montant_ht + fodec + tva;
      lignesValidees.push({ id_produit_fournisseur: ligne.id_produit_fournisseur, quantite: qty, prix_unitaire_ht: prix_ht });
    }
    const invoiceNumber = num_facture || `ACH-${Date.now()}`;
    const factureRes = await db.query(`
      INSERT INTO facture_achat (id_commande_achat, id_fournisseur, id_societe, id_comptable, num_facture, trimestre, total_ht, tva, fodec, total_ttc, statut, date_echeance, identifiant_global_unique, date_creation)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'brouillon',$11,gen_random_uuid(),NOW()) RETURNING *
    `, [id_commande_achat || null, id_fournisseur, id_societe, id_comptable || null, invoiceNumber, trimestre || null, parseFloat(total_ht.toFixed(3)), parseFloat(total_tva.toFixed(2)), parseFloat(total_fodec.toFixed(2)), parseFloat(total_ttc.toFixed(3)), date_echeance || null]);
    const newFacture = factureRes.rows[0];
    for (const ligne of lignesValidees) {
      await db.query(`INSERT INTO detail_facture_achat (id_facture_achat, id_produit_fournisseur, quantite, prix_unitaire_ht) VALUES ($1,$2,$3,$4)`, [newFacture.id, ligne.id_produit_fournisseur, ligne.quantite, ligne.prix_unitaire_ht]);
    }
    await logActivity(db, { id_utilisateur: req.user?.id || null, action: "CREER_FACTURE_ACHAT", description: `Création facture achat #${newFacture.id}` });
    await db.query("COMMIT");
    return res.status(201).json({ success: true, message: "Facture achat créée.", data: { facture: newFacture } });
  } catch (err) {
    await db.query("ROLLBACK");
    console.error("createFactureAchat error:", err);
    return res.status(500).json({ success: false, message: "Erreur création.", error: err.message });
  } finally { db.release(); }
};

const recevoirFactureAchat = async (req, res) => {
  const { id } = req.params; const db = await pool.connect();
  try {
    await db.query("BEGIN");
    const chk = await db.query("SELECT statut FROM facture_achat WHERE id=$1", [id]);
    if (!chk.rows.length) { await db.query("ROLLBACK"); return res.status(404).json({ success: false, message: "Facture achat introuvable." }); }
    if (chk.rows[0].statut !== "brouillon") { await db.query("ROLLBACK"); return res.status(400).json({ success: false, message: "Seuls les brouillons peuvent être réceptionnés." }); }
    const r = await db.query(`UPDATE facture_achat SET statut='reçue', date_reception=NOW() WHERE id=$1 RETURNING *`, [id]);
    await logActivity(db, { id_utilisateur: req.user?.id || null, action: "RECEVOIR_FACTURE_ACHAT", description: `Réception facture achat #${id}` });
    await db.query("COMMIT");
    return res.status(200).json({ success: true, data: r.rows[0] });
  } catch (err) { await db.query("ROLLBACK"); return res.status(500).json({ success: false, message: err.message }); }
  finally { db.release(); }
};

const payerFactureAchat = async (req, res) => {
  const { id } = req.params; const db = await pool.connect();
  try {
    const chk = await db.query("SELECT statut FROM facture_achat WHERE id=$1", [id]);
    if (!chk.rows.length) return res.status(404).json({ success: false, message: "Facture achat introuvable." });
    if (chk.rows[0].statut !== "reçue") return res.status(400).json({ success: false, message: "Seules les factures reçues peuvent être payées." });
    const r = await db.query(`UPDATE facture_achat SET statut='payée', date_paiement=NOW() WHERE id=$1 RETURNING *`, [id]);
    await logActivity(db, { id_utilisateur: req.user?.id || null, action: "PAYER_FACTURE_ACHAT", description: `Facture achat #${id} payée` });
    return res.status(200).json({ success: true, data: r.rows[0] });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
  finally { db.release(); }
};

const annulerFactureAchat = async (req, res) => {
  const { id } = req.params; const db = await pool.connect();
  try {
    const chk = await db.query("SELECT statut FROM facture_achat WHERE id=$1", [id]);
    if (!chk.rows.length) return res.status(404).json({ success: false, message: "Facture achat introuvable." });
    if (chk.rows[0].statut === "payée") return res.status(403).json({ success: false, message: "Impossible d'annuler une facture payée." });
    const r = await db.query(`UPDATE facture_achat SET statut='annulée' WHERE id=$1 RETURNING *`, [id]);
    await logActivity(db, { id_utilisateur: req.user?.id || null, action: "ANNULER_FACTURE_ACHAT", description: `Facture achat #${id} annulée` });
    return res.status(200).json({ success: true, data: r.rows[0] });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
  finally { db.release(); }
};

const getActivityLogs = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT log.id, log.action, log.date_heure, log.description, u.nom, u.prenom, u.role
      FROM log_activite log JOIN utilisateur u ON log.id_utilisateur = u.id
      ORDER BY log.date_heure DESC
    `);
    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: "Erreur logs.", detail: err.message });
  }
};

module.exports = {
  getAllFactures, getFactureById, createFacture, emettreFacture, payerFacture, annulerFacture,
  getAllFacturesAchat, getFactureAchatById, createFactureAchat, recevoirFactureAchat, payerFactureAchat, annulerFactureAchat,
  getActivityLogs,
};