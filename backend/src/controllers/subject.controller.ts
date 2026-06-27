import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import logger from '../utils/logger';

// ═══ Cache ═══
const CACHE_TTL = 5 * 60 * 1000; // 5 دقائق

let subjectsCache: any = null;
let subjectsCacheTime = 0;

const chaptersCache = new Map<string, { data: any; time: number }>();
const topicsCache = new Map<string, { data: any; time: number }>();

function invalidateSubjectsCache() {
  subjectsCache = null;
  subjectsCacheTime = 0;
  chaptersCache.clear();
  topicsCache.clear();
}

// ═══ STUDENT ═══

export async function getSubjects(req: Request, res: Response): Promise<void> {
  try {
    const now = Date.now();
    if (subjectsCache && now - subjectsCacheTime < CACHE_TTL) {
      res.json({ success: true, data: subjectsCache });
      return;
    }

    const subjects = await prisma.subject.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      select: { id: true, name: true, order: true },
    });

    subjectsCache = subjects;
    subjectsCacheTime = now;

    res.json({ success: true, data: subjects });
  } catch (err) {
    logger.error(`getSubjects — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function getChaptersBySubject(req: Request, res: Response): Promise<void> {
  try {
    const { subjectId } = req.params as { subjectId: string };
    const now = Date.now();
    const cached = chaptersCache.get(subjectId);

    if (cached && now - cached.time < CACHE_TTL) {
      res.json({ success: true, data: cached.data });
      return;
    }

    const chapters = await prisma.chapter.findMany({
      where: { subjectId },
      orderBy: { order: 'asc' },
      select: { id: true, name: true, order: true },
    });

    chaptersCache.set(subjectId, { data: chapters, time: now });

    res.json({ success: true, data: chapters });
  } catch (err) {
    logger.error(`getChaptersBySubject — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function getTopicsByChapter(req: Request, res: Response): Promise<void> {
  try {
    const { chapterId } = req.params as { chapterId: string };
    const now = Date.now();
    const cached = topicsCache.get(chapterId);

    if (cached && now - cached.time < CACHE_TTL) {
      res.json({ success: true, data: cached.data });
      return;
    }

    const topics = await prisma.topic.findMany({
      where: { chapterId },
      orderBy: { order: 'asc' },
      select: { id: true, name: true, order: true },
    });

    topicsCache.set(chapterId, { data: topics, time: now });

    res.json({ success: true, data: topics });
  } catch (err) {
    logger.error(`getTopicsByChapter — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

// ═══ ADMIN ═══

export async function adminGetSubjects(req: Request, res: Response): Promise<void> {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: { order: 'asc' },
      include: { _count: { select: { chapters: true, exams: true } } },
    });
    res.json({ success: true, data: subjects });
  } catch (err) {
    logger.error(`adminGetSubjects — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function createSubject(req: Request, res: Response): Promise<void> {
  try {
    const { name, order } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: 'اسم المادة مطلوب' });
      return;
    }
    const subject = await prisma.subject.create({ data: { name, order: order ?? 0 } });
    invalidateSubjectsCache();
    res.status(201).json({ success: true, data: subject });
  } catch (err) {
    logger.error(`createSubject — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function updateSubject(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const { name, order, isActive } = req.body;
    const subject = await prisma.subject.update({ where: { id }, data: { name, order, isActive } });
    invalidateSubjectsCache();
    res.json({ success: true, data: subject });
  } catch (err) {
    logger.error(`updateSubject — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function deleteSubject(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    await prisma.subject.delete({ where: { id } });
    invalidateSubjectsCache();
    res.json({ success: true, message: 'تم حذف المادة' });
  } catch (err) {
    logger.error(`deleteSubject — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminGetChapters(req: Request, res: Response): Promise<void> {
  try {
    const { subjectId } = req.params as { subjectId: string };
    const chapters = await prisma.chapter.findMany({
      where: { subjectId },
      orderBy: { order: 'asc' },
      include: { _count: { select: { topics: true, exams: true } } },
    });
    res.json({ success: true, data: chapters });
  } catch (err) {
    logger.error(`adminGetChapters — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function createChapter(req: Request, res: Response): Promise<void> {
  try {
    const { subjectId } = req.params as { subjectId: string };
    const { name, order } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: 'اسم الفصل مطلوب' });
      return;
    }
    const chapter = await prisma.chapter.create({ data: { name, order: order ?? 0, subjectId } });
    chaptersCache.delete(subjectId);
    res.status(201).json({ success: true, data: chapter });
  } catch (err) {
    logger.error(`createChapter — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function updateChapter(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const { name, order } = req.body;
    const chapter = await prisma.chapter.update({ where: { id }, data: { name, order } });
    chaptersCache.clear();
    res.json({ success: true, data: chapter });
  } catch (err) {
    logger.error(`updateChapter — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function deleteChapter(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    await prisma.chapter.delete({ where: { id } });
    chaptersCache.clear();
    res.json({ success: true, message: 'تم حذف الفصل' });
  } catch (err) {
    logger.error(`deleteChapter — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function createTopic(req: Request, res: Response): Promise<void> {
  try {
    const { chapterId } = req.params as { chapterId: string };
    const { name, order } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: 'اسم الموضوع مطلوب' });
      return;
    }
    const topic = await prisma.topic.create({ data: { name, order: order ?? 0, chapterId } });
    topicsCache.delete(chapterId);
    res.status(201).json({ success: true, data: topic });
  } catch (err) {
    logger.error(`createTopic — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function updateTopic(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const { name, order } = req.body;
    const topic = await prisma.topic.update({ where: { id }, data: { name, order } });
    topicsCache.clear();
    res.json({ success: true, data: topic });
  } catch (err) {
    logger.error(`updateTopic — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function deleteTopic(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    await prisma.topic.delete({ where: { id } });
    topicsCache.clear();
    res.json({ success: true, message: 'تم حذف الموضوع' });
  } catch (err) {
    logger.error(`deleteTopic — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}