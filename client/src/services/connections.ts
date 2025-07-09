import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import type { AxiosError } from 'axios';
import { useUser } from '@clerk/clerk-react';
import { useAtom } from 'jotai';
import { api } from '../lib/api';
import { isGuestModeAtom } from '../store/atoms';

export interface ServerConnection {
    id: string;
    name: string;
    host: string;
    port: number;
    username: string;
    encryptedPassword?: string;
    encryptedPrivateKey?: string;
    encryptedPassphrase?: string;
    createdAt: string;
    updatedAt: string;
    lastUsed?: string;
    userId: string;
    // For guest mode only
    tempPassword?: string;
    tempPrivateKey?: string;
    tempPassphrase?: string;
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
    // For guest mode
    tempPassword?: string;
    tempPrivateKey?: string;
    tempPassphrase?: string;
}

export interface TestConnectionData {
    host: string;
    port: number;
    username: string;
    password?: string;
    privateKey?: string;
    passphrase?: string;
}

// Guest mode storage
const GUEST_CONNECTIONS_KEY = 'guest-connections';

const guestStorage = {
    getConnections: (): ServerConnection[] => {
        try {
            const stored = localStorage.getItem(GUEST_CONNECTIONS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    },

    setConnections: (connections: ServerConnection[]): void => {
        try {
            localStorage.setItem(GUEST_CONNECTIONS_KEY, JSON.stringify(connections));
        } catch (error) {
            console.error('Failed to save guest connections:', error);
        }
    },

    addConnection: (connection: Omit<ServerConnection, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): ServerConnection => {
        const connections = guestStorage.getConnections();
        const newConnection: ServerConnection = {
            ...connection,
            id: `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: 'guest-user',
        };
        connections.push(newConnection);
        guestStorage.setConnections(connections);
        return newConnection;
    },

    updateConnection: (id: string, updates: Partial<ServerConnection>): ServerConnection | null => {
        const connections = guestStorage.getConnections();
        const index = connections.findIndex(conn => conn.id === id);
        if (index === -1) return null;

        connections[index] = {
            ...connections[index],
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        guestStorage.setConnections(connections);
        return connections[index];
    },

    deleteConnection: (id: string): boolean => {
        const connections = guestStorage.getConnections();
        const filtered = connections.filter(conn => conn.id !== id);
        if (filtered.length === connections.length) return false;
        guestStorage.setConnections(filtered);
        return true;
    },

    clearConnections: (): void => {
        localStorage.removeItem(GUEST_CONNECTIONS_KEY);
    },
};

// Query keys
export const connectionKeys = {
    all: ['connections'] as const,
    lists: () => [...connectionKeys.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...connectionKeys.lists(), { filters }] as const,
    details: () => [...connectionKeys.all, 'detail'] as const,
    detail: (id: string) => [...connectionKeys.details(), id] as const,
    guest: ['guest-connections'] as const,
};

// API functions
const connectionAPI = {
    getConnections: async (isGuest: boolean = false): Promise<ServerConnection[]> => {
        if (isGuest) {
            return guestStorage.getConnections();
        }
        const { data } = await api.get('/servers/connections');
        return data.connections || [];
    },

    getConnection: async (id: string, isGuest: boolean = false): Promise<ServerConnection> => {
        if (isGuest) {
            const connections = guestStorage.getConnections();
            const connection = connections.find(conn => conn.id === id);
            if (!connection) throw new Error('Connection not found');
            return connection;
        }
        const { data } = await api.get(`/servers/connections/${id}`);
        return data.connection;
    },

    createConnection: async (connectionData: CreateConnectionData, isGuest: boolean = false): Promise<ServerConnection> => {
        if (isGuest) {
            const { encryptedPassword, ...rest } = connectionData;
            let transformedEncryptedPassword: string | undefined = undefined;
            if (encryptedPassword) {
                // Store as JSON string for guest storage
                transformedEncryptedPassword = JSON.stringify(encryptedPassword);
            }
            // @ts-expect-error: We are intentionally transforming the type for guest storage
            return guestStorage.addConnection({
                ...rest,
                encryptedPassword: transformedEncryptedPassword,
            });
        }
        const { data } = await api.post('/servers/connections', connectionData);
        return data.connection;
    },

    updateConnection: async (id: string, connectionData: Partial<CreateConnectionData>, isGuest: boolean = false): Promise<ServerConnection> => {
        if (isGuest) {
            // Transform encryptedPassword to string if present, to match guestStorage expectations
            const { encryptedPassword, ...rest } = connectionData;
            let transformedEncryptedPassword: string | undefined = undefined;
            if (encryptedPassword) {
                // Store as JSON string for guest storage
                transformedEncryptedPassword = JSON.stringify(encryptedPassword);
            }
            // @ts-expect-error: We are intentionally transforming the type for guest storage
            const updated = guestStorage.updateConnection(id, {
                ...rest,
                encryptedPassword: transformedEncryptedPassword,
            });
            if (!updated) throw new Error('Connection not found');
            return updated;
        }
        const { data } = await api.put(`/servers/connections/${id}`, connectionData);
        return data.connection;
    },

    deleteConnection: async (id: string, isGuest: boolean = false): Promise<void> => {
        if (isGuest) {
            const success = guestStorage.deleteConnection(id);
            if (!success) throw new Error('Connection not found');
            return;
        }
        await api.delete(`/servers/connections/${id}`);
    },

    testConnection: async (connectionData: TestConnectionData): Promise<boolean> => {
        // Convert guest connection to test format for API
        const testData = {
            ...connectionData,
            id: `test-${Date.now()}`, // Temporary ID for testing
        };

        const { data } = await api.post('/servers/test-connection', testData);
        return data.success;
    },

    connectToServer: async (connectionId: string, isGuest: boolean = false): Promise<void> => {
        if (isGuest) {
            // For guest connections, we need to send the raw connection data
            const connection = guestStorage.getConnections().find(conn => conn.id === connectionId);
            if (!connection) throw new Error('Connection not found');

            const connectionData = {
                id: connection.id,
                name: connection.name,
                host: connection.host,
                port: connection.port,
                username: connection.username,
                password: connection.tempPassword,
                privateKey: connection.tempPrivateKey,
                passphrase: connection.tempPassphrase,
            };

            // Use test-connection endpoint for guest connections since they're temporary
            const { data } = await api.post('/servers/test-connection', connectionData);
            if (!data.success) throw new Error('Failed to connect');

            // Update last used
            guestStorage.updateConnection(connectionId, { lastUsed: new Date().toISOString() });
            return;
        }
        await api.post(`/servers/connect/${connectionId}`);
    },

    disconnectFromServer: async (connectionId: string): Promise<void> => {
        // This works the same for both guest and authenticated users
        await api.post(`/servers/disconnect/${connectionId}`);
    },

    getActiveConnections: async (): Promise<string[]> => {
        const { data } = await api.get('/servers/active-connections');
        return data.connections || [];
    },
};

// React Query hooks
export const useConnections = () => {
    const { isLoaded, isSignedIn } = useUser();
    const [isGuestMode] = useAtom(isGuestModeAtom);

    return useQuery({
        queryKey: isGuestMode ? connectionKeys.guest : connectionKeys.lists(),
        queryFn: () => {
            console.log('🔗 Fetching connections...', { isLoaded, isSignedIn, isGuestMode });
            return connectionAPI.getConnections(isGuestMode);
        },
        enabled: isGuestMode || (isLoaded && isSignedIn), // Enable for guest mode or authenticated users
        staleTime: 30 * 1000, // 30 seconds
    });
};

export const useConnection = (id: string) => {
    const { isLoaded, isSignedIn } = useUser();
    const [isGuestMode] = useAtom(isGuestModeAtom);

    return useQuery({
        queryKey: connectionKeys.detail(id),
        queryFn: () => connectionAPI.getConnection(id, isGuestMode),
        enabled: (isGuestMode || (isLoaded && isSignedIn)) && !!id, // Enable for guest mode or authenticated users with valid ID
        staleTime: 60 * 1000, // 1 minute
    });
};

export const useCreateConnection = () => {
    const queryClient = useQueryClient();
    const [isGuestMode] = useAtom(isGuestModeAtom);

    return useMutation({
        mutationFn: (connectionData: CreateConnectionData) =>
            connectionAPI.createConnection(connectionData, isGuestMode),
        onSuccess: (newConnection) => {
            queryClient.invalidateQueries({ queryKey: connectionKeys.lists() });
            notifications.show({
                title: 'Success',
                message: `Connection "${newConnection.name}" created successfully`,
                color: 'green',
            });
        },
        onError: (error: AxiosError<{ error: string }>) => {
            notifications.show({
                title: 'Error',
                message: error.response?.data?.error || 'Failed to create connection',
                color: 'red',
            });
        },
    });
};

export const useUpdateConnection = () => {
    const queryClient = useQueryClient();
    const [isGuestMode] = useAtom(isGuestModeAtom);

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateConnectionData> }) =>
            connectionAPI.updateConnection(id, data, isGuestMode),
        onSuccess: (updatedConnection) => {
            queryClient.invalidateQueries({ queryKey: connectionKeys.lists() });
            queryClient.invalidateQueries({ queryKey: connectionKeys.detail(updatedConnection.id) });
            notifications.show({
                title: 'Success',
                message: `Connection "${updatedConnection.name}" updated successfully`,
                color: 'green',
            });
        },
        onError: (error: AxiosError<{ error: string }>) => {
            notifications.show({
                title: 'Error',
                message: error.response?.data?.error || 'Failed to update connection',
                color: 'red',
            });
        },
    });
};

export const useDeleteConnection = () => {
    const queryClient = useQueryClient();
    const [isGuestMode] = useAtom(isGuestModeAtom);

    return useMutation({
        mutationFn: (id: string) => connectionAPI.deleteConnection(id, isGuestMode),
        onSuccess: (_, connectionId) => {
            queryClient.invalidateQueries({ queryKey: connectionKeys.lists() });
            queryClient.removeQueries({ queryKey: connectionKeys.detail(connectionId) });
            notifications.show({
                title: 'Success',
                message: 'Connection deleted successfully',
                color: 'green',
            });
        },
        onError: (error: AxiosError<{ error: string }>) => {
            notifications.show({
                title: 'Error',
                message: error.response?.data?.error || 'Failed to delete connection',
                color: 'red',
            });
        },
    });
};

export const useTestConnection = () => {
    return useMutation({
        mutationFn: connectionAPI.testConnection,
        onSuccess: (success, variables) => {
            notifications.show({
                title: success ? 'Connection Successful' : 'Connection Failed',
                message: success
                    ? `Successfully connected to ${variables.host}`
                    : `Failed to connect to ${variables.host}`,
                color: success ? 'green' : 'red',
            });
        },
        onError: (error: AxiosError<{ error: string }>) => {
            notifications.show({
                title: 'Connection Test Failed',
                message: error.response?.data?.error || 'Failed to test connection',
                color: 'red',
            });
        },
    });
};

export const useConnectToServer = () => {
    const queryClient = useQueryClient();
    const [isGuestMode] = useAtom(isGuestModeAtom);

    return useMutation({
        mutationFn: (connectionId: string) => connectionAPI.connectToServer(connectionId, isGuestMode),
        onSuccess: (_, connectionId) => {
            queryClient.invalidateQueries({ queryKey: connectionKeys.lists() });
            queryClient.invalidateQueries({ queryKey: connectionKeys.detail(connectionId) });
            notifications.show({
                title: 'Connected',
                message: 'Successfully connected to server',
                color: 'green',
            });
        },
        onError: (error: AxiosError<{ error: string }>) => {
            notifications.show({
                title: 'Connection Failed',
                message: error.response?.data?.error || 'Failed to connect to server',
                color: 'red',
            });
        },
    });
};

export const useDisconnectFromServer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: connectionAPI.disconnectFromServer,
        onSuccess: (_, connectionId) => {
            queryClient.invalidateQueries({ queryKey: connectionKeys.lists() });
            queryClient.invalidateQueries({ queryKey: connectionKeys.detail(connectionId) });
            notifications.show({
                title: 'Disconnected',
                message: 'Disconnected from server',
                color: 'blue',
            });
        },
        onError: (error: AxiosError<{ error: string }>) => {
            notifications.show({
                title: 'Disconnection Failed',
                message: error.response?.data?.error || 'Failed to disconnect from server',
                color: 'red',
            });
        },
    });
};

export const useActiveConnections = () => {
    return useQuery({
        queryKey: ['active-connections'],
        queryFn: connectionAPI.getActiveConnections,
        refetchInterval: 5000, // Refresh every 5 seconds
        staleTime: 10 * 1000, // 10 seconds
    });
}; 