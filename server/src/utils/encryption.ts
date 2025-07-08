import CryptoJS from 'crypto-js';

export interface EncryptionResult {
    encryptedData: string;
    salt: string;
}

export interface DecryptionParams {
    encryptedData: string;
    salt: string;
    masterKey: string;
}

/**
 * Generates a master key from a user's password or passphrase
 * This should be done on the client side for security
 */
export function generateMasterKey(password: string, salt: string): string {
    return CryptoJS.PBKDF2(password, salt, {
        keySize: 256 / 32,
        iterations: 100000
    }).toString();
}

/**
 * Encrypts data using AES with a master key
 * This should be done on the client side before sending to server
 */
export function encryptData(data: string, masterKey: string): EncryptionResult {
    const salt = CryptoJS.lib.WordArray.random(128 / 8).toString();
    const key = CryptoJS.PBKDF2(masterKey, salt, {
        keySize: 256 / 32,
        iterations: 1000
    });

    const encrypted = CryptoJS.AES.encrypt(data, key.toString()).toString();

    return {
        encryptedData: encrypted,
        salt: salt
    };
}

/**
 * Decrypts data using AES with a master key
 * This should be done on the client side after receiving from server
 */
export function decryptData(params: DecryptionParams): string {
    const { encryptedData, salt, masterKey } = params;

    const key = CryptoJS.PBKDF2(masterKey, salt, {
        keySize: 256 / 32,
        iterations: 1000
    });

    const decrypted = CryptoJS.AES.decrypt(encryptedData, key.toString());
    return decrypted.toString(CryptoJS.enc.Utf8);
}

/**
 * Generates a random salt for key derivation
 */
export function generateSalt(): string {
    return CryptoJS.lib.WordArray.random(128 / 8).toString();
}

/**
 * Hashes a master key for session storage (one-way)
 * Used to verify the user's master key without storing it
 */
export function hashMasterKey(masterKey: string): string {
    return CryptoJS.SHA256(masterKey).toString();
}

/**
 * Generates a session ID for user sessions
 */
export function generateSessionId(): string {
    return CryptoJS.lib.WordArray.random(256 / 8).toString();
}

/**
 * Client-side encryption helper (to be used in frontend)
 * This provides a simple interface for the client
 */
export interface ClientEncryptionHelper {
    encryptCredentials: (credentials: {
        password?: string;
        privateKey?: string;
        passphrase?: string;
    }, masterKey: string) => {
        encryptedPassword?: EncryptionResult;
        encryptedPrivateKey?: EncryptionResult;
        encryptedPassphrase?: EncryptionResult;
    };

    decryptCredentials: (encryptedCredentials: {
        encryptedPassword?: EncryptionResult;
        encryptedPrivateKey?: EncryptionResult;
        encryptedPassphrase?: EncryptionResult;
    }, masterKey: string) => {
        password?: string;
        privateKey?: string;
        passphrase?: string;
    };
}

/**
 * Server-side validation of encrypted data
 * Ensures the encrypted data is in the correct format
 */
export function validateEncryptedData(encryptedData: string, salt: string): boolean {
    try {
        // Basic validation - check if it's valid base64 and has proper length
        if (!encryptedData || !salt) return false;

        // Check if the encrypted data looks like a valid AES encrypted string
        const decoded = CryptoJS.enc.Base64.parse(encryptedData);
        if (decoded.sigBytes < 16) return false; // AES blocks are at least 16 bytes

        // Check if salt is valid hex
        if (!/^[a-f0-9]+$/i.test(salt)) return false;

        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Secure comparison of hashes (timing attack resistant)
 */
export function secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;

    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
} 