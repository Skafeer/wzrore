"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExams = getExams;
exports.getAvailableYears = getAvailableYears;
exports.getAvailableRounds = getAvailableRounds;
exports.adminGetExams = adminGetExams;
exports.adminCreateExam = adminCreateExam;
exports.adminUpdateExam = adminUpdateExam;
exports.adminDeleteExam = adminDeleteExam;
exports.adminGetQuestions = adminGetQuestions;
exports.adminCreateQuestion = adminCreateQuestion;
exports.adminUpdateQuestion = adminUpdateQuestion;
exports.adminDeleteQuestion = adminDeleteQuestion;
const prisma_1 = require("../utils/prisma");
const logger_1 = __importDefault(require("../utils/logger"));
async function getExams(req, res) {
    try {
        const { subjectId, type, chapterId, topicId, year, round } = req.query;
        if (!subjectId || !type) {
            res.status(400).json({ success: false, message: 'المادة والنوع مطلوبان' });
            return;
        }
        const where = { subjectId, type, isActive: true };
        if (type === 'CHAPTER') {
            if (chapterId)
                where.chapterId = chapterId;
            if (topicId)
                where.topicId = topicId;
        }
        if (type === 'WIZARI') {
            if (year)
                where.year = parseInt(year);
            if (round)
                where.round = parseInt(round);
        }
        const userId = req.user.id;
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            include: { subscription: true },
        });
        const isLaunchPeriod = await checkLaunchPeriod();
        const hasPaidSub = user?.subscription?.status === 'ACTIVE' &&
            new Date(user.subscription.endDate) > new Date();
        if (!isLaunchPeriod && !hasPaidSub && type === 'WIZARI') {
            const currentYear = new Date().getFullYear();
            where.year = { gte: currentYear - 2 };
        }
        const exams = await prisma_1.prisma.exam.findMany({
            where,
            orderBy: [{ year: 'desc' }, { round: 'asc' }],
            select: {
                id: true, title: true, type: true, year: true,
                round: true, duration: true,
                _count: { select: { questions: true } },
            },
        });
        res.json({ success: true, data: exams });
    }
    catch (err) {
        logger_1.default.error(`getExams — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function getAvailableYears(req, res) {
    try {
        const { subjectId } = req.params;
        const years = await prisma_1.prisma.exam.findMany({
            where: { subjectId, type: 'WIZARI', isActive: true },
            select: { year: true },
            distinct: ['year'],
            orderBy: { year: 'desc' },
        });
        const isLaunchPeriod = await checkLaunchPeriod();
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.id },
            include: { subscription: true },
        });
        const hasPaidSub = user?.subscription?.status === 'ACTIVE' &&
            new Date(user.subscription.endDate) > new Date();
        let availableYears = years.map(y => y.year).filter(Boolean);
        if (!isLaunchPeriod && !hasPaidSub) {
            const currentYear = new Date().getFullYear();
            availableYears = availableYears.filter(y => y >= currentYear - 2);
        }
        res.json({ success: true, data: availableYears });
    }
    catch (err) {
        logger_1.default.error(`getAvailableYears — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function getAvailableRounds(req, res) {
    try {
        const { subjectId } = req.params;
        const { year } = req.query;
        const rounds = await prisma_1.prisma.exam.findMany({
            where: { subjectId, type: 'WIZARI', year: parseInt(year), isActive: true },
            select: { round: true },
            distinct: ['round'],
            orderBy: { round: 'asc' },
        });
        res.json({ success: true, data: rounds.map(r => r.round).filter(Boolean) });
    }
    catch (err) {
        logger_1.default.error(`getAvailableRounds — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function adminGetExams(req, res) {
    try {
        const { subjectId, type } = req.query;
        const where = {};
        if (subjectId)
            where.subjectId = subjectId;
        if (type)
            where.type = type;
        const exams = await prisma_1.prisma.exam.findMany({
            where,
            orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
            include: {
                subject: { select: { name: true } },
                chapter: { select: { name: true } },
                topic: { select: { name: true } },
                _count: { select: { questions: true, sessions: true } },
            },
        });
        res.json({ success: true, data: exams });
    }
    catch (err) {
        logger_1.default.error(`adminGetExams — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function adminCreateExam(req, res) {
    try {
        const { title, subjectId, type, chapterId, topicId, year, round, duration } = req.body;
        if (!title || !subjectId || !type || !duration) {
            res.status(400).json({ success: false, message: 'الحقول المطلوبة ناقصة' });
            return;
        }
        if (type === 'WIZARI' && (!year || !round)) {
            res.status(400).json({ success: false, message: 'السنة والدور مطلوبان للوزاري الشامل' });
            return;
        }
        if (type === 'CHAPTER' && !chapterId) {
            res.status(400).json({ success: false, message: 'الفصل مطلوب للفصل المحدد' });
            return;
        }
        const exam = await prisma_1.prisma.exam.create({
            data: {
                title, subjectId, type,
                chapterId: type === 'CHAPTER' ? chapterId : null,
                topicId: type === 'CHAPTER' ? topicId ?? null : null,
                year: type === 'WIZARI' ? parseInt(year) : null,
                round: type === 'WIZARI' ? parseInt(round) : null,
                duration: parseInt(duration),
            },
        });
        res.status(201).json({ success: true, data: exam });
    }
    catch (err) {
        logger_1.default.error(`adminCreateExam — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function adminUpdateExam(req, res) {
    try {
        const { id } = req.params;
        const { title, duration, isActive } = req.body;
        const exam = await prisma_1.prisma.exam.update({
            where: { id },
            data: { title, duration, isActive },
        });
        res.json({ success: true, data: exam });
    }
    catch (err) {
        logger_1.default.error(`adminUpdateExam — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function adminDeleteExam(req, res) {
    try {
        const { id } = req.params;
        await prisma_1.prisma.exam.delete({ where: { id } });
        res.json({ success: true, message: 'تم حذف الامتحان' });
    }
    catch (err) {
        logger_1.default.error(`adminDeleteExam — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function adminGetQuestions(req, res) {
    try {
        const { examId } = req.params;
        const questions = await prisma_1.prisma.question.findMany({
            where: { examId },
            orderBy: { order: 'asc' },
        });
        res.json({ success: true, data: questions });
    }
    catch (err) {
        logger_1.default.error(`adminGetQuestions — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function adminCreateQuestion(req, res) {
    try {
        const { examId } = req.params;
        const { text, modelAnswer, modelImages, degree, aiNotes, order } = req.body;
        if (!text || !modelAnswer || !degree) {
            res.status(400).json({ success: false, message: 'السؤال والإجابة النموذجية والدرجة مطلوبة' });
            return;
        }
        const question = await prisma_1.prisma.question.create({
            data: {
                examId, text, modelAnswer,
                modelImages: modelImages ?? [],
                degree: parseFloat(degree),
                aiNotes: aiNotes ?? null,
                order: order ?? 0,
            },
        });
        res.status(201).json({ success: true, data: question });
    }
    catch (err) {
        logger_1.default.error(`adminCreateQuestion — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function adminUpdateQuestion(req, res) {
    try {
        const { id } = req.params;
        const { text, modelAnswer, modelImages, degree, aiNotes, order } = req.body;
        const question = await prisma_1.prisma.question.update({
            where: { id },
            data: { text, modelAnswer, modelImages, degree, aiNotes, order },
        });
        res.json({ success: true, data: question });
    }
    catch (err) {
        logger_1.default.error(`adminUpdateQuestion — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function adminDeleteQuestion(req, res) {
    try {
        const { id } = req.params;
        await prisma_1.prisma.question.delete({ where: { id } });
        res.json({ success: true, message: 'تم حذف السؤال' });
    }
    catch (err) {
        logger_1.default.error(`adminDeleteQuestion — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function checkLaunchPeriod() {
    const now = new Date();
    const launch = await prisma_1.prisma.launchPeriod.findFirst({
        where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
    });
    return !!launch;
}
//# sourceMappingURL=exam.controller.js.map