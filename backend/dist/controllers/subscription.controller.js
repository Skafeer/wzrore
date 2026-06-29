"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redeemCode = redeemCode;
exports.getMySubscription = getMySubscription;
exports.adminGetCodes = adminGetCodes;
exports.adminCreateCodes = adminCreateCodes;
exports.adminDeleteCode = adminDeleteCode;
exports.adminActivateSubscription = adminActivateSubscription;
exports.adminCancelSubscription = adminCancelSubscription;
exports.adminGetLaunchPeriod = adminGetLaunchPeriod;
exports.adminSetLaunchPeriod = adminSetLaunchPeriod;
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = require("../utils/prisma");
const logger_1 = __importDefault(require("../utils/logger"));
function hashCode(code) {
    return crypto_1.default.createHmac('sha256', process.env.ENCRYPTION_KEY)
        .update(code.trim().toUpperCase()).digest('hex');
}
// ═══ helper مشترك لتحقق الاشتراك وتحديثه ═══
async function resolveSubscription(userId) {
    const now = new Date();
    const subscription = await prisma_1.prisma.subscription.findUnique({ where: { userId } });
    if (subscription?.status === 'ACTIVE' && new Date(subscription.endDate) < now) {
        await prisma_1.prisma.subscription.update({ where: { userId }, data: { status: 'EXPIRED' } });
        subscription.status = 'EXPIRED';
    }
    return subscription;
}
async function redeemCode(req, res) {
    try {
        const { code } = req.body;
        const userId = req.user.id;
        if (!code) {
            res.status(400).json({ success: false, message: 'الكود مطلوب' });
            return;
        }
        const hashed = hashCode(code);
        const subCode = await prisma_1.prisma.subscriptionCode.findUnique({ where: { code: hashed } });
        if (!subCode) {
            res.status(404).json({ success: false, message: 'الكود غير موجود' });
            return;
        }
        if (subCode.isUsed) {
            res.status(400).json({ success: false, message: 'الكود مستخدم مسبقاً' });
            return;
        }
        if (new Date() > new Date(subCode.expiresAt)) {
            res.status(400).json({ success: false, message: 'الكود منتهي الصلاحية' });
            return;
        }
        const startDate = new Date();
        const endDate = new Date();
        if (subCode.plan === 'WEEKLY')
            endDate.setDate(endDate.getDate() + 7);
        else if (subCode.plan === 'MONTHLY')
            endDate.setDate(endDate.getDate() + 30);
        else if (subCode.plan === 'YEARLY')
            endDate.setFullYear(endDate.getFullYear() + 1);
        await prisma_1.prisma.subscriptionCode.update({ where: { code: hashed }, data: { isUsed: true, usedBy: userId, usedAt: new Date() } });
        const subscription = await prisma_1.prisma.subscription.upsert({
            where: { userId },
            update: { plan: subCode.plan, status: 'ACTIVE', startDate, endDate },
            create: { userId, plan: subCode.plan, status: 'ACTIVE', startDate, endDate },
        });
        res.json({ success: true, message: 'تم تفعيل الاشتراك بنجاح', data: subscription });
    }
    catch (err) {
        logger_1.default.error(`redeemCode — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function getMySubscription(req, res) {
    try {
        const userId = req.user.id;
        const now = new Date();
        const subscription = await resolveSubscription(userId);
        const isLaunchPeriod = await checkLaunchPeriod();
        const isActive = isLaunchPeriod ||
            (subscription?.status === 'ACTIVE' && new Date(subscription.endDate) > now);
        res.json({ success: true, data: { subscription, isLaunchPeriod, isActive } });
    }
    catch (err) {
        logger_1.default.error(`getMySubscription — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function adminGetCodes(req, res) {
    try {
        const { isUsed } = req.query;
        const where = {};
        if (isUsed !== undefined)
            where.isUsed = isUsed === 'true';
        const codes = await prisma_1.prisma.subscriptionCode.findMany({ where, orderBy: { createdAt: 'desc' } });
        res.json({ success: true, data: codes.map(c => ({ ...c, code: c.plainCode ?? c.code })) });
    }
    catch (err) {
        logger_1.default.error(`adminGetCodes — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function adminCreateCodes(req, res) {
    try {
        const { plan, count } = req.body;
        if (!plan || !count) {
            res.status(400).json({ success: false, message: 'الباقة والعدد مطلوبان' });
            return;
        }
        const plainCodes = [];
        const codes = [];
        for (let i = 0; i < parseInt(count); i++) {
            const plainCode = generateCode();
            const hashed = hashCode(plainCode);
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);
            plainCodes.push(plainCode);
            codes.push({ code: hashed, plainCode, plan, expiresAt });
        }
        await prisma_1.prisma.subscriptionCode.createMany({ data: codes });
        res.status(201).json({ success: true, message: `تم إنشاء ${count} كود بنجاح`, data: plainCodes });
    }
    catch (err) {
        logger_1.default.error(`adminCreateCodes — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function adminDeleteCode(req, res) {
    try {
        const { id } = req.params;
        await prisma_1.prisma.subscriptionCode.delete({ where: { id } });
        res.json({ success: true, message: 'تم حذف الكود' });
    }
    catch (err) {
        logger_1.default.error(`adminDeleteCode — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function adminActivateSubscription(req, res) {
    try {
        const { userId, plan } = req.body;
        if (!userId || !plan) {
            res.status(400).json({ success: false, message: 'المستخدم والباقة مطلوبان' });
            return;
        }
        const startDate = new Date();
        const endDate = new Date();
        if (plan === 'WEEKLY')
            endDate.setDate(endDate.getDate() + 7);
        else if (plan === 'MONTHLY')
            endDate.setDate(endDate.getDate() + 30);
        else if (plan === 'YEARLY')
            endDate.setFullYear(endDate.getFullYear() + 1);
        const subscription = await prisma_1.prisma.subscription.upsert({
            where: { userId },
            update: { plan, status: 'ACTIVE', startDate, endDate },
            create: { userId, plan, status: 'ACTIVE', startDate, endDate },
        });
        res.json({ success: true, data: subscription });
    }
    catch (err) {
        logger_1.default.error(`adminActivateSubscription — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function adminCancelSubscription(req, res) {
    try {
        const { userId } = req.params;
        await prisma_1.prisma.subscription.update({ where: { userId }, data: { status: 'CANCELLED' } });
        res.json({ success: true, message: 'تم إلغاء الاشتراك' });
    }
    catch (err) {
        logger_1.default.error(`adminCancelSubscription — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function adminGetLaunchPeriod(req, res) {
    try {
        const launch = await prisma_1.prisma.launchPeriod.findFirst({ orderBy: { createdAt: 'desc' } });
        res.json({ success: true, data: launch });
    }
    catch (err) {
        logger_1.default.error(`adminGetLaunchPeriod — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function adminSetLaunchPeriod(req, res) {
    try {
        const { startDate, endDate, isActive } = req.body;
        if (!startDate || !endDate) {
            res.status(400).json({ success: false, message: 'تاريخ البداية والنهاية مطلوبان' });
            return;
        }
        await prisma_1.prisma.launchPeriod.updateMany({ data: { isActive: false } });
        const launch = await prisma_1.prisma.launchPeriod.create({
            data: { startDate: new Date(startDate), endDate: new Date(endDate), isActive: isActive ?? true },
        });
        res.status(201).json({ success: true, data: launch });
    }
    catch (err) {
        logger_1.default.error(`adminSetLaunchPeriod — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
function generateCode() {
    const segment = () => crypto_1.default.randomBytes(2).toString('hex').toUpperCase();
    return `SAWAB-${segment()}-${segment()}-${segment()}`;
}
async function checkLaunchPeriod() {
    const now = new Date();
    const launch = await prisma_1.prisma.launchPeriod.findFirst({
        where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
    });
    return !!launch;
}
//# sourceMappingURL=subscription.controller.js.map