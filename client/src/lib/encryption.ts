import CryptoJS from 'crypto-js';
import { api } from './api';

export interface EncryptedData {
    encryptedData: string;
    salt: string;
    iv: string;
}

export class EncryptionManager {
    private static instance: EncryptionManager;
    private masterKey: string | null = null;

    private constructor() {}

    static getInstance(): EncryptionManager {
        if (!EncryptionManager.instance) {
            EncryptionManager.instance = new EncryptionManager();
        }
        return EncryptionManager.instance;
    }

    setMasterKey(key: string): void {
        this.masterKey = key;
    }

    getMasterKey(): string | null {
        return this.masterKey;
    }

    hasMasterKey(): boolean {
        return this.masterKey !== null && this.masterKey.length > 0;
    }

    generateSalt(): string {
        return CryptoJS.lib.WordArray.random(16).toString();
    }

    generateIV(): string {
        return CryptoJS.lib.WordArray.random(16).toString();
    }

    deriveKey(password: string, salt: string): string {
        return CryptoJS.PBKDF2(password, salt, {
            keySize: 256 / 32,
            iterations: 10000
        }).toString();
    }

    encrypt(plaintext: string, userPassword?: string): EncryptedData {
        if (!plaintext) {
            throw new Error('Cannot encrypt empty data');
        }

        const password = userPassword || this.masterKey;
        if (!password) {
            throw new Error('No encryption key available');
        }

        const salt = this.generateSalt();
        const iv = this.generateIV();
        const key = this.deriveKey(password, salt);

        const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
            iv: CryptoJS.enc.Hex.parse(iv),
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

        return {
            encryptedData: encrypted.toString(),
            salt,
            iv
        };
    }

    decrypt(encryptedData: EncryptedData, userPassword?: string): string {
        if (!encryptedData.encryptedData || !encryptedData.salt || !encryptedData.iv) {
            throw new Error('Invalid encrypted data format');
        }

        const password = userPassword || this.masterKey;
        if (!password) {
            throw new Error('No decryption key available');
        }

        const key = this.deriveKey(password, encryptedData.salt);

        try {
            const decrypted = CryptoJS.AES.decrypt(encryptedData.encryptedData, key, {
                iv: CryptoJS.enc.Hex.parse(encryptedData.iv),
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });

            const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
            if (!plaintext) {
                throw new Error('Decryption failed - invalid key or corrupted data');
            }

            return plaintext;
        } catch (error) {
            throw new Error('Decryption failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    }

    encryptPassword(password: string, userKey?: string): EncryptedData {
        return this.encrypt(password, userKey);
    }

    decryptPassword(encryptedData: EncryptedData, userKey?: string): string {
        return this.decrypt(encryptedData, userKey);
    }

    encryptPrivateKey(privateKey: string, userKey?: string): EncryptedData {
        if (!privateKey.includes('-----BEGIN') || !privateKey.includes('-----END')) {
            throw new Error('Invalid private key format');
        }
        return this.encrypt(privateKey, userKey);
    }

    decryptPrivateKey(encryptedData: EncryptedData, userKey?: string): string {
        const decrypted = this.decrypt(encryptedData, userKey);
        if (!decrypted.includes('-----BEGIN') || !decrypted.includes('-----END')) {
            throw new Error('Decrypted data is not a valid private key');
        }
        return decrypted;
    }

    clearMasterKey(): void {
        this.masterKey = null;
    }

    generateSecurePassword(length: number = 32): string {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            password += charset[randomIndex];
        }
        return password;
    }

    encryptMasterKeyForStorage(masterKey: string, userId: string): EncryptedData {
        const salt = this.generateSalt();
        const userKey = this.deriveKey(userId, salt);
        
        const iv = this.generateIV();
        const encrypted = CryptoJS.AES.encrypt(masterKey, userKey, {
            iv: CryptoJS.enc.Hex.parse(iv),
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

        return {
            encryptedData: encrypted.toString(),
            salt,
            iv
        };
    }

    decryptMasterKeyFromStorage(encryptedData: EncryptedData, userId: string): string {
        const userKey = this.deriveKey(userId, encryptedData.salt);

        try {
            const decrypted = CryptoJS.AES.decrypt(encryptedData.encryptedData, userKey, {
                iv: CryptoJS.enc.Hex.parse(encryptedData.iv),
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });

            const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
            if (!plaintext) {
                throw new Error('Decryption failed - invalid user ID or corrupted data');
            }

            return plaintext;
        } catch (error) {
            throw new Error('Failed to decrypt master key: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    }

    async saveMasterKeyToDatabase(masterKey: string, userId: string): Promise<void> {
        const encryptedData = this.encryptMasterKeyForStorage(masterKey, userId);
        
        await api.post('/encryption/master-key', {
            encryptedData: encryptedData.encryptedData,
            salt: encryptedData.salt,
            iv: encryptedData.iv
        });
    }

    async loadMasterKeyFromDatabase(userId: string): Promise<string | null> {
        try {
            const response = await api.get('/encryption/master-key');
            
            const encryptedData: EncryptedData = {
                encryptedData: response.data.encryptedData,
                salt: response.data.salt,
                iv: response.data.iv
            };

            return this.decryptMasterKeyFromStorage(encryptedData, userId);
        } catch (error: any) {
            if (error.response?.status === 404) {
                return null;
            }
            console.warn('Failed to load master key from database:', error);
            return null;
        }
    }

    async initializeFromDatabase(userId: string): Promise<boolean> {
        const masterKey = await this.loadMasterKeyFromDatabase(userId);
        if (masterKey) {
            this.masterKey = masterKey;
            return true;
        }
        return false;
    }

    async resetEncryption(): Promise<void> {
        try {
            await api.delete('/encryption/master-key');
        } catch (error) {
            console.warn('Failed to delete master key from database:', error);
        }
        this.masterKey = null;
    }
}

export const encryptionManager = EncryptionManager.getInstance();

export const isLegacyEncryption = (data: unknown): boolean => {
    if (typeof data === 'string') {
        return true;
    }
    
    if (data && typeof data === 'object' && data !== null) {
        const obj = data as Record<string, unknown>;
        return typeof obj.encryptedData === 'string' && obj.salt === 'demo-salt';
    }
    
    return false;
};

export const migrateLegacyEncryption = (legacyData: string, masterKey: string): EncryptedData => {
    let plaintext: string;
    
    if (typeof legacyData === 'string') {
        try {
            plaintext = atob(legacyData);
        } catch {
            plaintext = legacyData;
        }
    } else {
        throw new Error('Invalid legacy data format');
    }
    
    return encryptionManager.encrypt(plaintext, masterKey);
};