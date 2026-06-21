import { Router } from 'express';
import multer from 'multer';
import { authMiddleware, adminMiddleware, requirePermission, superAdminMiddleware } from '../middleware/auth';
import { getProfile, updateProfile, changePassword, adminGetUsers, adminUpdateUser, adminUpdateUserFull, adminDeleteUser } from '../controllers/user.controller';
import { createReport, adminGetReports, adminUpdateReport, adminDeleteReport } from '../controllers/report.controller';
import { adminGetStats } from '../controllers/stats.controller';
import { adminGetAdmins, adminCreateAdmin, adminUpdateAdmin, adminDeleteAdmin } from '../controllers/admin.controller';
import { adminGetUserSessions } from '../controllers/session.controller';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

// Student
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, upload.single('avatar'), updateProfile);
router.put('/password', authMiddleware, changePassword);
router.post('/reports', authMiddleware, createReport);
router.get('/admin/users/:id/sessions', adminMiddleware, requirePermission('students'), adminGetUserSessions);
// Admin - Users
router.get('/admin/users', adminMiddleware, requirePermission('students'), adminGetUsers);
router.put('/admin/users/:id', adminMiddleware, requirePermission('students'), adminUpdateUser);
router.put('/admin/users/:id/full', adminMiddleware, requirePermission('students'), adminUpdateUserFull);
router.delete('/admin/users/:id', adminMiddleware, requirePermission('students'), adminDeleteUser);

// Admin - Reports
router.get('/admin/reports', adminMiddleware, requirePermission('reports'), adminGetReports);
router.put('/admin/reports/:id', adminMiddleware, requirePermission('reports'), adminUpdateReport);
router.delete('/admin/reports/:id', adminMiddleware, requirePermission('reports'), adminDeleteReport);

// Admin - Stats
router.get('/admin/stats', adminMiddleware, requirePermission('stats'), adminGetStats);

// Super Admin - Admins Management
router.get('/admin/admins', adminMiddleware, superAdminMiddleware, adminGetAdmins);
router.post('/admin/admins', adminMiddleware, superAdminMiddleware, adminCreateAdmin);
router.put('/admin/admins/:id', adminMiddleware, superAdminMiddleware, adminUpdateAdmin);
router.delete('/admin/admins/:id', adminMiddleware, superAdminMiddleware, adminDeleteAdmin);

export default router;