import { prisma } from '../../utils/database';
import { validateEncryptedData } from '../../utils/encryption';
import type { User, ServerConnection } from '@prisma/client';

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
    };
    encryptedPrivateKey?: {
        encryptedData: string;
        salt: string;
    };
    encryptedPassphrase?: {
        encryptedData: string;
        salt: string;
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
     * Create a new server connection for a user
     */
    async createConnection(
        clerkId: string,
        connectionData: CreateConnectionData
    ): Promise<ServerConnection> {
        try {
            // First get the user
            const user = await this.getUserByClerkId(clerkId);
            if (!user) {
                throw new Error('User not found');
            }

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
                        ? `${connectionData.encryptedPassword.encryptedData}:${connectionData.encryptedPassword.salt}`
                        : null,
                    encryptedPrivateKey: connectionData.encryptedPrivateKey
                        ? `${connectionData.encryptedPrivateKey.encryptedData}:${connectionData.encryptedPrivateKey.salt}`
                        : null,
                    encryptedPassphrase: connectionData.encryptedPassphrase
                        ? `${connectionData.encryptedPassphrase.encryptedData}:${connectionData.encryptedPassphrase.salt}`
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
            const user = await this.getUserByClerkId(clerkId);
            if (!user) {
                return [];
            }

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
            const user = await this.getUserByClerkId(clerkId);
            if (!user) {
                return null;
            }

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
            const user = await this.getUserByClerkId(clerkId);
            if (!user) {
                throw new Error('User not found');
            }

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
                updatePayload.encryptedPassword = `${updateData.encryptedPassword.encryptedData}:${updateData.encryptedPassword.salt}`;
            }

            if (updateData.encryptedPrivateKey) {
                updatePayload.encryptedPrivateKey = `${updateData.encryptedPrivateKey.encryptedData}:${updateData.encryptedPrivateKey.salt}`;
            }

            if (updateData.encryptedPassphrase) {
                updatePayload.encryptedPassphrase = `${updateData.encryptedPassphrase.encryptedData}:${updateData.encryptedPassphrase.salt}`;
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
            const user = await this.getUserByClerkId(clerkId);
            if (!user) {
                return false;
            }

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
            const user = await this.getUserByClerkId(clerkId);
            if (!user) return;

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