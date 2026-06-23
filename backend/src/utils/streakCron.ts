import { prisma } from './prisma';
import logger from './logger';

export async function checkAndResetStreaks(): Promise<void> {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // جلب كل المستخدمين اللي عندهم streak > 0
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

      if (diffDays === 0 || diffDays === 1) continue; // أكمل اليوم أو الأمس — بخير

      if (diffDays === 2 && user.streakFreeze > 0) {
        // فاته يوم — استخدم Freeze
        await prisma.user.update({
          where: { id: user.id },
          data: { streakFreeze: user.streakFreeze - 1 },
        });
        logger.info(`Streak Freeze used for user ${user.id}`);
      } else if (diffDays > 1) {
        // فاته أكثر — تصفير
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