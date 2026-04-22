const pool = require("../config/db");
const getAllProduitsFournisseur = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        pf.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id',         img.id,
              'id_produit', img.id_produit,
              'image_url',  img.image_url,
              'is_primary', img.is_primary,
              'date_ajout', img.date_ajout
            )
          ) FILTER (WHERE img.id IS NOT NULL),
          '[]'
        ) AS images
      FROM produit_fournisseur pf
      LEFT JOIN produit_image img ON img.id_produit = pf.id
      GROUP BY pf.id
      ORDER BY pf.id
    `);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("getAllProduitsFournisseur:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProduitFournisseurById = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `
      SELECT
        pf.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id',         img.id,
              'id_produit', img.id_produit,
              'image_url',  img.image_url,
              'is_primary', img.is_primary,
              'date_ajout', img.date_ajout
            )
          ) FILTER (WHERE img.id IS NOT NULL),
          '[]'
        ) AS images
      FROM produit_fournisseur pf
      LEFT JOIN produit_image img ON img.id_produit = pf.id
      WHERE pf.id = $1
      GROUP BY pf.id
      `,
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: "Produit introuvable" });
    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("getProduitFournisseurById:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};


const getProduitsByFournisseur = async (req, res) => {
  const { id_fournisseur } = req.params;
  try {
    const { rows } = await pool.query(
      `
      SELECT
        pf.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id',         img.id,
              'id_produit', img.id_produit,
              'image_url',  img.image_url,
              'is_primary', img.is_primary,
              'date_ajout', img.date_ajout
            )
          ) FILTER (WHERE img.id IS NOT NULL),
          '[]'
        ) AS images
      FROM produit_fournisseur pf
      LEFT JOIN produit_image img ON img.id_produit = pf.id
      WHERE pf.id_fournisseur = $1
      GROUP BY pf.id
      ORDER BY pf.id
      `,
      [id_fournisseur]
    );
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("getProduitsByFournisseur:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};


const createProduitFournisseur = async (req, res) => {
  const {
    id_fournisseur,
    nom_produit_f,
    description_f,
    categorie,
    prix_unitaire_ht,
    taux_tva,
    taux_fodec,
    taux_dc,
  } = req.body;

  if (!id_fournisseur || !nom_produit_f || prix_unitaire_ht === undefined) {
    return res.status(400).json({
      success: false,
      message: "Champs obligatoires : id_fournisseur, nom_produit_f, prix_unitaire_ht",
    });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `
      INSERT INTO produit_fournisseur
        (id_fournisseur, nom_produit_f, description_f, categorie,
         prix_unitaire_ht, taux_tva, taux_fodec, taux_dc, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
      `,
      [
        id_fournisseur,
        nom_produit_f,
        description_f || null,
        categorie || null,
        prix_unitaire_ht,
        taux_tva || 0,
        taux_fodec || 0,
        taux_dc || 0,
      ]
    );

    const newProduit = rows[0];

    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        await client.query(
          `INSERT INTO produit_image (id_produit, image_url, is_primary, date_ajout)
           VALUES ($1, $2, $3, NOW())`,
          [newProduit.id, `/uploads/produits/${req.files[i].filename}`, i === 0]
        );
      }
    }

    await client.query("COMMIT");
    res.status(201).json({ success: true, message: "Produit créé avec succès", data: newProduit });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("createProduitFournisseur:", error.message);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};

const updateProduitFournisseur = async (req, res) => {
  const { id } = req.params;
  const {
    id_fournisseur,
    nom_produit_f,
    description_f,
    categorie,
    prix_unitaire_ht,
    taux_tva,
    taux_fodec,
    taux_dc,
  } = req.body;

  try {
    const existing = await pool.query(
      "SELECT id FROM produit_fournisseur WHERE id = $1",
      [id]
    );
    if (existing.rows.length === 0)
      return res.status(404).json({ success: false, message: "Produit introuvable" });

    const { rows } = await pool.query(
      `
      UPDATE produit_fournisseur SET
        id_fournisseur   = COALESCE($1, id_fournisseur),
        nom_produit_f    = COALESCE($2, nom_produit_f),
        description_f    = COALESCE($3, description_f),
        categorie        = COALESCE($4, categorie),
        prix_unitaire_ht = COALESCE($5, prix_unitaire_ht),
        taux_tva         = COALESCE($6, taux_tva),
        taux_fodec       = COALESCE($7, taux_fodec),
        taux_dc          = COALESCE($8, taux_dc),
        updated_at       = NOW()
      WHERE id = $9
      RETURNING *
      `,
      [id_fournisseur, nom_produit_f, description_f, categorie,
       prix_unitaire_ht, taux_tva, taux_fodec, taux_dc, id]
    );

    const updatedProduit = rows[0];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await pool.query(
          `INSERT INTO produit_image (id_produit, image_url, is_primary, date_ajout)
           VALUES ($1, $2, false, NOW())`,
          [updatedProduit.id, `/uploads/produits/${file.filename}`]
        );
      }
    }

    res.status(200).json({ success: true, message: "Produit mis à jour", data: updatedProduit });
  } catch (error) {
    console.error("updateProduitFournisseur:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};


const deleteProduitFournisseur = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existing = await client.query(
      "SELECT id FROM produit_fournisseur WHERE id = $1", [id]
    );
    if (existing.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Produit introuvable" });
    }

    await client.query("DELETE FROM produit_image WHERE id_produit = $1", [id]);
    await client.query("DELETE FROM produit_fournisseur WHERE id = $1", [id]);

    await client.query("COMMIT");
    res.status(200).json({ success: true, message: `Produit #${id} supprimé` });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("deleteProduitFournisseur:", error.message);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};


const addImageToProduit = async (req, res) => {
  const { id } = req.params;
  const { image_url, is_primary } = req.body;

  if (!image_url)
    return res.status(400).json({ success: false, message: "image_url est obligatoire" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (is_primary) {
      await client.query(
        "UPDATE produit_image SET is_primary = false WHERE id_produit = $1", [id]
      );
    }
    const { rows } = await client.query(
      `INSERT INTO produit_image (id_produit, image_url, is_primary, date_ajout)
       VALUES ($1, $2, $3, NOW()) RETURNING *`,
      [id, image_url, is_primary ?? false]
    );
    await client.query("COMMIT");
    res.status(201).json({ success: true, message: "Image ajoutée", data: rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("addImageToProduit:", error.message);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};

const deleteImage = async (req, res) => {
  const { id_image } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM produit_image WHERE id = $1 RETURNING *", [id_image]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: "Image introuvable" });
    res.status(200).json({ success: true, message: "Image supprimée" });
  } catch (error) {
    console.error("deleteImage:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};


const setPrimaryImage = async (req, res) => {
  const { id, id_image } = req.params;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "UPDATE produit_image SET is_primary = false WHERE id_produit = $1", [id]
    );
    const { rows } = await client.query(
      "UPDATE produit_image SET is_primary = true WHERE id = $1 AND id_produit = $2 RETURNING *",
      [id_image, id]
    );
    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Image introuvable" });
    }
    await client.query("COMMIT");
    res.status(200).json({ success: true, message: "Image principale définie", data: rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("setPrimaryImage:", error.message);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};

module.exports = {
  getAllProduitsFournisseur,
  getProduitFournisseurById,
  getProduitsByFournisseur,
  createProduitFournisseur,
  updateProduitFournisseur,
  deleteProduitFournisseur,
  addImageToProduit,
  deleteImage,
  setPrimaryImage,
};