import { Configuration, OpenAIApi } from 'openai';

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
    private openai: OpenAIApi | null = null;

    constructor() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (apiKey) {
            const configuration = new Configuration({
                apiKey: apiKey,
            });
            this.openai = new OpenAIApi(configuration);
        }
    }

    async analyzeLogs(request: AIChatRequest): Promise<AIChatResponse> {
        if (!this.openai) {
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

            Current log context: ${logs.length} log entries from ${logs[0]?.timestamp ? new Date(logs[0].timestamp).toLocaleString() : 'unknown time'} to ${logs[logs.length - 1]?.timestamp ? new Date(logs[logs.length - 1].timestamp).toLocaleString() : 'unknown time'}`;

        const logContext = logs.map((log, index) =>
            `[${index + 1}] ${new Date(log.timestamp).toLocaleTimeString()}: ${log.data}`
        ).join('\n');

        const messages: any[] = [
            {
                role: 'system',
                content: systemPrompt
            },
            ...conversationHistory,
            {
                role: 'user',
                content: `Here are the logs to analyze:\n\n${logContext}\n\nUser question: ${message}`
            }
        ];

        try {
            const completion = await this.openai.createChatCompletion({
                model: 'gpt-4.1-nano',
                messages,
                max_tokens: 3000,
                temperature: 0.3,
            });

            const response = completion.data.choices[0]?.message?.content || 'No response generated';

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
        return this.openai !== null;
    }
}

export const aiService = new AIService(); 