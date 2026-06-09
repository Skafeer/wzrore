import crypto from 'crypto';
import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';

// ═══ STUDENT ═══

export async function redeemCode(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { code } = req.body;
    const userId = req.user!.id;

    if (!code) {
      res.status(400).json({ success: false, message: 'الكود مطلوب' });
      return;
    }

    const subCode = await prisma.subscriptionCode.findUnique({
      where: { code },
    });

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

    if (subCode.plan === 'WEEKLY') endDate.setDate(endDate.getDate() + 7);
    else if (subCode.plan === 'MONTHLY') endDate.setDate(endDate.getDate() + 30);
    else if (subCode.plan === 'YEARLY') endDate.setFullYear(endDate.getFullYear() + 1);

    await prisma.subscriptionCode.update({
      where: { code },
      data: { isUsed: true, usedBy: userId, usedAt: new Date() },
    });

    const subscription = await prisma.subscription.upsert({
      where: { userId },
      update: { plan: subCode.plan, status: 'ACTIVE', startDate, endDate },
      create: { userId, plan: subCode.plan, status: 'ACTIVE', startDate, endDate },
    });

    res.json({
      success: true,
      message: 'تم تفعيل الاشتراك بنجاح',
      data: subscription,
    });
  } catch {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function getMySubscription(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    const isLaunchPeriod = await checkLaunchPeriod();

    res.json({
      success: true,
      data: {
        subscription,
        isLaunchPeriod,
        isActive: isLaunchPeriod ||
          (subscription?.status === 'ACTIVE' && new Date(subscription.endDate) > new Date()),
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

// ═══ ADMIN ═══

export async function adminGetCodes(req: Request, res: Response): Promise<void> {
  try {
    const { isUsed } = req.query as { isUsed?: string };
    const where: Record<string, unknown> = {};
    if (isUsed !== undefined) where.isUsed = isUsed === 'true';

    const codes = await prisma.subscriptionCode.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: codes });
  } catch {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminCreateCodes(req: Request, res: Response): Promise<void> {
  try {
    const { plan, count } = req.body;

    if (!plan || !count) {
      res.status(400).json({ success: false, message: 'الباقة والعدد مطلوبان' });
      return;
    }

    const codes = [];
    for (let i = 0; i < parseInt(count); i++) {
      const code = generateCode();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      codes.push({ code, plan, expiresAt });
    }

    await prisma.subscriptionCode.createMany({ data: codes });

    res.status(201).json({
      success: true,
      message: `تم إنشاء ${count} كود بنجاح`,
      data: codes.map(c => c.code),
    });
  } catch {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminDeleteCode(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    await prisma.subscriptionCode.delete({ where: { id } });
    res.json({ success: true, message: 'تم حذف الكود' });
  } catch {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminActivateSubscription(req: Request, res: Response): Promise<void> {
  try {
    const { userId, plan } = req.body;

    if (!userId || !plan) {
      res.status(400).json({ success: false, message: 'المستخدم والباقة مطلوبان' });
      return;
    }

    const startDate = new Date();
    const endDate = new Date();

    if (plan === 'WEEKLY') endDate.setDate(endDate.getDate() + 7);
    else if (plan === 'MONTHLY') endDate.setDate(endDate.getDate() + 30);
    else if (plan === 'YEARLY') endDate.setFullYear(endDate.getFullYear() + 1);

    const subscription = await prisma.subscription.upsert({
      where: { userId },
      update: { plan, status: 'ACTIVE', startDate, endDate },
      create: { userId, plan, status: 'ACTIVE', startDate, endDate },
    });

    res.json({ success: true, data: subscription });
  } catch {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminGetLaunchPeriod(req: Request, res: Response): Promise<void> {
  try {
    const launch = await prisma.launchPeriod.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: launch });
  } catch {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminSetLaunchPeriod(req: Request, res: Response): Promise<void> {
  try {
    const { startDate, endDate, isActive } = req.body;

    if (!startDate || !endDate) {
      res.status(400).json({ success: false, message: 'تاريخ البداية والنهاية مطلوبان' });
      return;
    }

    await prisma.launchPeriod.updateMany({ data: { isActive: false } });

    const launch = await prisma.launchPeriod.create({
      data: {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: isActive ?? true,
      },
    });

    res.status(201).json({ success: true, data: launch });
  } catch {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

// ═══ HELPER ═══

function generateCode(): string {
  const segment = () => crypto.randomBytes(2).toString('hex').toUpperCase();
  return `SAWAB-${segment()}-${segment()}-${segment()}`;
}

async function checkLaunchPeriod(): Promise<boolean> {
  const now = new Date();
  const launch = await prisma.launchPeriod.findFirst({
    where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
  });
  return !!launch;
}