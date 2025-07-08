import { notifications } from '@mantine/notifications';
import type { AxiosError, AxiosResponse } from 'axios';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000';

// Token manager for Clerk authentication
class TokenManager {
    private token: string | null = null;

    setToken(token: string | null) {
        this.token = token;
    }

    getToken(): string | null {
        return this.token;
    }
}

export const tokenManager = new TokenManager();

export const api = axios.create({
    baseURL: `${BASE_URL}/api`,
    timeout: 30000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for auth
api.interceptors.request.use(
    (config) => {
        // Add auth token from Clerk if available
        const token = tokenManager.getToken();
        console.log('🔑 API Request Debug:', {
            url: config.url,
            hasToken: !!token,
            tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token'
        });

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    (error: AxiosError) => {
        const status = error.response?.status;
        const message = (error.response?.data as { message?: string })?.message || error.message;

        // Handle different error types
        switch (status) {
            case 401:
                console.log('❌ 401 Unauthorized - Token might be invalid or missing');
                notifications.show({
                    title: 'Authentication Error',
                    message: 'Please sign in to continue',
                    color: 'red',
                });
                break;
            case 403:
                notifications.show({
                    title: 'Access Denied',
                    message: 'You do not have permission to perform this action',
                    color: 'red',
                });
                break;
            case 404:
                notifications.show({
                    title: 'Not Found',
                    message: 'The requested resource was not found',
                    color: 'orange',
                });
                break;
            case 429:
                notifications.show({
                    title: 'Rate Limited',
                    message: 'Too many requests. Please try again later',
                    color: 'yellow',
                });
                break;
            case 500:
                notifications.show({
                    title: 'Server Error',
                    message: 'Internal server error. Please try again later',
                    color: 'red',
                });
                break;
            default:
                if (status && status >= 400) {
                    notifications.show({
                        title: 'Error',
                        message: message || 'An unexpected error occurred',
                        color: 'red',
                    });
                }
        }

        return Promise.reject(error);
    }
);

export default api; 