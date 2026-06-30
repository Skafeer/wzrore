import { Router } from 'express';
import { adminMiddleware, requirePermission } from '../middleware/auth';
import { adminGetStats } from '../controllers/stats.controller';

const router = Router();

router.get('/admin', adminMiddleware, requirePermission('stats'), adminGetStats);

export default router;