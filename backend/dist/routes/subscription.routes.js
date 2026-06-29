"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const subscription_controller_1 = require("../controllers/subscription.controller");
const router = (0, express_1.Router)();
// Student
router.post('/redeem', auth_1.authMiddleware, subscription_controller_1.redeemCode);
router.get('/my', auth_1.authMiddleware, subscription_controller_1.getMySubscription);
// Admin
router.get('/admin/codes', auth_1.adminMiddleware, (0, auth_1.requirePermission)('subscriptions'), subscription_controller_1.adminGetCodes);
router.post('/admin/codes', auth_1.adminMiddleware, (0, auth_1.requirePermission)('subscriptions'), subscription_controller_1.adminCreateCodes);
router.delete('/admin/codes/:id', auth_1.adminMiddleware, (0, auth_1.requirePermission)('subscriptions'), subscription_controller_1.adminDeleteCode);
router.post('/admin/activate', auth_1.adminMiddleware, (0, auth_1.requirePermission)('subscriptions'), subscription_controller_1.adminActivateSubscription);
router.put('/admin/cancel/:userId', auth_1.adminMiddleware, (0, auth_1.requirePermission)('subscriptions'), subscription_controller_1.adminCancelSubscription);
router.get('/admin/launch', auth_1.adminMiddleware, (0, auth_1.requirePermission)('subscriptions'), subscription_controller_1.adminGetLaunchPeriod);
router.post('/admin/launch', auth_1.adminMiddleware, (0, auth_1.requirePermission)('subscriptions'), subscription_controller_1.adminSetLaunchPeriod);
exports.default = router;
//# sourceMappingURL=subscription.routes.js.map