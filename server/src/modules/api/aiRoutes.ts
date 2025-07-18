import { Router } from "express";
import { AuthenticatedRequest, requireAuth } from "../../middlewares/auth";
import { aiService } from "../ai/aiService";

const router = Router();

router.post('/chat', requireAuth, async (req: AuthenticatedRequest, res) => {
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

router.get('/status', requireAuth, async (req: AuthenticatedRequest, res) => {
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