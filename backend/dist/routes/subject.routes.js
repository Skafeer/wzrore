"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const subject_controller_1 = require("../controllers/subject.controller");
const router = (0, express_1.Router)();
// Student routes
router.get('/', auth_1.authMiddleware, subject_controller_1.getSubjects);
router.get('/:subjectId/chapters', auth_1.authMiddleware, subject_controller_1.getChaptersBySubject);
router.get('/chapters/:chapterId/topics', auth_1.authMiddleware, subject_controller_1.getTopicsByChapter);
// Admin routes - Subjects
router.get('/admin/all', auth_1.adminMiddleware, (0, auth_1.requirePermission)('subjects'), subject_controller_1.adminGetSubjects);
router.post('/admin', auth_1.adminMiddleware, (0, auth_1.requirePermission)('subjects'), subject_controller_1.createSubject);
router.put('/admin/:id', auth_1.adminMiddleware, (0, auth_1.requirePermission)('subjects'), subject_controller_1.updateSubject);
router.delete('/admin/:id', auth_1.adminMiddleware, (0, auth_1.requirePermission)('subjects'), subject_controller_1.deleteSubject);
// Admin routes - Chapters
router.get('/admin/:subjectId/chapters', auth_1.adminMiddleware, (0, auth_1.requirePermission)('subjects'), subject_controller_1.adminGetChapters);
router.post('/admin/:subjectId/chapters', auth_1.adminMiddleware, (0, auth_1.requirePermission)('subjects'), subject_controller_1.createChapter);
router.put('/admin/chapters/:id', auth_1.adminMiddleware, (0, auth_1.requirePermission)('subjects'), subject_controller_1.updateChapter);
router.delete('/admin/chapters/:id', auth_1.adminMiddleware, (0, auth_1.requirePermission)('subjects'), subject_controller_1.deleteChapter);
// Admin routes - Topics
router.get('/admin/chapters/:chapterId/topics', auth_1.adminMiddleware, (0, auth_1.requirePermission)('subjects'), subject_controller_1.getTopicsByChapter);
router.post('/admin/chapters/:chapterId/topics', auth_1.adminMiddleware, (0, auth_1.requirePermission)('subjects'), subject_controller_1.createTopic);
router.put('/admin/topics/:id', auth_1.adminMiddleware, (0, auth_1.requirePermission)('subjects'), subject_controller_1.updateTopic);
router.delete('/admin/topics/:id', auth_1.adminMiddleware, (0, auth_1.requirePermission)('subjects'), subject_controller_1.deleteTopic);
exports.default = router;
//# sourceMappingURL=subject.routes.js.map