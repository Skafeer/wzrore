"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReport = createReport;
exports.adminGetReports = adminGetReports;
exports.adminUpdateReport = adminUpdateReport;
exports.adminDeleteReport = adminDeleteReport;
const prisma_1 = require("../utils/prisma");
const logger_1 = __importDefault(require("../utils/logger"));
async function createReport(req, res) {
    try {
        const { questionId, message } = req.body;
        const userId = req.user.id;
        if (!questionId || !message) {
            res.status(400).json({ success: false, message: 'السؤال والرسالة مطلوبان' });
            return;
        }
        const report = await prisma_1.prisma.report.create({
            data: { userId, questionId, message },
        });
        res.status(201).json({ success: true, data: report });
    }
    catch (err) {
        logger_1.default.error(`createReport — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function adminGetReports(req, res) {
    try {
        const { status } = req.query;
        const where = {};
        if (status)
            where.status = status;
        const reports = await prisma_1.prisma.report.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { name: true, phone: true } },
                question: { select: { text: true, exam: { select: { title: true } } } },
            },
        });
        res.json({ success: true, data: reports });
    }
    catch (err) {
        logger_1.default.error(`adminGetReports — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function adminUpdateReport(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const report = await prisma_1.prisma.report.update({ where: { id }, data: { status } });
        res.json({ success: true, data: report });
    }
    catch (err) {
        logger_1.default.error(`adminUpdateReport — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function adminDeleteReport(req, res) {
    try {
        const { id } = req.params;
        await prisma_1.prisma.report.delete({ where: { id } });
        res.json({ success: true, message: 'تم حذف البلاغ' });
    }
    catch (err) {
        logger_1.default.error(`adminDeleteReport — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
//# sourceMappingURL=report.controller.js.map