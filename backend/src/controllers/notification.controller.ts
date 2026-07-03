import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { sendNotification, sendNotificationToAll } from '../utils/push';
import { AuthRequest } from '../types';
import logger from '../utils/logger';

// ═══ STUDENT ═══

export async function saveFcmToken(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { token } = req.body;

    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken: token ?? null },
    });

    res.json({ success: true, message: token ? 'تم حفظ التوكن' : 'تم إلغاء الإشعارات' });
  } catch (err) {
    logger.error(`saveFcmToken — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

// ═══ ADMIN ═══

export async function adminSendToUser(req: Request, res: Response): Promise<void> {
  try {
    const { userId, title, body } = req.body;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user?.fcmToken) {
      res.status(404).json({ success: false, message: 'المستخدم لا يملك توكن إشعارات' });
      return;
    }

    const success = await sendNotification(user.fcmToken, title, body);
    res.json({ success, message: success ? 'تم إرسال الإشعار' : 'فشل إرسال الإشعار' });
  } catch (err) {
    logger.error(`adminSendToUser — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminSendToAll(req: Request, res: Response): Promise<void> {
  try {
    const { title, body } = req.body;

    if (!title || !body) {
      res.status(400).json({ success: false, message: 'العنوان والنص مطلوبان' });
      return;
    }

    const users = await prisma.user.findMany({
      where: { fcmToken: { not: null } },
      select: { fcmToken: true },
    });

    const tokens = users.map(u => u.fcmToken!).filter(Boolean);
    const successCount = await sendNotificationToAll(tokens, title, body);

    await prisma.notification.create({
      data: { title, body, sentBy: 'admin', totalSent: successCount },
    });

    res.json({
      success: true,
      message: `تم إرسال الإشعار لـ ${successCount} طالب`,
      data: { totalSent: successCount, totalTokens: tokens.length },
    });
  } catch (err) {
    logger.error(`adminSendToAll — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminSendToProvince(req: Request, res: Response): Promise<void> {
  try {
    const { title, body, province } = req.body;

    if (!title || !body || !province) {
      res.status(400).json({ success: false, message: 'العنوان والنص والمحافظة مطلوبة' });
      return;
    }

    const users = await prisma.user.findMany({
      where: { province, fcmToken: { not: null } },
      select: { fcmToken: true },
    });

    const tokens = users.map(u => u.fcmToken!).filter(Boolean);
    const successCount = await sendNotificationToAll(tokens, title, body);

    await prisma.notification.create({
      data: { title, body, sentBy: 'admin', totalSent: successCount },
    });

    res.json({
      success: true,
      message: `تم إرسال الإشعار لـ ${successCount} طالب في ${province}`,
      data: { totalSent: successCount, totalTokens: tokens.length },
    });
  } catch (err) {
    logger.error(`adminSendToProvince — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminSendToSubscribed(req: Request, res: Response): Promise<void> {
  try {
    const { title, body } = req.body;

    if (!title || !body) {
      res.status(400).json({ success: false, message: 'العنوان والنص مطلوبان' });
      return;
    }

    const now = new Date();
    const users = await prisma.user.findMany({
      where: {
        fcmToken: { not: null },
        subscription: { status: 'ACTIVE', endDate: { gte: now } },
      },
      select: { fcmToken: true },
    });

    const tokens = users.map(u => u.fcmToken!).filter(Boolean);
    const successCount = await sendNotificationToAll(tokens, title, body);

    await prisma.notification.create({
      data: { title, body, sentBy: 'admin', totalSent: successCount },
    });

    res.json({
      success: true,
      message: `تم إرسال الإشعار لـ ${successCount} مشترك`,
      data: { totalSent: successCount, totalTokens: tokens.length },
    });
  } catch (err) {
    logger.error(`adminSendToSubscribed — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminScheduleNotification(req: Request, res: Response): Promise<void> {
  try {
    const { title, body, scheduledAt, target, province } = req.body;

    if (!title || !body || !scheduledAt) {
      res.status(400).json({ success: false, message: 'العنوان والنص والوقت مطلوبة' });
      return;
    }

    const sendTime = new Date(scheduledAt);
    if (sendTime <= new Date()) {
      res.status(400).json({ success: false, message: 'الوقت يجب أن يكون في المستقبل' });
      return;
    }

    const delay = sendTime.getTime() - Date.now();

    setTimeout(async () => {
      try {
        let tokens: string[] = [];
        const now = new Date();

        if (target === 'subscribed') {
          const users = await prisma.user.findMany({
            where: { fcmToken: { not: null }, subscription: { status: 'ACTIVE', endDate: { gte: now } } },
            select: { fcmToken: true },
          });
          tokens = users.map(u => u.fcmToken!).filter(Boolean);
        } else if (target === 'province' && province) {
          const users = await prisma.user.findMany({
            where: { province, fcmToken: { not: null } },
            select: { fcmToken: true },
          });
          tokens = users.map(u => u.fcmToken!).filter(Boolean);
        } else {
          const users = await prisma.user.findMany({
            where: { fcmToken: { not: null } },
            select: { fcmToken: true },
          });
          tokens = users.map(u => u.fcmToken!).filter(Boolean);
        }

        const successCount = await sendNotificationToAll(tokens, title, body);

        await prisma.notification.create({
          data: { title, body, sentBy: 'admin', totalSent: successCount },
        });

        logger.info(`Scheduled notification sent to ${successCount} users`);
      } catch (err) {
        logger.error(`Scheduled notification failed: ${(err as Error).message}`);
      }
    }, delay);

    res.json({
      success: true,
      message: `تمت جدولة الإشعار للإرسال في ${sendTime.toLocaleString('ar-IQ')}`,
    });
  } catch (err) {
    logger.error(`adminScheduleNotification — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminGetNotifications(req: Request, res: Response): Promise<void> {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { sentAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: notifications });
  } catch (err) {
    logger.error(`adminGetNotifications — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}