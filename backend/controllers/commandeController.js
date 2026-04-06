const pool = require('../config/db');


const logActivity = async (client, { id_utilisateur, action, description }) => {
  await client.query(
    `INSERT INTO log_activite (id_utilisateur, action, description, date_heure)
     VALUES ($1, $2, $3, NOW())`,
    [id_utilisateur, action, description]
  );
};


const getAllCommandes = async (req, res) => {
  const dbClient = await pool.connect();
  try {
    const result = await dbClient.query(`
      SELECT 
        f.id,
        f.num_facture,
        f.num_ordre,
        f.date_creation,
        f.statut,
        f.trimestre,
        f.type_en,
        f.total_ttc,
        f.id_commercial,
        u_com.nom   AS commercial_nom,
        u_com.prenom AS commercial_prenom,
        f.id_client,
        c.identifiant AS client_identifiant,
        u_cli.nom    AS client_nom,
        u_cli.prenom AS client_prenom,
        c.adresse AS client_adresse,
        c.ville AS client_ville
      FROM facture f
      LEFT JOIN utilisateur u_com ON u_com.id = f.id_commercial
      LEFT JOIN client c           ON c.id = f.id_client
      LEFT JOIN utilisateur u_cli  ON u_cli.id = c.id_utilisateur
      WHERE f.statut = 'commande'
      ORDER BY f.date_creation DESC
    `);

    await logActivity(dbClient, {
      id_utilisateur: req.user?.id || null,
      action: 'CONSULTER_COMMANDES',
      description: `Consultation de la liste des commandes (${result.rows.length} résultats)`,
    });

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('getAllCommandes error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message,
    });
  } finally {
    dbClient.release();
  }
};


const getCommandeById = async (req, res) => {
  const { id } = req.params;
  const dbClient = await pool.connect();

  try {
    const factureResult = await dbClient.query(`
      SELECT 
        f.*,
        u_com.nom    AS commercial_nom,
        u_com.prenom AS commercial_prenom,
        c.identifiant AS client_identifiant,
        c.adresse    AS client_adresse,
        c.ville      AS client_ville,
        u_cli.nom    AS client_nom,
        u_cli.prenom AS client_prenom
      FROM facture f
      LEFT JOIN utilisateur u_com ON u_com.id = f.id_commercial
      LEFT JOIN client c           ON c.id = f.id_client
      LEFT JOIN utilisateur u_cli  ON u_cli.id = c.id_utilisateur
     WHERE f.id = $1 AND (f.statut = 'commande' OR f.statut = 'facture')
    `, [id]);

    if (factureResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Commande introuvable' });
    }

    const detailsResult = await dbClient.query(`
      SELECT 
        df.id,
        df.id_produit,
        p.nom_produit,
        p.taux_tva,
        p.taux_fodec,
        p.taux_dc,
        df.quantite_achetee,
        df.prix_unitaire_ht_applique,
        (df.quantite_achetee * df.prix_unitaire_ht_applique) AS total_ht_ligne
      FROM detail_facture df
      LEFT JOIN produit p ON p.id = df.id_produit
      WHERE df.id_facture = $1
    `, [id]);

    await logActivity(dbClient, {
      id_utilisateur: req.user?.id || null,
      action: 'CONSULTER_COMMANDE',
      description: `Consultation de la commande #${id}`,
    });

    return res.status(200).json({
      success: true,
      data: {
        commande: factureResult.rows[0],
        details: detailsResult.rows,
      },
    });
  } catch (error) {
    console.error('getCommandeById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message,
    });
  } finally {
    dbClient.release();
  }
};


