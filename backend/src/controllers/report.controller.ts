import { Response } from 'express';
import { Request } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';

export async function createReport(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { questionId, message } = req.body;
    const userId = req.user!.id;

    if (!questionId || !message) {
      res.status(400).json({ success: false, message: 'السؤال والرسالة مطلوبان' });
      return;
    }

    const report = await prisma.report.create({
      data: { userId, questionId, message },
    });

    res.status(201).json({ success: true, data: report });
  } catch {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminGetReports(req: Request, res: Response): Promise<void> {
  try {
    const { status } = req.query as { status?: string };
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const reports = await prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, phone: true } },
        question: { select: { text: true, exam: { select: { title: true } } } },
      },
    });

    res.json({ success: true, data: reports });
  } catch {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminUpdateReport(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const { status } = req.body;

    const report = await prisma.report.update({
      where: { id },
      data: { status },
    });

    res.json({ success: true, data: report });
  } catch {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}