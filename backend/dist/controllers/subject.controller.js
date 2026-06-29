"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubjects = getSubjects;
exports.getChaptersBySubject = getChaptersBySubject;
exports.getTopicsByChapter = getTopicsByChapter;
exports.adminGetSubjects = adminGetSubjects;
exports.createSubject = createSubject;
exports.updateSubject = updateSubject;
exports.deleteSubject = deleteSubject;
exports.adminGetChapters = adminGetChapters;
exports.createChapter = createChapter;
exports.updateChapter = updateChapter;
exports.deleteChapter = deleteChapter;
exports.createTopic = createTopic;
exports.updateTopic = updateTopic;
exports.deleteTopic = deleteTopic;
const prisma_1 = require("../utils/prisma");
const logger_1 = __importDefault(require("../utils/logger"));
// ═══ Cache ═══
const CACHE_TTL = 5 * 60 * 1000; // 5 دقائق
let subjectsCache = null;
let subjectsCacheTime = 0;
const chaptersCache = new Map();
const topicsCache = new Map();
function invalidateSubjectsCache() {
    subjectsCache = null;
    subjectsCacheTime = 0;
    chaptersCache.clear();
    topicsCache.clear();
}
// ═══ STUDENT ═══
async function getSubjects(req, res) {
    try {
        const now = Date.now();
        if (subjectsCache && now - subjectsCacheTime < CACHE_TTL) {
            res.json({ success: true, data: subjectsCache });
            return;
        }
        const subjects = await prisma_1.prisma.subject.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
            select: { id: true, name: true, order: true },
        });
        subjectsCache = subjects;
        subjectsCacheTime = now;
        res.json({ success: true, data: subjects });
    }
    catch (err) {
        logger_1.default.error(`getSubjects — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function getChaptersBySubject(req, res) {
    try {
        const { subjectId } = req.params;
        const now = Date.now();
        const cached = chaptersCache.get(subjectId);
        if (cached && now - cached.time < CACHE_TTL) {
            res.json({ success: true, data: cached.data });
            return;
        }
        const chapters = await prisma_1.prisma.chapter.findMany({
            where: { subjectId },
            orderBy: { order: 'asc' },
            select: { id: true, name: true, order: true },
        });
        chaptersCache.set(subjectId, { data: chapters, time: now });
        res.json({ success: true, data: chapters });
    }
    catch (err) {
        logger_1.default.error(`getChaptersBySubject — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function getTopicsByChapter(req, res) {
    try {
        const { chapterId } = req.params;
        const now = Date.now();
        const cached = topicsCache.get(chapterId);
        if (cached && now - cached.time < CACHE_TTL) {
            res.json({ success: true, data: cached.data });
            return;
        }
        const topics = await prisma_1.prisma.topic.findMany({
            where: { chapterId },
            orderBy: { order: 'asc' },
            select: { id: true, name: true, order: true },
        });
        topicsCache.set(chapterId, { data: topics, time: now });
        res.json({ success: true, data: topics });
    }
    catch (err) {
        logger_1.default.error(`getTopicsByChapter — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
// ═══ ADMIN ═══
async function adminGetSubjects(req, res) {
    try {
        const subjects = await prisma_1.prisma.subject.findMany({
            orderBy: { order: 'asc' },
            include: { _count: { select: { chapters: true, exams: true } } },
        });
        res.json({ success: true, data: subjects });
    }
    catch (err) {
        logger_1.default.error(`adminGetSubjects — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function createSubject(req, res) {
    try {
        const { name, order } = req.body;
        if (!name) {
            res.status(400).json({ success: false, message: 'اسم المادة مطلوب' });
            return;
        }
        const subject = await prisma_1.prisma.subject.create({ data: { name, order: order ?? 0 } });
        invalidateSubjectsCache();
        res.status(201).json({ success: true, data: subject });
    }
    catch (err) {
        logger_1.default.error(`createSubject — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function updateSubject(req, res) {
    try {
        const { id } = req.params;
        const { name, order, isActive } = req.body;
        const subject = await prisma_1.prisma.subject.update({ where: { id }, data: { name, order, isActive } });
        invalidateSubjectsCache();
        res.json({ success: true, data: subject });
    }
    catch (err) {
        logger_1.default.error(`updateSubject — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function deleteSubject(req, res) {
    try {
        const { id } = req.params;
        await prisma_1.prisma.subject.delete({ where: { id } });
        invalidateSubjectsCache();
        res.json({ success: true, message: 'تم حذف المادة' });
    }
    catch (err) {
        logger_1.default.error(`deleteSubject — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function adminGetChapters(req, res) {
    try {
        const { subjectId } = req.params;
        const chapters = await prisma_1.prisma.chapter.findMany({
            where: { subjectId },
            orderBy: { order: 'asc' },
            include: { _count: { select: { topics: true, exams: true } } },
        });
        res.json({ success: true, data: chapters });
    }
    catch (err) {
        logger_1.default.error(`adminGetChapters — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function createChapter(req, res) {
    try {
        const { subjectId } = req.params;
        const { name, order } = req.body;
        if (!name) {
            res.status(400).json({ success: false, message: 'اسم الفصل مطلوب' });
            return;
        }
        const chapter = await prisma_1.prisma.chapter.create({ data: { name, order: order ?? 0, subjectId } });
        chaptersCache.delete(subjectId);
        res.status(201).json({ success: true, data: chapter });
    }
    catch (err) {
        logger_1.default.error(`createChapter — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function updateChapter(req, res) {
    try {
        const { id } = req.params;
        const { name, order } = req.body;
        const chapter = await prisma_1.prisma.chapter.update({ where: { id }, data: { name, order } });
        chaptersCache.clear();
        res.json({ success: true, data: chapter });
    }
    catch (err) {
        logger_1.default.error(`updateChapter — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function deleteChapter(req, res) {
    try {
        const { id } = req.params;
        await prisma_1.prisma.chapter.delete({ where: { id } });
        chaptersCache.clear();
        res.json({ success: true, message: 'تم حذف الفصل' });
    }
    catch (err) {
        logger_1.default.error(`deleteChapter — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function createTopic(req, res) {
    try {
        const { chapterId } = req.params;
        const { name, order } = req.body;
        if (!name) {
            res.status(400).json({ success: false, message: 'اسم الموضوع مطلوب' });
            return;
        }
        const topic = await prisma_1.prisma.topic.create({ data: { name, order: order ?? 0, chapterId } });
        topicsCache.delete(chapterId);
        res.status(201).json({ success: true, data: topic });
    }
    catch (err) {
        logger_1.default.error(`createTopic — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function updateTopic(req, res) {
    try {
        const { id } = req.params;
        const { name, order } = req.body;
        const topic = await prisma_1.prisma.topic.update({ where: { id }, data: { name, order } });
        topicsCache.clear();
        res.json({ success: true, data: topic });
    }
    catch (err) {
        logger_1.default.error(`updateTopic — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
async function deleteTopic(req, res) {
    try {
        const { id } = req.params;
        await prisma_1.prisma.topic.delete({ where: { id } });
        topicsCache.clear();
        res.json({ success: true, message: 'تم حذف الموضوع' });
    }
    catch (err) {
        logger_1.default.error(`deleteTopic — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
//# sourceMappingURL=subject.controller.js.map