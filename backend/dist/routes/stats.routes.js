"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const stats_controller_1 = require("../controllers/stats.controller");
const router = (0, express_1.Router)();
// GET /api/stats/admin
router.get('/admin', auth_1.authMiddleware, auth_1.adminMiddleware, stats_controller_1.adminGetStats);
exports.default = router;
//# sourceMappingURL=stats.routes.js.map