import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { adminGetStats } from '../controllers/stats.controller';

const router = Router();

// GET /api/stats/admin
router.get('/admin', authMiddleware, adminMiddleware, adminGetStats);

export default router;