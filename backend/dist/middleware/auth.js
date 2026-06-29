"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.adminMiddleware = adminMiddleware;
exports.superAdminMiddleware = superAdminMiddleware;
exports.requirePermission = requirePermission;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../utils/prisma");
const JWT_SECRET = process.env.JWT_SECRET;
async function authMiddleware(req, res, next) {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            res.status(401).json({ success: false, message: 'غير مصرح' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.id },
            include: { subscription: true },
        });
        if (!user) {
            res.status(401).json({ success: false, message: 'المستخدم غير موجود' });
            return;
        }
        // ═══ تحقق من صلاحية الاشتراك ═══
        const now = new Date();
        const sub = user.subscription;
        const isActiveSub = sub?.status === 'ACTIVE' && new Date(sub.endDate) > now;
        // لو انتهى الاشتراك — حدّثه في الـ DB
        if (sub?.status === 'ACTIVE' && new Date(sub.endDate) <= now) {
            await prisma_1.prisma.subscription.update({
                where: { userId: user.id },
                data: { status: 'EXPIRED' },
            });
        }
        req.user = {
            id: user.id,
            role: user.role,
            plan: isActiveSub ? sub.plan : null,
        };
        next();
    }
    catch {
        res.status(401).json({ success: false, message: 'توكن غير صالح' });
    }
}
async function adminMiddleware(req, res, next) {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            res.status(401).json({ success: false, message: 'غير مصرح' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (decoded.role !== 'ADMIN') {
            res.status(403).json({ success: false, message: 'ليس لديك صلاحية' });
            return;
        }
        const admin = await prisma_1.prisma.admin.findUnique({ where: { id: decoded.id } });
        if (!admin) {
            res.status(401).json({ success: false, message: 'الأدمن غير موجود' });
            return;
        }
        req.admin = {
            id: admin.id,
            adminRole: admin.adminRole,
            permissions: admin.permissions,
        };
        next();
    }
    catch {
        res.status(401).json({ success: false, message: 'توكن غير صالح' });
    }
}
function superAdminMiddleware(req, res, next) {
    if (req.admin?.adminRole !== 'SUPER_ADMIN') {
        res.status(403).json({ success: false, message: 'هذه الصفحة للأدمن الرئيسي فقط' });
        return;
    }
    next();
}
function requirePermission(page) {
    return (req, res, next) => {
        if (req.admin?.adminRole === 'SUPER_ADMIN') {
            next();
            return;
        }
        if (!req.admin?.permissions[page]) {
            res.status(403).json({ success: false, message: 'ليس لديك صلاحية للوصول لهذه الصفحة' });
            return;
        }
        next();
    };
}
//# sourceMappingURL=auth.js.map