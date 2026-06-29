"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = getProfile;
exports.updateProfile = updateProfile;
exports.changePassword = changePassword;
exports.adminGetUsers = adminGetUsers;
exports.adminUpdateUser = adminUpdateUser;
exports.adminUpdateUserFull = adminUpdateUserFull;
exports.adminDeleteUser = adminDeleteUser;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../utils/prisma");
const cloudinary_1 = require("../utils/cloudinary");
const logger_1 = __importDefault(require("../utils/logger"));
async function resolveSubscription(userId) {
    const now = new Date();
    const subscription = await prisma_1.prisma.subscription.findUnique({ where: { userId } });
    if (subscription?.status === 'ACTIVE' && new Date(subscription.endDate) < now) {
        await prisma_1.prisma.subscription.update({ where: { userId }, data: { status: 'EXPIRED' } });
        subscription.status = 'EXPIRED';
    }
    return subscription;
}
async function getProfile(req, res) {
    try {
        const userId = req.user.id;
        const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
            return;
        }
        // تحقق من الاشتراك وحدّثه إذا انتهى
        const subscription = await resolveSubscription(userId);
        res.json({
            success: true,
            data: {
                id: user.id, name: user.name, phone: user.phone, province: user.province,
                avatar: user.avatar, studyStreak: user.studyStreak, bestStreak: user.bestStreak,
                streakFreeze: user.streakFreeze, lastStudyDate: user.lastStudyDate,
                subscription, createdAt: user.createdAt,
            },
        });
    }
    catch (err) {
        logger_1.default.error(`getProfile — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function updateProfile(req, res) {
    try {
        const userId = req.user.id;
        const { name, province } = req.body;
        let avatar;
        if (req.file)
            avatar = await (0, cloudinary_1.uploadImage)(req.file.buffer, 'avatars');
        const user = await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { ...(name && { name }), ...(province && { province }), ...(avatar && { avatar }) },
        });
        res.json({
            success: true, message: 'تم تحديث الملف الشخصي',
            data: { id: user.id, name: user.name, phone: user.phone, province: user.province, avatar: user.avatar },
        });
    }
    catch (err) {
        logger_1.default.error(`updateProfile — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function changePassword(req, res) {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            res.status(400).json({ success: false, message: 'جميع الحقول مطلوبة' });
            return;
        }
        const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isMatch) {
            res.status(400).json({ success: false, message: 'كلمة المرور الحالية غير صحيحة' });
            return;
        }
        const hashed = await bcryptjs_1.default.hash(newPassword, 12);
        await prisma_1.prisma.user.update({ where: { id: userId }, data: { password: hashed } });
        res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
    }
    catch (err) {
        logger_1.default.error(`changePassword — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function adminGetUsers(req, res) {
    try {
        const { search, hasSubscription, page = '1', limit = '20' } = req.query;
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { province: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (hasSubscription === 'true')
            where.subscription = { status: 'ACTIVE', endDate: { gt: new Date() } };
        else if (hasSubscription === 'false')
            where.subscription = null;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [users, total] = await Promise.all([
            prisma_1.prisma.user.findMany({
                where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' },
                include: { subscription: true, _count: { select: { examSessions: true } } },
            }),
            prisma_1.prisma.user.count({ where }),
        ]);
        res.json({
            success: true,
            data: users.map(u => ({
                id: u.id, name: u.name, phone: u.phone, province: u.province, avatar: u.avatar,
                studyStreak: u.studyStreak, bestStreak: u.bestStreak, streakFreeze: u.streakFreeze,
                lastStudyDate: u.lastStudyDate, subscription: u.subscription,
                examCount: u._count.examSessions, createdAt: u.createdAt,
            })),
            pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
        });
    }
    catch (err) {
        logger_1.default.error(`adminGetUsers — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function adminUpdateUser(req, res) {
    try {
        const { id } = req.params;
        const { name, province } = req.body;
        const user = await prisma_1.prisma.user.update({ where: { id }, data: { ...(name && { name }), ...(province && { province }) } });
        res.json({ success: true, data: user });
    }
    catch (err) {
        logger_1.default.error(`adminUpdateUser — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function adminUpdateUserFull(req, res) {
    try {
        const { id } = req.params;
        const { name, phone, province, password } = req.body;
        if (phone && !/^07\d{9}$/.test(phone)) {
            res.status(400).json({ success: false, message: 'رقم الهاتف يجب أن يبدأ بـ 07 ويكون 11 رقم' });
            return;
        }
        if (phone) {
            const existing = await prisma_1.prisma.user.findFirst({ where: { phone, NOT: { id } } });
            if (existing) {
                res.status(400).json({ success: false, message: 'رقم الهاتف مستخدم من حساب آخر' });
                return;
            }
        }
        const data = {};
        if (name)
            data.name = name;
        if (phone)
            data.phone = phone;
        if (province)
            data.province = province;
        if (password)
            data.password = await bcryptjs_1.default.hash(password, 12);
        const user = await prisma_1.prisma.user.update({ where: { id }, data });
        res.json({
            success: true, message: 'تم تحديث بيانات المستخدم',
            data: { id: user.id, name: user.name, phone: user.phone, province: user.province },
        });
    }
    catch (err) {
        logger_1.default.error(`adminUpdateUserFull — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function adminDeleteUser(req, res) {
    try {
        const { id } = req.params;
        await prisma_1.prisma.user.delete({ where: { id } });
        res.json({ success: true, message: 'تم حذف الحساب' });
    }
    catch (err) {
        logger_1.default.error(`adminDeleteUser — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
//# sourceMappingURL=user.controller.js.map