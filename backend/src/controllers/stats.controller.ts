import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import logger from '../utils/logger';

export async function adminGetStats(req: Request, res: Response): Promise<void> {
  try {
    const { from, to } = req.query as { from?: string; to?: string };

    const dateFilter: Record<string, unknown> = {};
    if (from || to) {
      dateFilter.createdAt = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      };
    }

    const [
      totalUsers, totalExams, totalSessions, completedSessions,
      activeSubscriptions, totalReports, pendingReports, recentSessions,
    ] = await Promise.all([
      prisma.user.count({ where: dateFilter }),
      prisma.exam.count(),
      prisma.examSession.count({ where: dateFilter }),
      prisma.examSession.count({ where: { ...dateFilter, isCompleted: true } }),
      prisma.subscription.count({ where: { status: 'ACTIVE', endDate: { gte: new Date() } } }),
      prisma.report.count({ where: dateFilter }),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.examSession.findMany({
        where: { isCompleted: true },
        orderBy: { submittedAt: 'desc' },
        take: 10,
        include: {
          user: { select: { name: true } },
          exam: { select: { title: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers, totalExams, totalSessions, completedSessions,
        activeSubscriptions, totalReports, pendingReports, recentSessions,
      },
    });
  } catch (err) {
    logger.error(`adminGetStats — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}