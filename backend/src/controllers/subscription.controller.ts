import crypto from 'crypto';
import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';
import logger from '../utils/logger';

function hashCode(code: string): string {
  return crypto.createHmac('sha256', process.env.ENCRYPTION_KEY!)
    .update(code.trim().toUpperCase()).digest('hex');
}

// ═══ helper مشترك لتحقق الاشتراك وتحديثه ═══
async function resolveSubscription(userId: string) {
  const now = new Date();
  const subscription = await prisma.subscription.findUnique({ where: { userId } });

  if (subscription?.status === 'ACTIVE' && new Date(subscription.endDate) < now) {
    await prisma.subscription.update({ where: { userId }, data: { status: 'EXPIRED' } });
    subscription.status = 'EXPIRED';
  }

  return subscription;
}

export async function redeemCode(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { code } = req.body;
    const userId = req.user!.id;

    if (!code) { res.status(400).json({ success: false, message: 'الكود مطلوب' }); return; }

    const hashed = hashCode(code);
    const subCode = await prisma.subscriptionCode.findUnique({ where: { code: hashed } });

    if (!subCode) { res.status(404).json({ success: false, message: 'الكود غير موجود' }); return; }
    if (subCode.isUsed) { res.status(400).json({ success: false, message: 'الكود مستخدم مسبقاً' }); return; }
    if (new Date() > new Date(subCode.expiresAt)) { res.status(400).json({ success: false, message: 'الكود منتهي الصلاحية' }); return; }

    const startDate = new Date();
    const endDate = new Date();
    if (subCode.plan === 'WEEKLY') endDate.setDate(endDate.getDate() + 7);
    else if (subCode.plan === 'MONTHLY') endDate.setDate(endDate.getDate() + 30);
    else if (subCode.plan === 'YEARLY') endDate.setFullYear(endDate.getFullYear() + 1);

    await prisma.subscriptionCode.update({ where: { code: hashed }, data: { isUsed: true, usedBy: userId, usedAt: new Date() } });

    const subscription = await prisma.subscription.upsert({
      where: { userId },
      update: { plan: subCode.plan, status: 'ACTIVE', startDate, endDate },
      create: { userId, plan: subCode.plan, status: 'ACTIVE', startDate, endDate },
    });

    res.json({ success: true, message: 'تم تفعيل الاشتراك بنجاح', data: subscription });
  } catch (err) {
    logger.error(`redeemCode — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function getMySubscription(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const now = new Date();

    const subscription = await resolveSubscription(userId);
    const isLaunchPeriod = await checkLaunchPeriod();
    const isActive = isLaunchPeriod ||
      (subscription?.status === 'ACTIVE' && new Date(subscription.endDate) > now);

    res.json({ success: true, data: { subscription, isLaunchPeriod, isActive } });
  } catch (err) {
    logger.error(`getMySubscription — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminGetCodes(req: Request, res: Response): Promise<void> {
  try {
    const { isUsed } = req.query as { isUsed?: string };
    const where: Record<string, unknown> = {};
    if (isUsed !== undefined) where.isUsed = isUsed === 'true';
    const codes = await prisma.subscriptionCode.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: codes.map(c => ({ ...c, code: c.plainCode ?? c.code })) });
  } catch (err) {
    logger.error(`adminGetCodes — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminCreateCodes(req: Request, res: Response): Promise<void> {
  try {
    const { plan, count } = req.body;
    if (!plan || !count) { res.status(400).json({ success: false, message: 'الباقة والعدد مطلوبان' }); return; }

    const plainCodes: string[] = [];
    const codes = [];
    for (let i = 0; i < parseInt(count); i++) {
      const plainCode = generateCode();
      const hashed = hashCode(plainCode);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      plainCodes.push(plainCode);
      codes.push({ code: hashed, plainCode, plan, expiresAt });
    }
    await prisma.subscriptionCode.createMany({ data: codes });
    res.status(201).json({ success: true, message: `تم إنشاء ${count} كود بنجاح`, data: plainCodes });
  } catch (err) {
    logger.error(`adminCreateCodes — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminDeleteCode(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    await prisma.subscriptionCode.delete({ where: { id } });
    res.json({ success: true, message: 'تم حذف الكود' });
  } catch (err) {
    logger.error(`adminDeleteCode — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminActivateSubscription(req: Request, res: Response): Promise<void> {
  try {
    const { userId, plan } = req.body;
    if (!userId || !plan) { res.status(400).json({ success: false, message: 'المستخدم والباقة مطلوبان' }); return; }

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
  } catch (err) {
    logger.error(`adminActivateSubscription — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminCancelSubscription(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.params as { userId: string };
    await prisma.subscription.update({ where: { userId }, data: { status: 'CANCELLED' } });
    res.json({ success: true, message: 'تم إلغاء الاشتراك' });
  } catch (err) {
    logger.error(`adminCancelSubscription — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminGetLaunchPeriod(req: Request, res: Response): Promise<void> {
  try {
    const launch = await prisma.launchPeriod.findFirst({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: launch });
  } catch (err) {
    logger.error(`adminGetLaunchPeriod — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminSetLaunchPeriod(req: Request, res: Response): Promise<void> {
  try {
    const { startDate, endDate, isActive } = req.body;
    if (!startDate || !endDate) { res.status(400).json({ success: false, message: 'تاريخ البداية والنهاية مطلوبان' }); return; }

    await prisma.launchPeriod.updateMany({ data: { isActive: false } });
    const launch = await prisma.launchPeriod.create({
      data: { startDate: new Date(startDate), endDate: new Date(endDate), isActive: isActive ?? true },
    });
    res.status(201).json({ success: true, data: launch });
  } catch (err) {
    logger.error(`adminSetLaunchPeriod — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

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