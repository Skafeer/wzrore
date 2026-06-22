import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';
import logger from '../utils/logger';

export async function getExams(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { subjectId, type, chapterId, topicId, year, round } = req.query as Record<string, string>;

    if (!subjectId || !type) {
      res.status(400).json({ success: false, message: 'المادة والنوع مطلوبان' });
      return;
    }

    const where: Record<string, unknown> = { subjectId, type, isActive: true };

    if (type === 'CHAPTER') {
      if (chapterId) where.chapterId = chapterId;
      if (topicId) where.topicId = topicId;
    }

    if (type === 'WIZARI') {
      if (year) where.year = parseInt(year);
      if (round) where.round = parseInt(round);
    }

    const userId = req.user!.id;
    const user = await prisma.user.findUnique({
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

    const exams = await prisma.exam.findMany({
      where,
      orderBy: [{ year: 'desc' }, { round: 'asc' }],
      select: {
        id: true, title: true, type: true, year: true,
        round: true, duration: true,
        _count: { select: { questions: true } },
      },
    });

    res.json({ success: true, data: exams });
  } catch (err) {
    logger.error(`getExams — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function getAvailableYears(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { subjectId } = req.params as { subjectId: string };

    const years = await prisma.exam.findMany({
      where: { subjectId, type: 'WIZARI', isActive: true },
      select: { year: true },
      distinct: ['year'],
      orderBy: { year: 'desc' },
    });

    const isLaunchPeriod = await checkLaunchPeriod();
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { subscription: true },
    });
    const hasPaidSub = user?.subscription?.status === 'ACTIVE' &&
      new Date(user.subscription.endDate) > new Date();

    let availableYears = years.map(y => y.year).filter(Boolean);

    if (!isLaunchPeriod && !hasPaidSub) {
      const currentYear = new Date().getFullYear();
      availableYears = availableYears.filter(y => y! >= currentYear - 2);
    }

    res.json({ success: true, data: availableYears });
  } catch (err) {
    logger.error(`getAvailableYears — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function getAvailableRounds(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { subjectId } = req.params as { subjectId: string };
    const { year } = req.query as { year: string };

    const rounds = await prisma.exam.findMany({
      where: { subjectId, type: 'WIZARI', year: parseInt(year), isActive: true },
      select: { round: true },
      distinct: ['round'],
      orderBy: { round: 'asc' },
    });

    res.json({ success: true, data: rounds.map(r => r.round).filter(Boolean) });
  } catch (err) {
    logger.error(`getAvailableRounds — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminGetExams(req: Request, res: Response): Promise<void> {
  try {
    const { subjectId, type } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (subjectId) where.subjectId = subjectId;
    if (type) where.type = type;

    const exams = await prisma.exam.findMany({
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
  } catch (err) {
    logger.error(`adminGetExams — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminCreateExam(req: Request, res: Response): Promise<void> {
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

    const exam = await prisma.exam.create({
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
  } catch (err) {
    logger.error(`adminCreateExam — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminUpdateExam(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const { title, duration, isActive } = req.body;

    const exam = await prisma.exam.update({
      where: { id },
      data: { title, duration, isActive },
    });

    res.json({ success: true, data: exam });
  } catch (err) {
    logger.error(`adminUpdateExam — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminDeleteExam(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    await prisma.exam.delete({ where: { id } });
    res.json({ success: true, message: 'تم حذف الامتحان' });
  } catch (err) {
    logger.error(`adminDeleteExam — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminGetQuestions(req: Request, res: Response): Promise<void> {
  try {
    const { examId } = req.params as { examId: string };
    const questions = await prisma.question.findMany({
      where: { examId },
      orderBy: { order: 'asc' },
    });
    res.json({ success: true, data: questions });
  } catch (err) {
    logger.error(`adminGetQuestions — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminCreateQuestion(req: Request, res: Response): Promise<void> {
  try {
    const { examId } = req.params as { examId: string };
    const { text, modelAnswer, modelImages, degree, aiNotes, order } = req.body;

    if (!text || !modelAnswer || !degree) {
      res.status(400).json({ success: false, message: 'السؤال والإجابة النموذجية والدرجة مطلوبة' });
      return;
    }

    const question = await prisma.question.create({
      data: {
        examId, text, modelAnswer,
        modelImages: modelImages ?? [],
        degree: parseFloat(degree),
        aiNotes: aiNotes ?? null,
        order: order ?? 0,
      },
    });

    res.status(201).json({ success: true, data: question });
  } catch (err) {
    logger.error(`adminCreateQuestion — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminUpdateQuestion(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const { text, modelAnswer, modelImages, degree, aiNotes, order } = req.body;

    const question = await prisma.question.update({
      where: { id },
      data: { text, modelAnswer, modelImages, degree, aiNotes, order },
    });

    res.json({ success: true, data: question });
  } catch (err) {
    logger.error(`adminUpdateQuestion — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminDeleteQuestion(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    await prisma.question.delete({ where: { id } });
    res.json({ success: true, message: 'تم حذف السؤال' });
  } catch (err) {
    logger.error(`adminDeleteQuestion — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

async function checkLaunchPeriod(): Promise<boolean> {
  const now = new Date();
  const launch = await prisma.launchPeriod.findFirst({
    where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
  });
  return !!launch;
}