import { prisma } from '../../utils/database';
import { validateEncryptedData } from '../../utils/encryption';
import type { User, ServerConnection } from '@prisma/client';
import CryptoJS from 'crypto-js';

export interface CreateUserData {
    clerkId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    imageUrl?: string;
}

export interface CreateConnectionData {
    name: string;
    host: string;
    port: number;
    username: string;
    encryptedPassword?: {
        encryptedData: string;
        salt: string;
        iv?: string;
    };
    encryptedPrivateKey?: {
        encryptedData: string;
        salt: string;
        iv?: string;
    };
    encryptedPassphrase?: {
        encryptedData: string;
        salt: string;
        iv?: string;
    };
}

export interface UserWithConnections extends User {
    connections: ServerConnection[];
}

export class UserService {
    /**
     * Create or update user from Clerk webhook/auth
     */
    async upsertUser(userData: CreateUserData): Promise<User> {
        try {
            const user = await prisma.user.upsert({
                where: { clerkId: userData.clerkId },
                update: {
                    email: userData.email,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    username: userData.username,
                    imageUrl: userData.imageUrl,
                    updatedAt: new Date()
                },
                create: {
                    clerkId: userData.clerkId,
                    email: userData.email,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    username: userData.username,
                    imageUrl: userData.imageUrl
                }
            });

            return user;
        } catch (error) {
            console.error('Error upserting user:', error);
            throw new Error('Failed to create/update user');
        }
    }

    /**
     * Get user by Clerk ID
     */
    async getUserByClerkId(clerkId: string): Promise<User | null> {
        try {
            return await prisma.user.findUnique({
                where: { clerkId }
            });
        } catch (error) {
            console.error('Error getting user by Clerk ID:', error);
            return null;
        }
    }

    /**
     * Get user with their connections
     */
    async getUserWithConnections(clerkId: string): Promise<UserWithConnections | null> {
        try {
            return await prisma.user.findUnique({
                where: { clerkId },
                include: {
                    connections: {
                        orderBy: { updatedAt: 'desc' }
                    }
                }
            });
        } catch (error) {
            console.error('Error getting user with connections:', error);
            return null;
        }
    }

    /**
     * Ensure user exists, create with basic info if not
     */
    async ensureUserExists(clerkId: string): Promise<User> {
        try {
            let user = await this.getUserByClerkId(clerkId);

            if (!user) {
                // Create user with basic info when they don't exist
                user = await prisma.user.create({
                    data: {
                        clerkId,
                        email: `${clerkId}@clerk.user`, // Temporary email
                        firstName: null,
                        lastName: null,
                        username: null,
                        imageUrl: null
                    }
                }); 
            }

            return user;
        } catch (error) {
            console.error('Error ensuring user exists:', error);
            throw new Error('Failed to ensure user exists');
        }
    }

    /**
     * Create a new server connection for a user
     */
    async createConnection(
        clerkId: string,
        connectionData: CreateConnectionData
    ): Promise<ServerConnection> {
        try {
            // Ensure user exists, create if needed
            const user = await this.ensureUserExists(clerkId);

            // Validate encrypted data if provided
            if (connectionData.encryptedPassword) {
                if (!validateEncryptedData(
                    connectionData.encryptedPassword.encryptedData,
                    connectionData.encryptedPassword.salt
                )) {
                    throw new Error('Invalid encrypted password data');
                }
            }

            if (connectionData.encryptedPrivateKey) {
                if (!validateEncryptedData(
                    connectionData.encryptedPrivateKey.encryptedData,
                    connectionData.encryptedPrivateKey.salt
                )) {
                    throw new Error('Invalid encrypted private key data');
                }
            }

            if (connectionData.encryptedPassphrase) {
                if (!validateEncryptedData(
                    connectionData.encryptedPassphrase.encryptedData,
                    connectionData.encryptedPassphrase.salt
                )) {
                    throw new Error('Invalid encrypted passphrase data');
                }
            }

            // Create the connection
            const connection = await prisma.serverConnection.create({
                data: {
                    name: connectionData.name,
                    host: connectionData.host,
                    port: connectionData.port,
                    username: connectionData.username,
                    encryptedPassword: connectionData.encryptedPassword
                        ? `${connectionData.encryptedPassword.encryptedData}:${connectionData.encryptedPassword.salt}:${connectionData.encryptedPassword.iv || ''}`
                        : null,
                    encryptedPrivateKey: connectionData.encryptedPrivateKey
                        ? `${connectionData.encryptedPrivateKey.encryptedData}:${connectionData.encryptedPrivateKey.salt}:${connectionData.encryptedPrivateKey.iv || ''}`
                        : null,
                    encryptedPassphrase: connectionData.encryptedPassphrase
                        ? `${connectionData.encryptedPassphrase.encryptedData}:${connectionData.encryptedPassphrase.salt}:${connectionData.encryptedPassphrase.iv || ''}`
                        : null,
                    userId: user.id
                }
            });

            return connection;
        } catch (error) {
            console.error('Error creating connection:', error);
            throw new Error('Failed to create connection');
        }
    }

