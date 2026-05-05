const { create } = require('xmlbuilder2');
const pool = require('../config/db'); 
async function fetchFactureData(idFacture) {

  const factureResult = await pool.query(
    `SELECT 
      fv.id,
      fv.num_facture,
      fv.total_ht,
      fv.tva,
      fv.fodec,
      fv.total_ttc,
      fv.date_creation,
      fv.date_echeance,
      fv.type_en,

      -- Société (émetteur)
      s.matricule_fiscal   AS s_matricule,
      s.raison_sociale     AS s_nom,
      s.rue                AS s_rue,
      s.ville              AS s_ville,
      s.code_postal        AS s_code_postal,
      s.num_etablissement  AS s_num_etab,

      -- Client (destinataire)
      c.identifiant        AS c_identifiant,
      c.type_identifiant   AS c_type_identifiant,
      c.adresse            AS c_adresse,
      c.ville              AS c_ville,
      c.rue                AS c_rue,
      c.region             AS c_region,
      c.num_etablissement  AS c_num_etab

    FROM facture_vente fv
    JOIN societe s ON s.id = fv.id_societe
    JOIN client  c ON c.id = fv.id_client
    WHERE fv.id = $1`,
    [idFacture]
  );

  if (factureResult.rows.length === 0) {
    throw new Error(`Facture introuvable : id=${idFacture}`);
  }


  const lignesResult = await pool.query(
    `SELECT
      dfv.id,
      dfv.quantite,
      dfv.prix_unitaire_ht_ap,
      pe.nom_commercial,
      pe.description_interne
    FROM detail_facture_vente dfv
    JOIN produit_entreprise pe ON pe.id = dfv.id_produit_entreprise
    WHERE dfv.id_facture_vente = $1
    ORDER BY dfv.id ASC`,
    [idFacture]
  );

  return {
    facture: factureResult.rows[0],
    lignes: lignesResult.rows,
  };
}


