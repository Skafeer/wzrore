import { prisma } from './prisma';
import logger from './logger';
import { sendNotification } from './push';

export async function checkAndResetStreaks(): Promise<void> {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const users = await prisma.user.findMany({
      where: { studyStreak: { gt: 0 } },
      select: {
        id: true,
        studyStreak: true,
        bestStreak: true,
        lastStudyDate: true,
        streakFreeze: true,
      },
    });

    for (const user of users) {
      if (!user.lastStudyDate) continue;

      const lastStudy = new Date(
        user.lastStudyDate.getFullYear(),
        user.lastStudyDate.getMonth(),
        user.lastStudyDate.getDate()
      );

      const diffDays = Math.floor((today.getTime() - lastStudy.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 0 || diffDays === 1) continue;

      if (diffDays === 2 && user.streakFreeze > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: { streakFreeze: user.streakFreeze - 1 },
        });
        logger.info(`Streak Freeze used for user ${user.id}`);
      } else if (diffDays > 1) {
        await prisma.user.update({
          where: { id: user.id },
          data: { studyStreak: 0 },
        });
        logger.info(`Streak reset for user ${user.id} — ${diffDays} days missed`);
      }
    }

    logger.info(`Streak check completed for ${users.length} users`);
  } catch (err) {
    logger.error(`checkAndResetStreaks — ${(err as Error).message}`, { stack: (err as Error).stack });
  }
}

export async function sendStreakReminders(): Promise<void> {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // جلب المستخدمين اللي عندهم streak > 0 وما أكملوا امتحان اليوم
    const users = await prisma.user.findMany({
      where: {
        studyStreak: { gt: 0 },
        fcmToken: { not: null },
      },
      select: {
        id: true,
        name: true,
        studyStreak: true,
        streakFreeze: true,
        lastStudyDate: true,
        fcmToken: true,
      },
    });

    let sent = 0;

    for (const user of users) {
      if (!user.fcmToken) continue;

      const lastStudy = user.lastStudyDate
        ? new Date(
            user.lastStudyDate.getFullYear(),
            user.lastStudyDate.getMonth(),
            user.lastStudyDate.getDate()
          )
        : null;

      // أكمل اليوم — ما يحتاج تذكير
      if (lastStudy && lastStudy.getTime() === today.getTime()) continue;

      // حدد نوع الإشعار حسب الحالة
      let title = '';
      let body = '';

      const diffDays = lastStudy
        ? Math.floor((today.getTime() - lastStudy.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      if (diffDays === 1) {
        // فاته اليوم فقط — تذكير عادي
        title = `🔥 سلسلتك ${user.studyStreak} يوم في خطر!`;
        body = 'أكمل امتحاناً الآن للحفاظ على سلسلتك قبل منتصف الليل';
      } else if (diffDays === 2 && user.streakFreeze > 0) {
        // عنده Freeze — تحذير
        title = `🧊 تم استخدام درع الحماية!`;
        body = `سلسلتك ${user.studyStreak} يوم محمية اليوم، لكن ادرس غداً أو ستنتهي`;
      } else {
        // ما أكمل اليوم — تذكير بسيط
        title = '📚 وقت المذاكرة!';
        body = `لا تنسَ امتحانك اليومي — سلسلتك ${user.studyStreak} يوم تنتظرك`;
      }

      const success = await sendNotification(user.fcmToken, title, body);
      if (success) sent++;
    }

    logger.info(`Streak reminders sent to ${sent} users`);
  } catch (err) {
    logger.error(`sendStreakReminders — ${(err as Error).message}`, { stack: (err as Error).stack });
  }
}