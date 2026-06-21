import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth';
import {
  startExam,
  saveAnswer,
  submitExam,
  getResult,
  getLastExam,
  getPerformanceSummary,
  adminGetUserSessions, 
} from '../controllers/session.controller';

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

router.post('/start', authMiddleware, startExam);
router.post('/:sessionId/answer', authMiddleware, upload.array('images', 3), saveAnswer);
router.post('/:sessionId/submit', authMiddleware, submitExam);
router.get('/:sessionId/result', authMiddleware, getResult);
router.get('/last', authMiddleware, getLastExam);
router.get('/performance', authMiddleware, getPerformanceSummary);


router.get('/admin/user/:userId', authMiddleware, adminGetUserSessions);

export default router;