import { Router } from 'express';
import { authMiddleware, adminMiddleware, requirePermission } from '../middleware/auth';
import {
  getExams, getAvailableYears, getAvailableRounds,
  adminGetExams, adminCreateExam, adminUpdateExam, adminDeleteExam,
  adminGetQuestions, adminCreateQuestion, adminUpdateQuestion, adminDeleteQuestion,
} from '../controllers/exam.controller';

const router = Router();


// Student routes
router.get('/', authMiddleware, getExams);
router.get('/:subjectId/years', authMiddleware, getAvailableYears);
router.get('/:subjectId/rounds', authMiddleware, getAvailableRounds);

// Admin - Exams
router.get('/admin/all', adminMiddleware, requirePermission('exams'), adminGetExams);
router.post('/admin', adminMiddleware, requirePermission('exams'), adminCreateExam);
router.put('/admin/:id', adminMiddleware, requirePermission('exams'), adminUpdateExam);
router.delete('/admin/:id', adminMiddleware, requirePermission('exams'), adminDeleteExam);

// Admin - Questions
router.get('/admin/:examId/questions', adminMiddleware, requirePermission('exams'), adminGetQuestions);
router.post('/admin/:examId/questions', adminMiddleware, requirePermission('exams'), adminCreateQuestion);
router.put('/admin/questions/:id', adminMiddleware, requirePermission('exams'), adminUpdateQuestion);
router.delete('/admin/questions/:id', adminMiddleware, requirePermission('exams'), adminDeleteQuestion);

export default router;