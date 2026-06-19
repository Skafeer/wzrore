import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { sendNotification, sendNotificationToAll } from '../utils/push';
import { AuthRequest } from '../types';

// حفظ FCM Token
export async function saveFcmToken(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { token } = req.body;

    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken: token ?? null },
    });

    res.json({ success: true, message: token ? 'تم حفظ التوكن' : 'تم إلغاء الإشعارات' });
  } catch {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

// إرسال إشعار لطالب محدد
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
  } catch {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

// إرسال إشعار لجميع الطلاب
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
      data: {
        title,
        body,
        sentBy: 'admin',
        totalSent: successCount,
      },
    });

    res.json({
      success: true,
      message: `تم إرسال الإشعار لـ ${successCount} طالب`,
      data: { totalSent: successCount, totalTokens: tokens.length },
    });
  } catch {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

// جلب سجل الإشعارات
export async function adminGetNotifications(req: Request, res: Response): Promise<void> {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { sentAt: 'desc' },
      take: 50,
    });

    res.json({ success: true, data: notifications });
  } catch {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}