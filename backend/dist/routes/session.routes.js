"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const session_controller_1 = require("../controllers/session.controller");
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const router = (0, express_1.Router)();
router.post('/start', auth_1.authMiddleware, session_controller_1.startExam);
router.post('/:sessionId/answer', auth_1.authMiddleware, upload.array('images', 3), session_controller_1.saveAnswer);
router.post('/:sessionId/submit', auth_1.authMiddleware, session_controller_1.submitExam);
router.get('/:sessionId/result', auth_1.authMiddleware, session_controller_1.getResult);
router.get('/last', auth_1.authMiddleware, session_controller_1.getLastExam);
router.get('/performance', auth_1.authMiddleware, session_controller_1.getPerformanceSummary);
exports.default = router;
//# sourceMappingURL=session.routes.js.map