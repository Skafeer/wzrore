"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const notification_controller_1 = require("../controllers/notification.controller");
const router = (0, express_1.Router)();
// Student
router.post('/fcm-token', auth_1.authMiddleware, notification_controller_1.saveFcmToken);
// Admin
router.post('/admin/send-to-user', auth_1.adminMiddleware, notification_controller_1.adminSendToUser);
router.post('/admin/send-to-all', auth_1.adminMiddleware, notification_controller_1.adminSendToAll);
router.get('/admin/history', auth_1.adminMiddleware, notification_controller_1.adminGetNotifications);
exports.default = router;
//# sourceMappingURL=notification.routes.js.map