/**
 * ttnService.js
 * Client SOAP pour la plateforme TTN elfatoora
 * 
 * WSDL : https://elfatoora.tn/ElfatouraServices/EfactService?wsdl
 * 
 * Deux opérations :
 *   - saveEfact    : Envoyer une facture XML signée
 *   - consultEfact : Consulter le statut d'une facture
 * 
 * Variables .env requises :
 *   TTN_LOGIN      = votre login TTN
 *   TTN_PASSWORD   = votre mot de passe TTN
 *   TTN_MATRICULE  = votre matricule fiscal
 */

const soap = require("soap");
require("dotenv").config();

const WSDL_URL   = "https://elfatoora.tn/ElfatouraServices/EfactService?wsdl";
const TTN_LOGIN  = process.env.TTN_LOGIN;
const TTN_PASS   = process.env.TTN_PASSWORD;
const TTN_MAT    = process.env.TTN_MATRICULE;

/**
 * Crée et retourne un client SOAP TTN
 */
async function getClient() {
  return await soap.createClientAsync(WSDL_URL);
}

/**
 * saveEfact — Envoie une facture XML signée à TTN
 * 
 * @param {string} signedXml - Le XML TEIF signé (output de signService.signTEIF())
 * @returns {Object} - Réponse TTN { idSaveEfact, generatedRef, message, status }
 */
async function saveEfact(signedXml) {
  if (!TTN_LOGIN || !TTN_PASS || !TTN_MAT) {
    throw new Error("TTN_LOGIN, TTN_PASSWORD et TTN_MATRICULE doivent être définis dans .env");
  }

  const client = await getClient();

  // TTN attend le XML en bytes (Buffer)
  const documentEfact = Buffer.from(signedXml, "utf8");

  const args = {
    login:         TTN_LOGIN,
    password:      TTN_PASS,
    matricule:     TTN_MAT,
    documentEfact: documentEfact,
  };

  const [result] = await client.saveEfactAsync(args);

  // Extraire les infos de la réponse TTN
  return parseResponse(result);
}

/**
 * consultEfact — Consulte une facture par critères
 * 
 * @param {Object} criteria - Critères de recherche
 * @param {string}  [criteria.documentNumber]   - Numéro de facture
 * @param {string}  [criteria.generatedRef]     - Référence générée par TTN
 * @param {number}  [criteria.idSaveEfact]      - ID unique saveEfact
 * @param {string}  [criteria.documentType]     - Type de document
 * @param {number}  [criteria.amount]           - Montant HT
 * @param {number}  [criteria.amountTax]        - Montant TTC
 * @param {Date}    [criteria.dateDebutDocument] - Date début
 * @param {Date}    [criteria.dateFinDocument]  - Date fin
 * @returns {Array} - Liste d'objets EfactCriteria
 */
async function consultEfact(criteria = {}) {
  if (!TTN_LOGIN || !TTN_PASS || !TTN_MAT) {
    throw new Error("TTN_LOGIN, TTN_PASSWORD et TTN_MATRICULE doivent être définis dans .env");
  }

  const client = await getClient();

  const args = {
    login:         TTN_LOGIN,
    password:      TTN_PASS,
    matricule:     TTN_MAT,
    efactCriteria: {
      documentNumber:    criteria.documentNumber    || null,
      generatedRef:      criteria.generatedRef      || null,
      idSaveEfact:       criteria.idSaveEfact       || null,
      documentType:      criteria.documentType      || null,
      amount:            criteria.amount            || null,
      amountTax:         criteria.amountTax         || null,
      dateDebutProcess:  criteria.dateDebutProcess  || null,
      dateFinProcess:    criteria.dateFinProcess     || null,
      dateDebutDocument: criteria.dateDebutDocument || null,
      dateFinDocument:   criteria.dateFinDocument   || null,
    },
  };

  const [result] = await client.consultEfactAsync(args);

  // Retourne la liste des factures trouvées
  if (!result || !result.return) return [];
  const items = Array.isArray(result.return) ? result.return : [result.return];
  return items.map(mapEfactCriteria);
}

/**
 * verifyQrCode — Vérifie le QR code d'une facture
 * @param {string} qrCode
 * @returns {Object}
 */
async function verifyQrCode(qrCode) {
  const client = await getClient();
  const args = {
    login:     TTN_LOGIN,
    password:  TTN_PASS,
    matricule: TTN_MAT,
    qrCode,
  };
  const [result] = await client.verifyQrCodeAsync(args);
  return result;
}

/**
 * Parse la réponse de saveEfact
 */
function parseResponse(result) {
  if (!result) throw new Error("Réponse TTN vide");

  // La réponse est une string XML ou un objet selon le WSDL
  const raw = result.return || result;

  return {
    raw,
    success:      !String(raw).toLowerCase().includes("erreur"),
    idSaveEfact:  result.idSaveEfact  || null,
    generatedRef: result.generatedRef || null,
    message:      String(raw),
  };
}

/**
 * Mappe un objet EfactCriteria TTN vers un objet JS propre
 */
function mapEfactCriteria(item) {
  return {
    documentNumber:     item.documentNumber    || null,
    idSaveEfact:        item.idSaveEfact       || null,
    documentType:       item.documentType      || null,
    generatedRef:       item.generatedRef      || null,
    dateProcess:        item.dateProcess       || null,
    dateDocument:       item.dateDocument      || null,
    amount:             item.amount            || null,  // Montant HT
    amountTax:          item.amountTax         || null,  // Montant TTC
    xmlContent:         item.xmlContent        || null,
    listAcknowlegments: item.listAcknowlegments || [],
    listAttachement:    item.listAttachement   || [],
  };
}

module.exports = { saveEfact, consultEfact, verifyQrCode };