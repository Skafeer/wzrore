"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const user_controller_1 = require("../controllers/user.controller");
const report_controller_1 = require("../controllers/report.controller");
const stats_controller_1 = require("../controllers/stats.controller");
const admin_controller_1 = require("../controllers/admin.controller");
const session_controller_1 = require("../controllers/session.controller");
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const router = (0, express_1.Router)();
// Student
router.get('/profile', auth_1.authMiddleware, user_controller_1.getProfile);
router.put('/profile', auth_1.authMiddleware, upload.single('avatar'), user_controller_1.updateProfile);
router.put('/password', auth_1.authMiddleware, user_controller_1.changePassword);
router.post('/reports', auth_1.authMiddleware, report_controller_1.createReport);
router.get('/admin/users/:id/sessions', auth_1.adminMiddleware, (0, auth_1.requirePermission)('students'), session_controller_1.adminGetUserSessions);
// Admin - Users
router.get('/admin/users', auth_1.adminMiddleware, (0, auth_1.requirePermission)('students'), user_controller_1.adminGetUsers);
router.put('/admin/users/:id', auth_1.adminMiddleware, (0, auth_1.requirePermission)('students'), user_controller_1.adminUpdateUser);
router.put('/admin/users/:id/full', auth_1.adminMiddleware, (0, auth_1.requirePermission)('students'), user_controller_1.adminUpdateUserFull);
router.delete('/admin/users/:id', auth_1.adminMiddleware, (0, auth_1.requirePermission)('students'), user_controller_1.adminDeleteUser);
// Admin - Reports
router.get('/admin/reports', auth_1.adminMiddleware, (0, auth_1.requirePermission)('reports'), report_controller_1.adminGetReports);
router.put('/admin/reports/:id', auth_1.adminMiddleware, (0, auth_1.requirePermission)('reports'), report_controller_1.adminUpdateReport);
router.delete('/admin/reports/:id', auth_1.adminMiddleware, (0, auth_1.requirePermission)('reports'), report_controller_1.adminDeleteReport);
// Admin - Stats
router.get('/admin/stats', auth_1.adminMiddleware, (0, auth_1.requirePermission)('stats'), stats_controller_1.adminGetStats);
// Super Admin - Admins Management
router.get('/admin/admins', auth_1.adminMiddleware, auth_1.superAdminMiddleware, admin_controller_1.adminGetAdmins);
router.post('/admin/admins', auth_1.adminMiddleware, auth_1.superAdminMiddleware, admin_controller_1.adminCreateAdmin);
router.put('/admin/admins/:id', auth_1.adminMiddleware, auth_1.superAdminMiddleware, admin_controller_1.adminUpdateAdmin);
router.delete('/admin/admins/:id', auth_1.adminMiddleware, auth_1.superAdminMiddleware, admin_controller_1.adminDeleteAdmin);
exports.default = router;
//# sourceMappingURL=user.routes.js.map