import { QueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import type { AxiosError } from 'axios';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            retry: (failureCount, error: Error) => {
                const axiosError = error as AxiosError;
                if (axiosError?.response?.status && axiosError.response.status >= 400 && axiosError.response.status < 500) {
                    if (![408, 429].includes(axiosError.response.status)) {
                        return false;
                    }
                }
                return failureCount < 3;
            },
            refetchOnWindowFocus: false,
            refetchOnReconnect: 'always',
        },
        mutations: {
            onError: (error: Error) => {
                const axiosError = error as AxiosError<{ message: string }>;
                const message = axiosError?.response?.data?.message || axiosError?.message || 'An error occurred';
                notifications.show({
                    title: 'Error',
                    message,
                    color: 'red',
                    autoClose: 5000,
                });
            },
        },
    },
}); 