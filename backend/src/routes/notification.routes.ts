import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import {
  saveFcmToken,
  deleteFcmToken,
  adminSendToUser,
  adminSendToAll,
  adminGetNotifications,
} from '../controllers/notification.controller';

const router = Router();

// Student
router.post('/fcm-token', authMiddleware, saveFcmToken);
router.delete('/fcm-token', authMiddleware, deleteFcmToken);

// Admin
router.post('/admin/send-to-user', adminMiddleware, adminSendToUser);
router.post('/admin/send-to-all', adminMiddleware, adminSendToAll);
router.get('/admin/history', adminMiddleware, adminGetNotifications);

export default router;