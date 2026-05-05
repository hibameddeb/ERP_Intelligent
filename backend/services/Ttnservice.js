const soap = require("soap");
require("dotenv").config();

const CONFIG = {
  WSDL_URL:    process.env.TTN_WSDL_URL    || "https://elfatoora.tn/ElfatouraServices/EfactService?wsdl",
  LOGIN:       process.env.TTN_LOGIN,
  PASSWORD:    process.env.TTN_PASSWORD,
  MATRICULE:   process.env.TTN_MATRICULE,
  TIMEOUT_MS:  parseInt(process.env.TTN_TIMEOUT_MS  || "30000"),
  MAX_RETRIES: parseInt(process.env.TTN_MAX_RETRIES || "3"),
  LOG_LEVEL:   process.env.TTN_LOG_LEVEL || "info",
};


const LOG_LEVELS = { debug: 0, info: 1, error: 2, silent: 3 };

function log(level, message, data = {}) {
  if (LOG_LEVELS[level] < LOG_LEVELS[CONFIG.LOG_LEVEL]) return;

  // ⚠️ NEVER log passwords or document content (only metadata)
  const safeData = { ...data };
  delete safeData.password;
  delete safeData.documentEfact;
  delete safeData.signedXml;

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: "ttnService",
    message,
    ...safeData,
  };
  const fn = level === "error" ? console.error : console.log;
  fn(JSON.stringify(entry));
}

// ─────────────────────────────────────────────────────────
// Validation centralisée
// ─────────────────────────────────────────────────────────
function assertCredentials() {
  const missing = [];
  if (!CONFIG.LOGIN)     missing.push("TTN_LOGIN");
  if (!CONFIG.PASSWORD)  missing.push("TTN_PASSWORD");
  if (!CONFIG.MATRICULE) missing.push("TTN_MATRICULE");
  if (missing.length > 0) {
    throw new Error(`Variables d'environnement manquantes : ${missing.join(", ")}`);
  }
}

function assertSignedXml(signedXml) {
  if (typeof signedXml !== "string") {
    throw new TypeError("signedXml doit être une string");
  }
  if (signedXml.trim().length === 0) {
    throw new Error("signedXml ne peut pas être vide");
  }
  if (!signedXml.includes("<")) {
    throw new Error("signedXml ne ressemble pas à du XML");
  }
  // Vérification minimale qu'il y a bien une signature
  if (!signedXml.includes("Signature") && !signedXml.includes("ds:Signature")) {
    log("error", "XML sans bloc Signature détecté");
    throw new Error("signedXml ne contient pas de bloc Signature — facture non signée ?");
  }
}

// ─────────────────────────────────────────────────────────
// Client SOAP avec cache
// ─────────────────────────────────────────────────────────
let cachedClient = null;
let cachedClientPromise = null;

async function getClient() {
  // Si déjà en cache, retourne immédiatement
  if (cachedClient) return cachedClient;

  // Si une création est en cours, attend la même Promise (évite race condition)
  if (cachedClientPromise) return cachedClientPromise;

  log("debug", "Création du client SOAP", { wsdl: CONFIG.WSDL_URL });

  cachedClientPromise = soap.createClientAsync(CONFIG.WSDL_URL, {
    // Désactive le logging verbeux qui pourrait fuiter le password
    disableCache: false,
  }).then(client => {
    // Configurer le timeout sur toutes les requêtes
    if (client.setSecurity && client.wsdl) {
      // Configurer les options HTTP : timeout
      client.setEndpoint(client.wsdl.xml ? client.endpoint : CONFIG.WSDL_URL.replace("?wsdl", ""));
    }
    cachedClient = client;
    cachedClientPromise = null;
    log("info", "Client SOAP prêt");
    return client;
  }).catch(err => {
    cachedClientPromise = null;
    log("error", "Échec création client SOAP", { error: err.message });
    throw err;
  });

  return cachedClientPromise;
}

/** Réinitialise le cache (utile pour les tests ou en cas de problème) */
function resetClient() {
  cachedClient = null;
  cachedClientPromise = null;
  log("debug", "Cache client SOAP réinitialisé");
}

// ─────────────────────────────────────────────────────────
// Retry avec backoff exponentiel
// ─────────────────────────────────────────────────────────
const TRANSIENT_ERROR_CODES = new Set([
  "ECONNRESET", "ETIMEDOUT", "ECONNREFUSED", "ENOTFOUND",
  "EAI_AGAIN", "EPIPE", "ESOCKETTIMEDOUT",
]);

