import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware, requirePermission } from '../middleware/auth';
import {
  getSubjects, getChaptersBySubject, getTopicsByChapter,
  adminGetSubjects, createSubject, updateSubject, deleteSubject,
  adminGetChapters, createChapter, updateChapter, deleteChapter,
  createTopic, updateTopic, deleteTopic,
} from '../controllers/subject.controller';

const router = Router();

// Student routes
router.get('/', authMiddleware, getSubjects);
router.get('/:subjectId/chapters', authMiddleware, getChaptersBySubject);
router.get('/chapters/:chapterId/topics', authMiddleware, getTopicsByChapter);

// Admin routes
router.get('/admin/all', adminMiddleware, requirePermission('subjects'), adminGetSubjects);
router.post('/admin', adminMiddleware, requirePermission('subjects'), createSubject);
router.put('/admin/:id', adminMiddleware, requirePermission('subjects'), updateSubject);
router.delete('/admin/:id', adminMiddleware, requirePermission('subjects'), deleteSubject);

router.get('/admin/:subjectId/chapters', adminMiddleware, requirePermission('subjects'), adminGetChapters);
router.post('/admin/:subjectId/chapters', adminMiddleware, requirePermission('subjects'), createChapter);
router.put('/admin/chapters/:id', adminMiddleware, requirePermission('subjects'), updateChapter);
router.delete('/admin/chapters/:id', adminMiddleware, requirePermission('subjects'), deleteChapter);

router.post('/admin/chapters/:chapterId/topics', adminMiddleware, requirePermission('subjects'), createTopic);
router.put('/admin/topics/:id', adminMiddleware, requirePermission('subjects'), updateTopic);
router.delete('/admin/topics/:id', adminMiddleware, requirePermission('subjects'), deleteTopic);

export default router;