    /**
     * Get user's connections
     */
    async getUserConnections(clerkId: string): Promise<ServerConnection[]> {
        try {
            const user = await this.ensureUserExists(clerkId);
            return await prisma.serverConnection.findMany({
                where: { userId: user.id },
                orderBy: { updatedAt: 'desc' }
            });
        } catch (error) {
            console.error('Error getting user connections:', error);
            return [];
        }
    }

    /**
     * Get a specific connection for a user
     */
    async getConnection(clerkId: string, connectionId: string): Promise<ServerConnection | null> {
        try {
            const user = await this.ensureUserExists(clerkId);
            return await prisma.serverConnection.findFirst({
                where: {
                    id: connectionId,
                    userId: user.id
                }
            });
        } catch (error) {
            console.error('Error getting connection:', error);
            return null;
        }
    }

    /**
     * Update a connection
     */
    async updateConnection(
        clerkId: string,
        connectionId: string,
        updateData: Partial<CreateConnectionData>
    ): Promise<ServerConnection | null> {
        try {
            const user = await this.ensureUserExists(clerkId);

            // Validate encrypted data if provided
            if (updateData.encryptedPassword) {
                if (!validateEncryptedData(
                    updateData.encryptedPassword.encryptedData,
                    updateData.encryptedPassword.salt
                )) {
                    throw new Error('Invalid encrypted password data');
                }
            }

            const updatePayload: any = {
                updatedAt: new Date()
            };

            if (updateData.name !== undefined) updatePayload.name = updateData.name;
            if (updateData.host !== undefined) updatePayload.host = updateData.host;
            if (updateData.port !== undefined) updatePayload.port = updateData.port;
            if (updateData.username !== undefined) updatePayload.username = updateData.username;

            if (updateData.encryptedPassword) {
                updatePayload.encryptedPassword = `${updateData.encryptedPassword.encryptedData}:${updateData.encryptedPassword.salt}:${updateData.encryptedPassword.iv || ''}`;
            }

            if (updateData.encryptedPrivateKey) {
                updatePayload.encryptedPrivateKey = `${updateData.encryptedPrivateKey.encryptedData}:${updateData.encryptedPrivateKey.salt}:${updateData.encryptedPrivateKey.iv || ''}`;
            }

            if (updateData.encryptedPassphrase) {
                updatePayload.encryptedPassphrase = `${updateData.encryptedPassphrase.encryptedData}:${updateData.encryptedPassphrase.salt}:${updateData.encryptedPassphrase.iv || ''}`;
            }

            return await prisma.serverConnection.update({
                where: {
                    id: connectionId,
                    userId: user.id
                },
                data: updatePayload
            });
        } catch (error) {
            console.error('Error updating connection:', error);
            throw new Error('Failed to update connection');
        }
    }

