/**
 * validation.js — helpers partagés entre les contrôleurs
 * Importez les fonctions dont vous avez besoin :
 *   const { isValidEmail, isValidPhone, isValidIdentifiant, isValidPastDate, isPositiveInt } = require('./validation');
 */

const VALID_ROLES = ['ADMIN', 'COMMERCIAL', 'CLIENT', 'COMPTABLE', 'FOURNISSEUR'];

const VALID_TYPES = ['MF', 'CI', 'RC', 'SI', 'AU'];

/**
 * Regex email standard.
 */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Numéro de téléphone : chiffres, espaces, +, -, () — 7 à 20 caractères.
 */
function isValidPhone(phone) {
    return /^[+\d][\d\s\-().]{6,19}$/.test(phone);
}

/**
 * Identifiant selon le type :
 *   MF → 7 chiffres + lettre optionnelle (ex. 1234567A)
 *   CI → 8 chiffres exacts
 *   RC → alphanumérique 5–20 car.
 *   SI → alphanumérique 4–20 car.
 *   AU → 2–50 car. libres
 */
function isValidIdentifiant(value, type) {
    const patterns = {
        MF: /^\d{7}[A-Z]?$/,
        CI: /^\d{8}$/,
        RC: /^[A-Z0-9]{5,20}$/i,
        SI: /^[A-Z0-9]{4,20}$/i,
        AU: /^.{2,50}$/,
    };
    const regex = patterns[type];
    return regex ? regex.test(value) : false;
}

/**
 * Date YYYY-MM-DD, non future.
 */
function isValidPastDate(dateStr) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) return false;
    return parsed <= new Date();
}

/**
 * Entier strictement positif (accepte string ou number).
 */
function isPositiveInt(value) {
    const n = parseInt(value, 10);
    return Number.isInteger(n) && n > 0 && String(n) === String(value).trim();
}

/**
 * Chaîne non vide après trim, avec longueur max.
 */
function isNonEmpty(value, max = Infinity) {
    const s = (value || '').toString().trim();
    return s.length > 0 && s.length <= max;
}

module.exports = {
    VALID_ROLES,
    VALID_TYPES,
    isValidEmail,
    isValidPhone,
    isValidIdentifiant,
    isValidPastDate,
    isPositiveInt,
    isNonEmpty,
};