function isTransientError(err) {
  if (!err) return false;
  if (TRANSIENT_ERROR_CODES.has(err.code)) return true;
  // Codes HTTP 5xx (sauf 501 = pas implémenté, qui n'est pas transient)
  if (err.response && err.response.statusCode >= 500 && err.response.statusCode !== 501) return true;
  return false;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withRetry(operationName, fn) {
  let lastErr;
  for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    try {
      return await Promise.race([
        fn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(Object.assign(new Error("Timeout"), { code: "ETIMEDOUT" })), CONFIG.TIMEOUT_MS)
        ),
      ]);
    } catch (err) {
      lastErr = err;
      if (!isTransientError(err) || attempt === CONFIG.MAX_RETRIES) {
        throw err;
      }
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // 1s, 2s, 4s, max 10s
      log("info", `Retry ${attempt}/${CONFIG.MAX_RETRIES} pour ${operationName}`, {
        delay_ms: delay,
        errorCode: err.code,
      });
      await sleep(delay);
    }
  }
  throw lastErr;
}

// ─────────────────────────────────────────────────────────
// Parsing des réponses (unifié et robuste)
// ─────────────────────────────────────────────────────────

/**
 * Détection robuste du succès basée sur plusieurs signaux structurés
 */
function isSuccessful(result, raw) {
  // 1. Si on a un generatedRef ou idSaveEfact, c'est probablement un succès
  if (result && (result.generatedRef || result.idSaveEfact)) return true;

  // 2. Si la réponse contient un code de statut explicite
  if (result && result.status) {
    const status = String(result.status).toUpperCase();
    if (["OK", "SUCCESS", "200", "0"].includes(status)) return true;
    if (["KO", "ERROR", "FAILED", "FAIL"].includes(status)) return false;
  }

  // 3. Patterns d'échec dans le raw (plus large que juste "erreur")
  const rawStr = String(raw || "").toLowerCase();
  const errorPatterns = ["erreur", "error", "failed", "rejected", "invalid", "<fault>"];
  if (errorPatterns.some(p => rawStr.includes(p))) return false;

  // 4. Par défaut, on considère comme succès SI on a une réponse non-vide
  return !!raw;
}

function parseSaveResponse(result) {
  if (!result) throw new Error("Réponse TTN vide");

  const raw = result.return || result;
  const rawStr = String(raw);

  return {
    raw,
    success:      isSuccessful(result, raw),
    idSaveEfact:  result.idSaveEfact  || null,
    generatedRef: result.generatedRef || null,
    message:      rawStr,
  };
}

/**
 * Mappe un EfactCriteria TTN vers un objet JS propre.
 * Renommage explicite des champs ambigus.
 */
function mapEfactCriteria(item) {
  return {
    documentNumber:     item.documentNumber || null,
    idSaveEfact:        item.idSaveEfact    || null,
    documentType:       item.documentType   || null,
    generatedRef:       item.generatedRef   || null,
    dateProcess:        item.dateProcess    || null,
    dateDocument:       item.dateDocument   || null,
    amountHT:           item.amount         || null, // ✅ renommé pour clarté
    amountTTC:          item.amountTax      || null, // ✅ renommé pour clarté
    xmlContent:         item.xmlContent     || null,
    listAcknowlegments: item.listAcknowlegments || [], // (orthographe TTN, ne pas corriger)
    listAttachement:    item.listAttachement    || [], // (orthographe TTN, ne pas corriger)
  };
}

// ─────────────────────────────────────────────────────────
// API publique
// ─────────────────────────────────────────────────────────

/**
 * Envoie une facture XML signée à TTN.
 *
 * @param {string} signedXml - XML TEIF signé (output de signService.signTEIF())
 * @returns {Promise<{success: boolean, idSaveEfact: string|null, generatedRef: string|null, message: string, raw: any}>}
 * @throws {Error} si credentials manquants, XML invalide, ou échec après retries
 */
async function saveEfact(signedXml) {
  assertCredentials();
  assertSignedXml(signedXml);

  const startedAt = Date.now();
  const xmlSizeKb = (Buffer.byteLength(signedXml, "utf8") / 1024).toFixed(1);
  log("info", "saveEfact start", { matricule: CONFIG.MATRICULE, xml_size_kb: xmlSizeKb });

  try {
    const client = await getClient();

    const args = {
      login:         CONFIG.LOGIN,
      password:      CONFIG.PASSWORD,
      matricule:     CONFIG.MATRICULE,
      documentEfact: Buffer.from(signedXml, "utf8"),
    };

    const [result] = await withRetry("saveEfact", () => client.saveEfactAsync(args));

    const parsed = parseSaveResponse(result);
    const duration_ms = Date.now() - startedAt;

    if (parsed.success) {
      log("info", "saveEfact OK", {
        duration_ms,
        idSaveEfact: parsed.idSaveEfact,
        generatedRef: parsed.generatedRef,
      });
    } else {
      log("error", "saveEfact échec métier", { duration_ms, message: parsed.message });
    }

    return parsed;
  } catch (err) {
    log("error", "saveEfact exception", {
      duration_ms: Date.now() - startedAt,
      error: err.message,
      code: err.code,
    });
    throw err;
  }
}

