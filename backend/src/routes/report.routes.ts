import { Router } from 'express';
import { authMiddleware, adminMiddleware, requirePermission } from '../middleware/auth';
import {
  createReport, adminGetReports, adminGetReportStats,
  adminUpdateReport, adminDeleteReport,
} from '../controllers/report.controller';

const router = Router();

// Student
router.post('/', authMiddleware, createReport);

// Admin
router.get('/admin', adminMiddleware, requirePermission('reports'), adminGetReports);
router.get('/admin/stats', adminMiddleware, requirePermission('reports'), adminGetReportStats);
router.put('/admin/:id', adminMiddleware, requirePermission('reports'), adminUpdateReport);
router.delete('/admin/:id', adminMiddleware, requirePermission('reports'), adminDeleteReport);

export default router;