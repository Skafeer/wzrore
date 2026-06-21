import { Router } from 'express';
import { authMiddleware, adminMiddleware, requirePermission } from '../middleware/auth';
import {
  redeemCode, getMySubscription,
  adminGetCodes, adminCreateCodes, adminDeleteCode,
  adminActivateSubscription, adminCancelSubscription,
  adminGetLaunchPeriod, adminSetLaunchPeriod,
} from '../controllers/subscription.controller';

const router = Router();

// Student
router.post('/redeem', authMiddleware, redeemCode);
router.get('/my', authMiddleware, getMySubscription);

// Admin
router.get('/admin/codes', adminMiddleware, requirePermission('subscriptions'), adminGetCodes);
router.post('/admin/codes', adminMiddleware, requirePermission('subscriptions'), adminCreateCodes);
router.delete('/admin/codes/:id', adminMiddleware, requirePermission('subscriptions'), adminDeleteCode);
router.post('/admin/activate', adminMiddleware, requirePermission('subscriptions'), adminActivateSubscription);
router.put('/admin/cancel/:userId', adminMiddleware, requirePermission('subscriptions'), adminCancelSubscription);
router.get('/admin/launch', adminMiddleware, requirePermission('subscriptions'), adminGetLaunchPeriod);
router.post('/admin/launch', adminMiddleware, requirePermission('subscriptions'), adminSetLaunchPeriod);

export default router;