const createCommande = async (req, res) => {
  const dbClient = await pool.connect();

  try {
    await dbClient.query('BEGIN');

    const {
      id_client,
      id_commercial,
      id_societe,
      id_comptable,
      trimestre,
      num_facture,
      details = [],
    } = req.body;

    const type_en = 'DF';

    // 1. Validations de base
    if (!id_client || !id_commercial) {
      await dbClient.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'id_client et id_commercial sont requis.',
      });
    }

    if (!Array.isArray(details) || details.length === 0) {
      await dbClient.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Au moins un produit est requis.',
      });
    }

    // 2. Vérification de l'existence ET de l'état "est_actif" du client
    // On joint la table 'client' avec 'utilisateur' pour vérifier le booléen
    const clientCheck = await dbClient.query(
      `SELECT c.id, u.est_actif 
       FROM client c
       JOIN utilisateur u ON c.id_utilisateur = u.id
       WHERE c.id_utilisateur = $1`,
      [id_client]
    );

    if (clientCheck.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: `Aucun client trouvé pour l'utilisateur id=${id_client}.`,
      });
    }

    const clientFound = clientCheck.rows[0];

    // --- SÉCURITÉ : Blocage si le client n'est pas actif ---
    if (clientFound.est_actif !== true) {
      await dbClient.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: "Action impossible : le compte de ce client est actuellement inactif.",
      });
    }

    const real_id_client = clientFound.id;

    // 3. Vérification du commercial
    const commercialCheck = await dbClient.query(
      'SELECT id FROM utilisateur WHERE id = $1',
      [id_commercial]
    );
    if (commercialCheck.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Commercial id=${id_commercial} introuvable.`,
      });
    }

    // 4. Calcul du total TTC et validation des produits
    let total_ttc = 0;
    for (const ligne of details) {
      if (!ligne.id_produit || !ligne.quantite_achetee) {
        await dbClient.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Chaque produit doit avoir id_produit et quantite_achetee.',
        });
      }

      const produitRes = await dbClient.query(
        'SELECT prix_unitaire_ht, taux_tva, taux_fodec, taux_dc FROM produit WHERE id = $1',
        [ligne.id_produit]
      );

      if (produitRes.rows.length === 0) {
        await dbClient.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Produit id=${ligne.id_produit} introuvable.`,
        });
      }

      const p = produitRes.rows[0];
      const qty = parseFloat(ligne.quantite_achetee) || 0;
      const prix_ht = parseFloat(ligne.prix_unitaire_ht_applique || p.prix_unitaire_ht) || 0;

      if (qty <= 0 || prix_ht < 0) {
        await dbClient.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Quantité et prix doivent être positifs.',
        });
      }

      const montant_ht = prix_ht * qty;
      const fodec = montant_ht * (parseFloat(p.taux_fodec) || 0) / 100;
      const tva   = (montant_ht + fodec) * (parseFloat(p.taux_tva) || 0) / 100;
      const dc    = montant_ht * (parseFloat(p.taux_dc) || 0) / 100;
      total_ttc  += (montant_ht + fodec + tva - dc);
    }

    // 5. Insertion de la facture
    const numero = num_facture && num_facture.trim()
      ? num_facture.trim()
      : `CMD-${Date.now()}`;

    const factureRes = await dbClient.query(`
      INSERT INTO facture
        (id_client, id_commercial, id_societe, id_comptable, trimestre, type_en,
         num_facture, date_creation, statut, total_ttc)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), 'commande', $8)
      RETURNING *
    `, [
      real_id_client,
      id_commercial,
      id_societe   || null,
      id_comptable || null,
      trimestre    || null,
      type_en,
      numero,
      parseFloat(total_ttc.toFixed(3)),
    ]);

    const newFacture = factureRes.rows[0];

    // 6. Insertion des détails
    const insertedDetails = [];
    for (const ligne of details) {
      const produitRes = await dbClient.query(
        'SELECT prix_unitaire_ht FROM produit WHERE id = $1',
        [ligne.id_produit]
      );

      const prix_ht = parseFloat(ligne.prix_unitaire_ht_applique || produitRes.rows[0].prix_unitaire_ht) || 0;
      const qty     = parseFloat(ligne.quantite_achetee) || 0;

      const detailRes = await dbClient.query(`
        INSERT INTO detail_facture (id_facture, id_produit, quantite_achetee, prix_unitaire_ht_applique)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [newFacture.id, ligne.id_produit, qty, prix_ht]);

      insertedDetails.push(detailRes.rows[0]);
    }

    // 7. Log de l'activité
    await logActivity(dbClient, {
      id_utilisateur: req.user?.id || id_commercial,
      action: 'CREER_COMMANDE',
      description: `Création de la commande #${newFacture.id} pour le client actif ID:${real_id_client}`,
    });

    await dbClient.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      data: {
        commande: newFacture,
        details: insertedDetails,
      },
    });

  } catch (error) {
    await dbClient.query('ROLLBACK');
    console.error('[createCommande Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la commande.',
      error: error.message,
    });
  } finally {
    dbClient.release();
  }
};

