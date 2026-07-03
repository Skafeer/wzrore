import { Router } from 'express';
import { authMiddleware, adminMiddleware, requirePermission } from '../middleware/auth';
import {
  saveFcmToken,
  adminSendToUser,
  adminSendToAll,
  adminGetNotifications,
  adminSendToProvince,
  adminSendToSubscribed,
  adminScheduleNotification,
} from '../controllers/notification.controller';

const router = Router();

// Student
router.post('/fcm-token', authMiddleware, saveFcmToken);

// Admin
router.post('/admin/send-to-user', adminMiddleware, requirePermission('notifications'), adminSendToUser);
router.post('/admin/all', adminMiddleware, requirePermission('notifications'), adminSendToAll);
router.post('/admin/send-to-province', adminMiddleware, requirePermission('notifications'), adminSendToProvince);
router.post('/admin/send-to-subscribed', adminMiddleware, requirePermission('notifications'), adminSendToSubscribed);
router.post('/admin/schedule', adminMiddleware, requirePermission('notifications'), adminScheduleNotification);
router.get('/admin/history', adminMiddleware, requirePermission('notifications'), adminGetNotifications);

export default router;