    /**
     * Delete a connection
     */
    async deleteConnection(clerkId: string, connectionId: string): Promise<boolean> {
        try {
            const user = await this.ensureUserExists(clerkId);

            await prisma.serverConnection.delete({
                where: {
                    id: connectionId,
                    userId: user.id
                }
            });

            return true;
        } catch (error) {
            console.error('Error deleting connection:', error);
            return false;
        }
    }

    /**
     * Update connection last used timestamp
     */
    async updateConnectionLastUsed(clerkId: string, connectionId: string): Promise<void> {
        try {
            const user = await this.ensureUserExists(clerkId);

            await prisma.serverConnection.update({
                where: {
                    id: connectionId,
                    userId: user.id
                },
                data: {
                    lastUsed: new Date()
                }
            });
        } catch (error) {
            console.error('Error updating connection last used:', error);
        }
    }

    /**
     * Save encrypted master key for user
     */
    async saveMasterKey(clerkId: string, encryptedData: {
        encryptedData: string;
        salt: string;
        iv: string;
    }): Promise<void> {
        try {
            const user = await this.ensureUserExists(clerkId);

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    encryptedMasterKey: encryptedData.encryptedData,
                    masterKeySalt: encryptedData.salt,
                    masterKeyIv: encryptedData.iv,
                    updatedAt: new Date()
                }
            });
        } catch (error) {
            console.error('Error saving master key:', error);
            throw new Error('Failed to save master key');
        }
    }

    /**
     * Get encrypted master key for user
     */
    async getMasterKey(clerkId: string): Promise<{
        encryptedData: string;
        salt: string;
        iv: string;
    } | null> {
        try {
            const user = await this.getUserByClerkId(clerkId);
            
            if (!user || !user.encryptedMasterKey || !user.masterKeySalt || !user.masterKeyIv) {
                return null;
            }

            return {
                encryptedData: user.encryptedMasterKey,
                salt: user.masterKeySalt,
                iv: user.masterKeyIv
            };
        } catch (error) {
            console.error('Error getting master key:', error);
            return null;
        }
    }

    /**
     * Decrypt and retrieve user's plaintext master key
     */
    async getDecryptedMasterKey(clerkId: string): Promise<string | null> {
        try {
            const encryptedMasterKeyData = await this.getMasterKey(clerkId);
            
            if (!encryptedMasterKeyData) {
                return null;
            }
            
                    
            // Derive the decryption key using clerkId (same method as client)
            const userKey = CryptoJS.PBKDF2(clerkId, encryptedMasterKeyData.salt, {
                keySize: 256 / 32,
                iterations: 10000
            }).toString();
            
            // Decrypt the master key using the same method as client
            const decryptedMasterKey = CryptoJS.AES.decrypt(encryptedMasterKeyData.encryptedData, userKey, {
                iv: CryptoJS.enc.Hex.parse(encryptedMasterKeyData.iv),
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            }).toString(CryptoJS.enc.Utf8);
            
            if (!decryptedMasterKey || decryptedMasterKey.length === 0) {
                console.error(`Failed to decrypt master key for user ${clerkId}`);
                return null;
            }
            
            return decryptedMasterKey;
        } catch (error) {
            console.error(`Error decrypting master key for user ${clerkId}:`, error);
            return null;
        }
    }

    /**
     * Delete encrypted master key for user
     */
    async deleteMasterKey(clerkId: string): Promise<void> {
        try {
            const user = await this.getUserByClerkId(clerkId);
            
            if (user) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        encryptedMasterKey: null,
                        masterKeySalt: null,
                        masterKeyIv: null,
                        updatedAt: new Date()
                    }
                });
            }
        } catch (error) {
            console.error('Error deleting master key:', error);
            throw new Error('Failed to delete master key');
        }
    }

    /**
     * Delete user and all their data
     */
    async deleteUser(clerkId: string): Promise<boolean> {
        try {
            await prisma.user.delete({
                where: { clerkId }
            });
            return true;
        } catch (error) {
            console.error('Error deleting user:', error);
            return false;
        }
    }
}

export const userService = new UserService(); 