"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminGetAdmins = adminGetAdmins;
exports.adminCreateAdmin = adminCreateAdmin;
exports.adminUpdateAdmin = adminUpdateAdmin;
exports.adminDeleteAdmin = adminDeleteAdmin;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../utils/prisma");
const logger_1 = __importDefault(require("../utils/logger"));
async function adminGetAdmins(req, res) {
    try {
        const admins = await prisma_1.prisma.admin.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true, name: true, username: true, email: true,
                adminRole: true, permissions: true, createdAt: true,
            },
        });
        res.json({ success: true, data: admins });
    }
    catch (err) {
        logger_1.default.error(`adminGetAdmins — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function adminCreateAdmin(req, res) {
    try {
        const { name, username, email, password, permissions } = req.body;
        if (!name || !username || !email || !password) {
            res.status(400).json({ success: false, message: 'جميع الحقول مطلوبة' });
            return;
        }
        const existing = await prisma_1.prisma.admin.findFirst({
            where: { OR: [{ email }, { username }] },
        });
        if (existing) {
            res.status(400).json({ success: false, message: 'البريد أو اسم المستخدم مستخدم' });
            return;
        }
        const hashed = await bcryptjs_1.default.hash(password, 12);
        const admin = await prisma_1.prisma.admin.create({
            data: { name, username, email, password: hashed, adminRole: 'ADMIN', permissions: permissions ?? {} },
        });
        res.status(201).json({
            success: true,
            data: {
                id: admin.id, name: admin.name, username: admin.username,
                email: admin.email, adminRole: admin.adminRole, permissions: admin.permissions,
            },
        });
    }
    catch (err) {
        logger_1.default.error(`adminCreateAdmin — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function adminUpdateAdmin(req, res) {
    try {
        const { id } = req.params;
        const { name, permissions } = req.body;
        const admin = await prisma_1.prisma.admin.update({
            where: { id },
            data: { ...(name && { name }), ...(permissions && { permissions }) },
        });
        res.json({ success: true, data: admin });
    }
    catch (err) {
        logger_1.default.error(`adminUpdateAdmin — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function adminDeleteAdmin(req, res) {
    try {
        const { id } = req.params;
        if (id === req.admin.id) {
            res.status(400).json({ success: false, message: 'لا يمكنك حذف حسابك' });
            return;
        }
        await prisma_1.prisma.admin.delete({ where: { id } });
        res.json({ success: true, message: 'تم حذف الأدمن' });
    }
    catch (err) {
        logger_1.default.error(`adminDeleteAdmin — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
//# sourceMappingURL=admin.controller.js.map