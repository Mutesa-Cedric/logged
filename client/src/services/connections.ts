import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import type { AxiosError } from 'axios';
import { useUser } from '@clerk/clerk-react';
import { api } from '../lib/api';

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

export interface TestConnectionData {
    host: string;
    port: number;
    username: string;
    password?: string;
    privateKey?: string;
    passphrase?: string;
}

// Query keys
export const connectionKeys = {
    all: ['connections'] as const,
    lists: () => [...connectionKeys.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...connectionKeys.lists(), { filters }] as const,
    details: () => [...connectionKeys.all, 'detail'] as const,
    detail: (id: string) => [...connectionKeys.details(), id] as const,
};

// API functions
const connectionAPI = {
    getConnections: async (): Promise<ServerConnection[]> => {
        const { data } = await api.get('/servers/connections');
        return data.connections || [];
    },

    getConnection: async (id: string): Promise<ServerConnection> => {
        const { data } = await api.get(`/servers/connections/${id}`);
        return data.connection;
    },

    createConnection: async (connectionData: CreateConnectionData): Promise<ServerConnection> => {
        const { data } = await api.post('/servers/connections', connectionData);
        return data.connection;
    },

    updateConnection: async (id: string, connectionData: Partial<CreateConnectionData>): Promise<ServerConnection> => {
        const { data } = await api.put(`/servers/connections/${id}`, connectionData);
        return data.connection;
    },

    deleteConnection: async (id: string): Promise<void> => {
        await api.delete(`/servers/connections/${id}`);
    },

    testConnection: async (connectionData: TestConnectionData): Promise<boolean> => {
        const { data } = await api.post('/servers/test-connection', connectionData);
        return data.success;
    },

    connectToServer: async (connectionId: string): Promise<void> => {
        await api.post(`/servers/connect/${connectionId}`);
    },

    disconnectFromServer: async (connectionId: string): Promise<void> => {
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

    return useQuery({
        queryKey: connectionKeys.lists(),
        queryFn: () => {
            console.log('🔗 Fetching connections...', { isLoaded, isSignedIn });
            return connectionAPI.getConnections();
        },
        enabled: isLoaded && isSignedIn, // Only run when user is authenticated
        staleTime: 30 * 1000, // 30 seconds
    });
};

export const useConnection = (id: string) => {
    const { isLoaded, isSignedIn } = useUser();

    return useQuery({
        queryKey: connectionKeys.detail(id),
        queryFn: () => connectionAPI.getConnection(id),
        enabled: isLoaded && isSignedIn && !!id, // Only run when authenticated and id exists
        staleTime: 60 * 1000, // 1 minute
    });
};

export const useCreateConnection = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: connectionAPI.createConnection,
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

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateConnectionData> }) =>
            connectionAPI.updateConnection(id, data),
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

    return useMutation({
        mutationFn: connectionAPI.deleteConnection,
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

    return useMutation({
        mutationFn: connectionAPI.connectToServer,
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