/**
 * Consulte des factures déjà envoyées par critères.
 *
 * @param {Object}   [criteria={}]
 * @param {string}   [criteria.documentNumber]
 * @param {string}   [criteria.generatedRef]
 * @param {number}   [criteria.idSaveEfact]
 * @param {string}   [criteria.documentType]
 * @param {number}   [criteria.amount]          - Montant HT
 * @param {number}   [criteria.amountTax]       - Montant TTC
 * @param {Date}     [criteria.dateDebutProcess]
 * @param {Date}     [criteria.dateFinProcess]
 * @param {Date}     [criteria.dateDebutDocument]
 * @param {Date}     [criteria.dateFinDocument]
 * @returns {Promise<Array>} Liste de factures
 */
async function consultEfact(criteria = {}) {
  assertCredentials();

  const startedAt = Date.now();
  log("info", "consultEfact start", { criteria });

  try {
    const client = await getClient();

    const args = {
      login:         CONFIG.LOGIN,
      password:      CONFIG.PASSWORD,
      matricule:     CONFIG.MATRICULE,
      efactCriteria: {
        documentNumber:    criteria.documentNumber    || null,
        generatedRef:      criteria.generatedRef      || null,
        idSaveEfact:       criteria.idSaveEfact       || null,
        documentType:      criteria.documentType      || null,
        amount:            criteria.amount            || null,
        amountTax:         criteria.amountTax         || null,
        dateDebutProcess:  criteria.dateDebutProcess  || null,
        dateFinProcess:    criteria.dateFinProcess    || null,
        dateDebutDocument: criteria.dateDebutDocument || null,
        dateFinDocument:   criteria.dateFinDocument   || null,
      },
    };

    const [result] = await withRetry("consultEfact", () => client.consultEfactAsync(args));

    if (!result || !result.return) {
      log("info", "consultEfact OK", { duration_ms: Date.now() - startedAt, count: 0 });
      return [];
    }

    const items = Array.isArray(result.return) ? result.return : [result.return];
    const mapped = items.map(mapEfactCriteria);

    log("info", "consultEfact OK", { duration_ms: Date.now() - startedAt, count: mapped.length });
    return mapped;
  } catch (err) {
    log("error", "consultEfact exception", {
      duration_ms: Date.now() - startedAt,
      error: err.message,
      code: err.code,
    });
    throw err;
  }
}

/**
 * Vérifie l'authenticité d'un QR code de facture TTN.
 *
 * @param {string} qrCode - Le contenu du QR code scanné
 * @returns {Promise<{success: boolean, raw: any, message: string}>}
 */
async function verifyQrCode(qrCode) {
  assertCredentials();

  if (typeof qrCode !== "string" || qrCode.trim().length === 0) {
    throw new Error("qrCode doit être une string non vide");
  }

  const startedAt = Date.now();
  log("info", "verifyQrCode start");

  try {
    const client = await getClient();

    const args = {
      login:     CONFIG.LOGIN,
      password:  CONFIG.PASSWORD,
      matricule: CONFIG.MATRICULE,
      qrCode,
    };

    const [result] = await withRetry("verifyQrCode", () => client.verifyQrCodeAsync(args));

    const raw = result && (result.return || result);
    const parsed = {
      raw,
      success: isSuccessful(result, raw),
      message: String(raw || ""),
    };

    log("info", "verifyQrCode OK", { duration_ms: Date.now() - startedAt, success: parsed.success });
    return parsed;
  } catch (err) {
    log("error", "verifyQrCode exception", {
      duration_ms: Date.now() - startedAt,
      error: err.message,
      code: err.code,
    });
    throw err;
  }
}

// ─────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────
module.exports = {
  saveEfact,
  consultEfact,
  verifyQrCode,
  // Exposés pour les tests / debug uniquement
  _internal: {
    resetClient,
    getClient,
    parseSaveResponse,
    mapEfactCriteria,
    isSuccessful,
  },
};