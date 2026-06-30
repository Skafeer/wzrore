import { Response, Request } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';
import logger from '../utils/logger';

export async function createReport(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { questionId, message, category } = req.body;
    const userId = req.user!.id;

    if (!questionId || !message) {
      res.status(400).json({ success: false, message: 'السؤال والرسالة مطلوبان' });
      return;
    }

    const report = await prisma.report.create({
      data: {
        userId,
        questionId,
        message,
        category: category ?? 'OTHER',
      },
    });

    res.status(201).json({ success: true, data: report });
  } catch (err) {
    logger.error(`createReport — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminGetReports(req: Request, res: Response): Promise<void> {
  try {
    const { status, category } = req.query as { status?: string; category?: string };
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (category) where.category = category;

    const reports = await prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, phone: true } },
        question: { select: { text: true, exam: { select: { title: true } } } },
      },
    });

    res.json({ success: true, data: reports });
  } catch (err) {
    logger.error(`adminGetReports — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminGetReportStats(req: Request, res: Response): Promise<void> {
  try {
    const [total, pending, resolved, spelling, wrongAnswer, unclear, other] = await Promise.all([
      prisma.report.count(),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.report.count({ where: { status: 'RESOLVED' } }),
      prisma.report.count({ where: { category: 'SPELLING' } }),
      prisma.report.count({ where: { category: 'WRONG_ANSWER' } }),
      prisma.report.count({ where: { category: 'UNCLEAR' } }),
      prisma.report.count({ where: { category: 'OTHER' } }),
    ]);

    res.json({
      success: true,
      data: {
        total,
        pending,
        resolved,
        byCategory: [
          { category: 'SPELLING', count: spelling },
          { category: 'WRONG_ANSWER', count: wrongAnswer },
          { category: 'UNCLEAR', count: unclear },
          { category: 'OTHER', count: other },
        ],
      },
    });
  } catch (err) {
    logger.error(`adminGetReportStats — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminUpdateReport(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const { status, category } = req.body;

    const report = await prisma.report.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(category && { category }),
      },
    });

    res.json({ success: true, data: report });
  } catch (err) {
    logger.error(`adminUpdateReport — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminDeleteReport(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    await prisma.report.delete({ where: { id } });
    res.json({ success: true, message: 'تم حذف البلاغ' });
  } catch (err) {
    logger.error(`adminDeleteReport — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}