const deleteCommande = async (req, res) => {
  const { id } = req.params;
  const dbClient = await pool.connect();

  try {
    await dbClient.query('BEGIN');

    const checkRes = await dbClient.query(
      'SELECT id, statut, num_facture FROM facture WHERE id = $1',
      [id]
    );

    if (checkRes.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Commande introuvable.',
      });
    }

    if (checkRes.rows[0].statut !== 'commande') {
      await dbClient.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: `Impossible de supprimer : statut actuel = "${checkRes.rows[0].statut}". Seules les commandes non validées peuvent être supprimées.`,
      });
    }

    const { num_facture } = checkRes.rows[0];

    await dbClient.query('DELETE FROM detail_facture WHERE id_facture = $1', [id]);
    await dbClient.query('DELETE FROM facture WHERE id = $1', [id]);

    await logActivity(dbClient, {
      id_utilisateur: req.user?.id || null,
      action: 'SUPPRIMER_COMMANDE',
      description: `Suppression de la commande #${id} (${num_facture})`,
    });

    await dbClient.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: `Commande #${id} supprimée avec succès.`,
    });
  } catch (error) {
    await dbClient.query('ROLLBACK');
    console.error('deleteCommande error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression.',
      error: error.message,
    });
  } finally {
    dbClient.release();
  }
};


const getActivityLogs = async (req, res) => {
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
    console.error(' getActivityLogs error:', err.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des logs.', detail: err.message });
  }
};


// ─── NEW: get all records with statut = 'facture' ────────────────────────────
const getFactures = async (req, res) => {
  const dbClient = await pool.connect();
  try {
    const result = await dbClient.query(`
      SELECT 
        f.id,
        f.num_facture,
        f.num_ordre,
        f.date_creation,
        f.statut,
        f.trimestre,
        f.type_en,
        f.total_ttc,
        f.id_commercial,
        u_com.nom    AS commercial_nom,
        u_com.prenom AS commercial_prenom,
        f.id_client,
        c.identifiant AS client_identifiant,
        u_cli.nom    AS client_nom,
        u_cli.prenom AS client_prenom,
        c.adresse    AS client_adresse,
        c.ville      AS client_ville
      FROM facture f
      LEFT JOIN utilisateur u_com ON u_com.id = f.id_commercial
      LEFT JOIN client c           ON c.id = f.id_client
      LEFT JOIN utilisateur u_cli  ON u_cli.id = c.id_utilisateur
      WHERE f.statut = 'facture'
      ORDER BY f.date_creation DESC
    `);

    await logActivity(dbClient, {
      id_utilisateur: req.user?.id || null,
      action: 'CONSULTER_FACTURES',
      description: `Consultation de la liste des factures (${result.rows.length} résultats)`,
    });

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('getFactures error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message,
    });
  } finally {
    dbClient.release();
  }
};


module.exports = {
  getAllCommandes,
  getCommandeById,
  createCommande,
  deleteCommande,
  getActivityLogs,
  getFactures,
};