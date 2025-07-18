import { Router } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth";
import isAuthenticated from "../../middlewares/auth";
import { aiService } from "../ai/aiService";

const router = Router();

router.post('/chat/stream', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
        const { logs, messages } = req.body;

        console.log('AI Chat request body:', { logs: logs?.length, messages: messages?.length });

        if (!logs || !Array.isArray(logs) || logs.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Logs are required and must be a non-empty array'
            });
        }

        // Get the latest user message from the messages array
        const userMessages = messages?.filter((msg: any) => msg.role === 'user') || [];
        const latestMessage = userMessages[userMessages.length - 1];

        console.log('Latest message:', latestMessage);

        if (!latestMessage || !latestMessage.content || typeof latestMessage.content !== 'string' || latestMessage.content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Message is required and must be a non-empty string'
            });
        }

        if (!aiService.isAvailable()) {
            return res.status(503).json({
                success: false,
                error: 'AI service is not available. Please check OpenAI API key configuration.'
            });
        }

        // Set headers for AI SDK data stream format
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('x-vercel-ai-data-stream', 'v1');

        const result = await aiService.analyzeLogsStream({
            logs,
            message: latestMessage.content.trim(),
            conversationHistory: messages?.slice(0, -1) || []
        });

        // Stream the response in AI SDK data stream format
        // Buffer text to send meaningful chunks instead of individual characters
        let buffer = '';
        let wordCount = 0;
        
        for await (const delta of result.textStream) {
            buffer += delta;
            
            // Count words in buffer
            const words = buffer.split(/\s+/).filter(word => word.length > 0);
            wordCount = words.length;
            
            // Send chunk when we have multiple words or hit natural breakpoints
            if (wordCount >= 5 || 
                buffer.includes('\n\n') || 
                buffer.includes('. ') || 
                buffer.includes('! ') || 
                buffer.includes('? ') ||
                buffer.includes('**') ||
                buffer.includes('##') ||
                buffer.includes('###')) {
                
                if (buffer.trim()) {
                    res.write(`0:${JSON.stringify(buffer)}\n`);
                }
                buffer = '';
                wordCount = 0;
            }
        }
        
        // Send any remaining buffered content
        if (buffer.trim()) {
            res.write(`0:${JSON.stringify(buffer)}\n`);
        }

        // Send finish message with metadata
        res.write(`d:${JSON.stringify({
            finishReason: 'stop',
            usage: { promptTokens: 0, completionTokens: 0 }
        })}\n`);
        res.end();
    } catch (error) {
        console.error('AI chat stream error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to process AI chat request'
            });
        } else {
            res.write('\n\nError: ' + (error instanceof Error ? error.message : 'Failed to process AI chat request'));
            res.end();
        }
    }
});

router.post('/chat', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
        const { logs, message, conversationHistory } = req.body;

        if (!logs || !Array.isArray(logs) || logs.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Logs are required and must be a non-empty array'
            });
        }

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Message is required and must be a non-empty string'
            });
        }

        if (!aiService.isAvailable()) {
            return res.status(503).json({
                success: false,
                error: 'AI service is not available. Please check OpenAI API key configuration.'
            });
        }

        const result = await aiService.analyzeLogs({
            logs,
            message: message.trim(),
            conversationHistory
        });

        res.json({
            success: true,
            response: result.response,
            conversationHistory: result.conversationHistory
        });
    } catch (error) {
        console.error('AI chat error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to process AI chat request'
        });
    }
});

router.get('/status', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
        res.json({
            success: true,
            available: aiService.isAvailable()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to check AI status'
        });
    }
});

const aiRoutes = router;
export default aiRoutes;