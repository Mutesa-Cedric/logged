import { Router } from 'express';
import isAuthenticated, { AuthenticatedRequest, requireAuth } from '../../middlewares/auth';
import { userService } from '../database/userService';

const router = Router();

router.use(isAuthenticated);

router.post('/master-key', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
        const clerkId = req.clerkId!;
        const { encryptedData, salt, iv } = req.body;

        if (!encryptedData || !salt || !iv) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: encryptedData, salt, iv'
            });
        }

        await userService.saveMasterKey(clerkId, {
            encryptedData,
            salt,
            iv
        });

        res.json({
            success: true,
            message: 'Master key saved successfully'
        });
    } catch (error) {
        console.error('Save master key error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to save master key'
        });
    }
});

router.get('/master-key', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
        const clerkId = req.clerkId!;
        
        const masterKeyData = await userService.getMasterKey(clerkId);
        
        if (!masterKeyData) {
            return res.status(404).json({
                success: false,
                error: 'Master key not found'
            });
        }

        res.json({
            success: true,
            encryptedData: masterKeyData.encryptedData,
            salt: masterKeyData.salt,
            iv: masterKeyData.iv
        });
    } catch (error) {
        console.error('Get master key error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get master key'
        });
    }
});

router.delete('/master-key', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
        const clerkId = req.clerkId!;
        
        await userService.deleteMasterKey(clerkId);

        res.json({
            success: true,
            message: 'Master key deleted successfully'
        });
    } catch (error) {
        console.error('Delete master key error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete master key'
        });
    }
});

const encryptionRoutes = router;
export default encryptionRoutes;