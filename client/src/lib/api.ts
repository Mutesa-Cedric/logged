import { notifications } from '@mantine/notifications';
import type { AxiosError, AxiosResponse } from 'axios';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000';

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

api.interceptors.request.use(
    (config) => {
        let token = tokenManager.getToken();

        if (!token && typeof window !== 'undefined' && window.location.pathname.startsWith('/guest')) {
            token = 'guest-token';
            tokenManager.setToken(token);
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    (error: AxiosError) => {
        const status = error.response?.status;
        const message = (error.response?.data as { message?: string })?.message || error.message;
        const isGuestNotAllowed = (error.response?.data as { guestNotAllowed?: boolean })?.guestNotAllowed;

        // Handle different error types with more specific messages
        switch (status) {
            case 401:
                if (isGuestNotAllowed) {
                    notifications.show({
                        title: 'Account Required',
                        message: 'This feature requires an account. Please sign up or sign in to continue.',
                        color: 'blue',
                        autoClose: 7000,
                    });
                }
                // else {
                //     notifications.show({
                //         title: 'Authentication Error',
                //         message: 'Please sign in to continue',
                //         color: 'red',
                //         autoClose: 5000,
                //     });
                // }
                break;
            case 403:
                notifications.show({
                    title: 'Access Denied',
                    message: 'You do not have permission to perform this action',
                    color: 'red',
                    autoClose: 5000,
                });
                break;
            case 404:
                notifications.show({
                    title: 'Not Found',
                    message: 'The requested resource was not found',
                    color: 'orange',
                    autoClose: 4000,
                });
                break;
            case 408:
                notifications.show({
                    title: 'Request Timeout',
                    message: 'The request took too long. Please try again.',
                    color: 'yellow',
                    autoClose: 5000,
                });
                break;
            case 429:
                notifications.show({
                    title: 'Rate Limited',
                    message: 'Too many requests. Please wait a moment and try again.',
                    color: 'yellow',
                    autoClose: 6000,
                });
                break;
            case 500:
                notifications.show({
                    title: 'Server Error',
                    message: 'Internal server error. Our team has been notified.',
                    color: 'red',
                    autoClose: 6000,
                });
                break;
            case 502:
            case 503:
            case 504:
                notifications.show({
                    title: 'Service Unavailable',
                    message: 'The service is temporarily unavailable. Please try again in a few moments.',
                    color: 'red',
                    autoClose: 6000,
                });
                break;
            default:
                if (error.code === 'ECONNABORTED') {
                    notifications.show({
                        title: 'Connection Timeout',
                        message: 'The connection timed out. Please check your internet connection and try again.',
                        color: 'orange',
                        autoClose: 6000,
                    });
                } else if (error.code === 'ERR_NETWORK') {
                    notifications.show({
                        title: 'Network Error',
                        message: 'Unable to connect to the server. Please check your internet connection.',
                        color: 'red',
                        autoClose: 6000,
                    });
                } else if (status && status >= 400) {
                    notifications.show({
                        title: 'Error',
                        message: message || 'An unexpected error occurred. Please try again.',
                        color: 'red',
                        autoClose: 5000,
                    });
                }
        }

        return Promise.reject(error);
    }
);

export default api; 