function formatDateTEIF(date) {
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}${mm}${yy}`;
}


function mapTypeIdentifiant(type) {
  const map = {
    'matricule_fiscal': 'I-01',
    'CIN': 'I-02',
    'carte_sejour': 'I-03',
  };
  return map[type] || 'I-04';
}


function mapTypeDocument(typeEn) {
  const map = {
    'facture': 'I-11',
    'avoir': 'I-12',
    'facture_rectificative': 'I-13',
  };
  return map[typeEn] || 'I-11';
}

/**
 * Génère le XML TEIF v1.8.8 depuis l'id de la facture
 * @param {number} idFacture
 * @returns {string} XML TEIF sans signature
 */
async function generateTEIF(idFacture) {
  const { facture, lignes } = await fetchFactureData(idFacture);

  const f = facture;
  const typeDocCode = mapTypeDocument(f.type_en);
  const typeClientCode = mapTypeIdentifiant(f.c_type_identifiant);


  const totalHT = parseFloat(f.total_ht).toFixed(3);
  const totalTTC = parseFloat(f.total_ttc).toFixed(3);
  const tva = parseFloat(f.tva).toFixed(3);
  const fodec = f.fodec ? parseFloat(f.fodec).toFixed(3) : '0.000';

  
  const tauxTVA = totalHT > 0
    ? Math.round((parseFloat(tva) / parseFloat(totalHT)) * 100)
    : 19;

  // ── Construction XML ────────────────────────────────────────────────
  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('TEIF', {
      version: '1.8.8',
      controlingAgency: 'TTN',
    });

  const header = root.ele('InvoiceHeader');


  header
    .ele('MessageSenderIdentifier', { type: 'I-01' })
    .txt(f.s_matricule);

 
  header
    .ele('MessageRecieverIdentifier', { type: typeClientCode })
    .txt(f.c_identifiant);


  const body = root.ele('InvoiceBody');


  const bgm = body.ele('Bgm');
  bgm.ele('DocumentIdentifier').txt(f.num_facture);
  bgm.ele('DocumentType', { code: typeDocCode }).txt(
    f.type_en === 'avoir' ? 'Avoir' : 'Facture'
  );


  const dtm = body.ele('Dtm');
  dtm.ele('DateText', { functionCode: 'I-31', format: 'ddMMyy' })
    .txt(formatDateTEIF(f.date_creation));

  if (f.date_echeance) {
    dtm.ele('DateText', { functionCode: 'I-35', format: 'ddMMyy' })
      .txt(formatDateTEIF(f.date_echeance));
  }


  const partnerSection = body.ele('PartnerSection');

  
  const emetteur = partnerSection.ele('PartnerDetails', { functionCode: 'I-61' });
  const nadEmetteur = emetteur.ele('Nad');
  nadEmetteur.ele('Identifier', { type: 'I-01' }).txt(f.s_matricule);
  nadEmetteur.ele('Name').txt(f.s_nom);
  if (f.s_rue) nadEmetteur.ele('Street').txt(f.s_rue);
  if (f.s_ville) nadEmetteur.ele('City').txt(f.s_ville);
  if (f.s_code_postal) nadEmetteur.ele('PostalCode').txt(f.s_code_postal);
  nadEmetteur.ele('Country').txt('TN');

 
  const destinataire = partnerSection.ele('PartnerDetails', { functionCode: 'I-63' });
  const nadClient = destinataire.ele('Nad');
  nadClient.ele('Identifier', { type: typeClientCode }).txt(f.c_identifiant);
  if (f.c_rue) nadClient.ele('Street').txt(f.c_rue);
  if (f.c_ville) nadClient.ele('City').txt(f.c_ville);
  if (f.c_region) nadClient.ele('Region').txt(f.c_region);
  nadClient.ele('Country').txt('TN');

  
  const linSection = body.ele('LinSection');

  for (let i = 0; i < lignes.length; i++) {
    const ligne = lignes[i];
    const qte = parseFloat(ligne.quantite);
    const prixHT = parseFloat(ligne.prix_unitaire_ht_ap).toFixed(3);
    const montantLigne = (qte * parseFloat(prixHT)).toFixed(3);

    const lin = linSection.ele('Lin', { lineNumber: String(i + 1) });

    const pia = lin.ele('Pia');
    pia.ele('ArticleIdentifier').txt(String(ligne.id));
    if (ligne.nom_commercial) {
      pia.ele('ArticleDescription').txt(ligne.nom_commercial);
    }

    lin.ele('Qty', { functionCode: 'I-51' }).txt(String(qte));
    lin.ele('Pri', { functionCode: 'I-71' }).txt(prixHT);

   
    const linTax = lin.ele('LinTax');
    linTax.ele('TaxRate').txt(String(tauxTVA));

   
    const linMoa = lin.ele('LinMoa');
    linMoa.ele('LineAmount', { functionCode: 'I-81' }).txt(montantLigne);
  }


  const invoiceMoa = body.ele('InvoiceMoa');
  invoiceMoa.ele('TotalAmount', { functionCode: 'I-81' }).txt(totalHT);  
  invoiceMoa.ele('TotalAmount', { functionCode: 'I-86' }).txt(totalTTC); 

  const invoiceTax = body.ele('InvoiceTax');
  const taxDetail = invoiceTax.ele('TaxDetail');
  taxDetail.ele('TaxRate').txt(String(tauxTVA));
  taxDetail.ele('TaxBase').txt(totalHT);
  taxDetail.ele('TaxAmount').txt(tva);


  if (parseFloat(fodec) > 0) {
    const fodecDetail = invoiceTax.ele('TaxDetail');
    fodecDetail.ele('TaxRate').txt('1');  // FODEC = 1%
    fodecDetail.ele('TaxBase').txt(totalHT);
    fodecDetail.ele('TaxAmount').txt(fodec);
  }

  return root.end({ prettyPrint: true });
}

module.exports = { generateTEIF };