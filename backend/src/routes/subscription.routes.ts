import { Router } from 'express';
import { authMiddleware, adminMiddleware, requirePermission } from '../middleware/auth';
import {
  redeemCode, getMySubscription,
  adminGetCodes, adminCreateCodes, adminActivateSubscription,
  adminGetLaunchPeriod, adminSetLaunchPeriod,
} from '../controllers/subscription.controller';

const router = Router();

// Student
router.post('/redeem', authMiddleware, redeemCode);
router.get('/my', authMiddleware, getMySubscription);

// Admin
router.get('/admin/codes', adminMiddleware, requirePermission('subscriptions'), adminGetCodes);
router.post('/admin/codes', adminMiddleware, requirePermission('subscriptions'), adminCreateCodes);
router.post('/admin/activate', adminMiddleware, requirePermission('subscriptions'), adminActivateSubscription);
router.get('/admin/launch', adminMiddleware, requirePermission('subscriptions'), adminGetLaunchPeriod);
router.post('/admin/launch', adminMiddleware, requirePermission('subscriptions'), adminSetLaunchPeriod);

export default router;