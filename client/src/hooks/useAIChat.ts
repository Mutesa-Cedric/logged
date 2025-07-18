import { useChat } from '@ai-sdk/react';
import { tokenManager } from '../lib/api';

interface LogEntry {
    sessionId: string;
    data: string;
    timestamp: Date;
}

export const useAIChat = (logs: LogEntry[]) => {
    const {
        messages,
        input,
        handleInputChange,
        handleSubmit,
        isLoading,
        error,
        append,
        setMessages,
        reload,
        stop
    } = useChat({
        api: `${import.meta.env.VITE_SERVER_URL || 'http://localhost:8000'}/api/ai/chat/stream`,
        body: {
            logs,
        },
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenManager.getToken() || 'guest-token'}`,
        },
        onError: (error) => {
            console.error('AI Chat error:', error);
        },
    });

    const sendMessage = async (message: string) => {
        if (!message.trim() || isLoading) return;

        await append({
            role: 'user',
            content: message,
        });
    };

    const clearMessages = () => {
        setMessages([]);
    };

    return {
        messages,
        input,
        handleInputChange,
        handleSubmit,
        isLoading,
        error,
        sendMessage,
        clearMessages,
        reload,
        stop
    };
}; 