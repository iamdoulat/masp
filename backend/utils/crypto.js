const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY = Buffer.from(process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef', 'utf-8');

/**
 * Encrypt a string using AES-256-GCM
 */
function encrypt(text) {
    if (!text) return null;

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    // Format: iv:tag:encrypted
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt an AES-256-GCM encrypted string
 */
function decrypt(encryptedText) {
    if (!encryptedText) return null;

    const parts = encryptedText.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted format');

    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

/**
 * Encrypt cookies object
 */
function encryptCookies(cookies) {
    if (!cookies) return null;
    const json = typeof cookies === 'string' ? cookies : JSON.stringify(cookies);
    return encrypt(json);
}

/**
 * Decrypt cookies to object
 */
function decryptCookies(encryptedCookies) {
    if (!encryptedCookies) return null;
    const json = decrypt(encryptedCookies);
    return JSON.parse(json);
}

module.exports = { encrypt, decrypt, encryptCookies, decryptCookies };
