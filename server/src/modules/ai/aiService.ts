import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export interface LogEntry {
    sessionId: string;
    data: string;
    timestamp: Date;
}

export interface AIChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface AIChatRequest {
    logs: LogEntry[];
    message: string;
    conversationHistory?: AIChatMessage[];
}

export interface AIChatResponse {
    response: string;
    conversationHistory: AIChatMessage[];
}

class AIService {
    private isConfigured: boolean = false;

    constructor() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (apiKey) {
            this.isConfigured = true;
        }
    }

    async analyzeLogsStream(request: AIChatRequest) {
        if (!this.isConfigured) {
            throw new Error('OpenAI API key not configured');
        }

        const { logs, message, conversationHistory = [] } = request;

        const systemPrompt = `You are a helpful AI assistant that analyzes log files. You can help users understand their logs, identify issues, patterns, and provide insights. 

                When analyzing logs:
                - Look for error patterns, warnings, and anomalies
                - Identify potential issues or bottlenecks
                - Provide actionable insights and recommendations
                - Be concise but thorough in your analysis
                - If you see security-related issues, highlight them
                - Suggest relevant commands or actions when appropriate
                    
                IMPORTANT: Format your responses with clear structure:
                - Use **bold** for section headers
                - Use bullet points (•) for lists
                - Use numbered lists for steps or sequences
                - Use \`code\` for technical terms, commands, or log entries
                - Use clear sections with headers like "## Issues Found", "## Recommendations", etc.
                - Keep paragraphs short and readable
                    
                Current log context: ${logs.length} log entries from ${logs[0]?.timestamp ? new Date(logs[0].timestamp).toLocaleString() : 'unknown time'} to ${logs[logs.length - 1]?.timestamp ? new Date(logs[logs.length - 1].timestamp).toLocaleString() : 'unknown time'}`;

        const logContext = logs.map((log, index) =>
            `[${index + 1}] ${new Date(log.timestamp).toLocaleTimeString()}: ${log.data}`
        ).join('\n');

        // Convert conversation history to the format expected by OpenAI
        const conversationMessages = conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        const messages: any[] = [
            {
                role: 'system',
                content: systemPrompt
            },
            ...conversationMessages,
            {
                role: 'user',
                content: `Here are the logs to analyze:\n\n${logContext}\n\nUser question: ${message}`
            }
        ];

        try {
            const result = await streamText({
                model: openai('gpt-4o-mini'),
                messages,
                maxTokens: 3000,
                temperature: 0.3,
            });

            return result;
        } catch (error) {
            console.error('OpenAI API error:', error);
            throw new Error('Failed to analyze logs with AI');
        }
    }

    async analyzeLogs(request: AIChatRequest): Promise<AIChatResponse> {
        if (!this.isConfigured) {
            throw new Error('OpenAI API key not configured');
        }

        const { logs, message, conversationHistory = [] } = request;

        const systemPrompt = `You are a helpful AI assistant that analyzes log files. You can help users understand their logs, identify issues, patterns, and provide insights. 

When analyzing logs:
- Look for error patterns, warnings, and anomalies
- Identify potential issues or bottlenecks
- Provide actionable insights and recommendations
- Be concise but thorough in your analysis
- If you see security-related issues, highlight them
- Suggest relevant commands or actions when appropriate

IMPORTANT: Format your responses with clear structure:
- Use **bold** for section headers
- Use bullet points (•) for lists
- Use numbered lists for steps or sequences
- Use \`code\` for technical terms, commands, or log entries
- Use clear sections with headers like "## Issues Found", "## Recommendations", etc.
- Keep paragraphs short and readable

Current log context: ${logs.length} log entries from ${logs[0]?.timestamp ? new Date(logs[0].timestamp).toLocaleString() : 'unknown time'} to ${logs[logs.length - 1]?.timestamp ? new Date(logs[logs.length - 1].timestamp).toLocaleString() : 'unknown time'}`;

        const logContext = logs.map((log, index) =>
            `[${index + 1}] ${new Date(log.timestamp).toLocaleTimeString()}: ${log.data}`
        ).join('\n');

        // Convert conversation history to the format expected by OpenAI
        const conversationMessages = conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        const messages: any[] = [
            {
                role: 'system',
                content: systemPrompt
            },
            ...conversationMessages,
            {
                role: 'user',
                content: `Here are the logs to analyze:\n\n${logContext}\n\nUser question: ${message}`
            }
        ];

        try {
            const result = await streamText({
                model: openai('gpt-4o-mini'),
                messages,
                maxTokens: 3000,
                temperature: 0.3,
            });

            let response = '';
            for await (const delta of result.textStream) {
                response += delta;
            }

            const updatedHistory: AIChatMessage[] = [
                ...conversationHistory,
                { role: 'user', content: message },
                { role: 'assistant', content: response }
            ];

            return {
                response,
                conversationHistory: updatedHistory
            };
        } catch (error) {
            console.error('OpenAI API error:', error);
            throw new Error('Failed to analyze logs with AI');
        }
    }

    isAvailable(): boolean {
        return this.isConfigured;
    }
}

export const aiService = new AIService(); 