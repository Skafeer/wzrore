"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveFcmToken = saveFcmToken;
exports.adminSendToUser = adminSendToUser;
exports.adminSendToAll = adminSendToAll;
exports.adminGetNotifications = adminGetNotifications;
const prisma_1 = require("../utils/prisma");
const push_1 = require("../utils/push");
const logger_1 = __importDefault(require("../utils/logger"));
async function saveFcmToken(req, res) {
    try {
        const userId = req.user.id;
        const { token } = req.body;
        await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { fcmToken: token ?? null },
        });
        res.json({ success: true, message: token ? 'تم حفظ التوكن' : 'تم إلغاء الإشعارات' });
    }
    catch (err) {
        logger_1.default.error(`saveFcmToken — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function adminSendToUser(req, res) {
    try {
        const { userId, title, body } = req.body;
        const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user?.fcmToken) {
            res.status(404).json({ success: false, message: 'المستخدم لا يملك توكن إشعارات' });
            return;
        }
        const success = await (0, push_1.sendNotification)(user.fcmToken, title, body);
        res.json({ success, message: success ? 'تم إرسال الإشعار' : 'فشل إرسال الإشعار' });
    }
    catch (err) {
        logger_1.default.error(`adminSendToUser — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function adminSendToAll(req, res) {
    try {
        const { title, body } = req.body;
        if (!title || !body) {
            res.status(400).json({ success: false, message: 'العنوان والنص مطلوبان' });
            return;
        }
        const users = await prisma_1.prisma.user.findMany({
            where: { fcmToken: { not: null } },
            select: { fcmToken: true },
        });
        const tokens = users.map(u => u.fcmToken).filter(Boolean);
        const successCount = await (0, push_1.sendNotificationToAll)(tokens, title, body);
        await prisma_1.prisma.notification.create({
            data: { title, body, sentBy: 'admin', totalSent: successCount },
        });
        res.json({
            success: true,
            message: `تم إرسال الإشعار لـ ${successCount} طالب`,
            data: { totalSent: successCount, totalTokens: tokens.length },
        });
    }
    catch (err) {
        logger_1.default.error(`adminSendToAll — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function adminGetNotifications(req, res) {
    try {
        const notifications = await prisma_1.prisma.notification.findMany({
            orderBy: { sentAt: 'desc' },
            take: 50,
        });
        res.json({ success: true, data: notifications });
    }
    catch (err) {
        logger_1.default.error(`adminGetNotifications — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
//# sourceMappingURL=notification.controller.js.map