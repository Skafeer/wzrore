"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const exam_controller_1 = require("../controllers/exam.controller");
const router = (0, express_1.Router)();
// Student routes
router.get('/', auth_1.authMiddleware, exam_controller_1.getExams);
router.get('/:subjectId/years', auth_1.authMiddleware, exam_controller_1.getAvailableYears);
router.get('/:subjectId/rounds', auth_1.authMiddleware, exam_controller_1.getAvailableRounds);
// Admin - Exams
router.get('/admin/all', auth_1.adminMiddleware, (0, auth_1.requirePermission)('exams'), exam_controller_1.adminGetExams);
router.post('/admin', auth_1.adminMiddleware, (0, auth_1.requirePermission)('exams'), exam_controller_1.adminCreateExam);
router.put('/admin/:id', auth_1.adminMiddleware, (0, auth_1.requirePermission)('exams'), exam_controller_1.adminUpdateExam);
router.delete('/admin/:id', auth_1.adminMiddleware, (0, auth_1.requirePermission)('exams'), exam_controller_1.adminDeleteExam);
// Admin - Questions
router.get('/admin/:examId/questions', auth_1.adminMiddleware, (0, auth_1.requirePermission)('exams'), exam_controller_1.adminGetQuestions);
router.post('/admin/:examId/questions', auth_1.adminMiddleware, (0, auth_1.requirePermission)('exams'), exam_controller_1.adminCreateQuestion);
router.put('/admin/questions/:id', auth_1.adminMiddleware, (0, auth_1.requirePermission)('exams'), exam_controller_1.adminUpdateQuestion);
router.delete('/admin/questions/:id', auth_1.adminMiddleware, (0, auth_1.requirePermission)('exams'), exam_controller_1.adminDeleteQuestion);
exports.default = router;
//# sourceMappingURL=exam.routes.js.map