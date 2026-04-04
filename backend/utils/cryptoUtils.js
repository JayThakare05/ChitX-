const crypto = require('crypto');

// AES-256-CBC configuration
const ALGORITHM = 'aes-256-cbc';
const SALT = 'ChitX_Secret_Salt_2026'; // A fixed salt to ensure the same name+phone produces the same key
const KEY_LENGTH = 32; // 256 bits for aes-256

/**
 * Derives a 32-byte key from a combination of the user's password and phone number.
 * @param {string} phone - User's phone number (used as personal salt)
 * @param {string} password - User's explicitly chosen password
 * @returns {Buffer} The derived 32-byte key
 */
function deriveKey(phone, password) {
    const secret = `${phone.trim()}:${password}`;
    // Using pbkdf2Sync for deterministic key generation
    return crypto.pbkdf2Sync(secret, SALT, 100000, KEY_LENGTH, 'sha512');
}

/**
 * Encrypts a private key using the derived key.
 * @param {string} phone - User's phone number
 * @param {string} password - User's password
 * @param {string} privateKey - The private key to encrypt
 * @returns {Object} An object containing the `iv` and `encryptedData` (hex strings)
 */
function encrypt(phone, password, privateKey) {
    const key = deriveKey(phone, password);
    const iv = crypto.randomBytes(16); // 16 bytes IV for AES-256-CBC
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted
    };
}

/**
 * Decrypts an encrypted private key using the derived key.
 * @param {string} phone - User's phone number
 * @param {string} password - User's password
 * @param {string} encryptedData - The encrypted private key hex string
 * @param {string} ivHex - The initialization vector hex string
 * @returns {string} The decrypted plaintext private key
 */
function decrypt(phone, password, encryptedData, ivHex) {
    const key = deriveKey(phone, password);
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
}

module.exports = {
    encrypt,
    decrypt
};
