/**
 * signService.js
 * Étape 2 : Signe le XML TEIF avec la clé USB TunTrust via PKCS#11
 *
 * Prérequis (quand tu reçois la clé) :
 *   1. Installer le logiciel SafeNet / Gemalto fourni avec la clé
 *   2. Trouver le .dll PKCS#11 (ex: C:\Windows\System32\eTPKCS11.dll)
 *   3. Renseigner dans .env :
 *        PKCS11_LIB=C:\Windows\System32\eTPKCS11.dll
 *        PKCS11_PIN=votre_pin
 *        PKCS11_SLOT=0
 */

const pkcs11js = require("pkcs11js");
const crypto   = require("crypto");
require("dotenv").config();

const PKCS11_LIB  = process.env.PKCS11_LIB;   // chemin vers le .dll
const PKCS11_PIN  = process.env.PKCS11_PIN;    // PIN de la clé USB
const PKCS11_SLOT = parseInt(process.env.PKCS11_SLOT || "0");

/**
 * Calcule le digest SHA-256 du XML en Base64
 */
function computeDigest(xmlString) {
  return crypto.createHash("sha256").update(xmlString, "utf8").digest("base64");
}

/**
 * Construit le bloc SignedInfo (canonicalisé)
 */
function buildSignedInfo(digestValue) {
  return (
    `<ds:SignedInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">` +
      `<ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>` +
      `<ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>` +
      `<ds:Reference URI="">` +
        `<ds:Transforms>` +
          `<ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>` +
        `</ds:Transforms>` +
        `<ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>` +
        `<ds:DigestValue>${digestValue}</ds:DigestValue>` +
      `</ds:Reference>` +
    `</ds:SignedInfo>`
  );
}

/**
 * Signe les données via la clé USB PKCS#11 TunTrust
 * @param {Buffer} dataToSign
 * @returns {{ signatureB64: string, certB64: string }}
 */
async function signWithUSBKey(dataToSign) {
  if (!PKCS11_LIB) {
    throw new Error(
      "PKCS11_LIB non défini dans .env — renseigne le chemin vers le .dll de ta clé TunTrust"
    );
  }

  const pkcs11 = new pkcs11js.PKCS11();
  pkcs11.load(PKCS11_LIB);
  pkcs11.C_Initialize();

  let session = null;

  try {
    // 1. Ouvrir une session sur le slot de la clé
    const slots = pkcs11.C_GetSlotList(true);
    if (!slots || slots.length === 0) {
      throw new Error("Aucune clé USB détectée. Vérifie que la clé est branchée.");
    }

    const slot = slots[PKCS11_SLOT] || slots[0];
    session = pkcs11.C_OpenSession(slot, pkcs11js.CKF_SERIAL_SESSION | pkcs11js.CKF_RW_SESSION);

    // 2. Login avec le PIN
    pkcs11.C_Login(session, pkcs11js.CKU_USER, PKCS11_PIN);

    // 3. Trouver la clé privée RSA sur la clé USB
    pkcs11.C_FindObjectsInit(session, [
      { type: pkcs11js.CKA_CLASS, value: pkcs11js.CKO_PRIVATE_KEY },
      { type: pkcs11js.CKA_KEY_TYPE, value: pkcs11js.CKK_RSA },
    ]);

    const privateKeys = pkcs11.C_FindObjects(session, 10);
    pkcs11.C_FindObjectsFinal(session);

    if (!privateKeys || privateKeys.length === 0) {
      throw new Error("Aucune clé privée RSA trouvée sur la clé USB.");
    }

    const privateKey = privateKeys[0];

    // 4. Signer avec RSA-SHA256
    pkcs11.C_SignInit(session, { mechanism: pkcs11js.CKM_SHA256_RSA_PKCS }, privateKey);
    const signatureBuffer = pkcs11.C_Sign(session, dataToSign, Buffer.alloc(512));
    const signatureB64 = signatureBuffer.toString("base64");

    // 5. Récupérer le certificat
    pkcs11.C_FindObjectsInit(session, [
      { type: pkcs11js.CKA_CLASS, value: pkcs11js.CKO_CERTIFICATE },
      { type: pkcs11js.CKA_CERTIFICATE_TYPE, value: pkcs11js.CKC_X_509 },
    ]);

    const certs = pkcs11.C_FindObjects(session, 10);
    pkcs11.C_FindObjectsFinal(session);

    if (!certs || certs.length === 0) {
      throw new Error("Aucun certificat trouvé sur la clé USB.");
    }

    const certAttrs = pkcs11.C_GetAttributeValue(session, certs[0], [
      { type: pkcs11js.CKA_VALUE },
    ]);

    const certB64 = certAttrs[0].value.toString("base64");

    return { signatureB64, certB64 };

  } finally {
    // Toujours fermer proprement
    if (session !== null) {
      try { pkcs11.C_Logout(session); } catch (_) {}
      try { pkcs11.C_CloseSession(session); } catch (_) {}
    }
    try { pkcs11.C_Finalize(); } catch (_) {}
  }
}

/**
 * Injecte le bloc <ds:Signature> dans le XML TEIF
 * @param {string} xmlWithoutSig
 * @param {string} signedInfoXml
 * @param {string} signatureB64
 * @param {string} certB64
 * @returns {string}
 */
function injectSignature(xmlWithoutSig, signedInfoXml, signatureB64, certB64) {
  const signatureBlock = `
  <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
    ${signedInfoXml}
    <ds:SignatureValue>${signatureB64}</ds:SignatureValue>
    <ds:KeyInfo>
      <ds:X509Data>
        <ds:X509Certificate>${certB64}</ds:X509Certificate>
      </ds:X509Data>
    </ds:KeyInfo>
  </ds:Signature>`;

  return xmlWithoutSig.replace("</TEIF>", `${signatureBlock}\n</TEIF>`);
}

/**
 * Fonction principale
 * @param {string} xmlWithoutSig - Output de xmlService.generateTEIF()
 * @returns {string} - XML TEIF signé (conforme withSig.xsd)
 */
async function signTEIF(xmlWithoutSig) {
  // 1. Digest du document entier
  const digestValue  = computeDigest(xmlWithoutSig);

  // 2. Construire SignedInfo
  const signedInfoXml = buildSignedInfo(digestValue);

  // 3. Signer via clé USB
  const dataToSign = Buffer.from(signedInfoXml, "utf8");
  const { signatureB64, certB64 } = await signWithUSBKey(dataToSign);

  // 4. Injecter dans le XML
  return injectSignature(xmlWithoutSig, signedInfoXml, signatureB64, certB64);
}

module.exports = { signTEIF };