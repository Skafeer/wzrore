"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminGetStats = adminGetStats;
const prisma_1 = require("../utils/prisma");
const logger_1 = __importDefault(require("../utils/logger"));
async function adminGetStats(req, res) {
    try {
        const { from, to } = req.query;
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - 7);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const dateFilter = {};
        if (from || to) {
            dateFilter.createdAt = {
                ...(from && { gte: new Date(from) }),
                ...(to && { lte: new Date(to) }),
            };
        }
        const [
        // ═══ المستخدمون ═══
        totalUsers, usersToday, usersThisWeek, usersThisMonth, 
        // ═══ الامتحانات ═══
        totalExams, totalSessions, completedSessions, completedToday, 
        // ═══ الاشتراكات ═══
        activeSubscriptions, weeklySubscriptions, monthlySubscriptions, yearlySubscriptions, expiringThisWeek, 
        // ═══ البلاغات ═══
        totalReports, pendingReports, 
        // ═══ تسجيلات يومية (آخر 7 أيام) ═══
        dailyRegistrations, 
        // ═══ أكثر المواد استخداماً ═══
        topSubjects, 
        // ═══ أصعب الأسئلة ═══
        hardestQuestions, 
        // ═══ الطلاب الأكثر نشاطاً ═══
        topStudents, 
        // ═══ توزيع المحافظات ═══
        provinceDistribution, 
        // ═══ آخر الجلسات ═══
        recentSessions,] = await Promise.all([
            // المستخدمون
            prisma_1.prisma.user.count({ where: dateFilter }),
            prisma_1.prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
            prisma_1.prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
            prisma_1.prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
            // الامتحانات
            prisma_1.prisma.exam.count(),
            prisma_1.prisma.examSession.count({ where: dateFilter }),
            prisma_1.prisma.examSession.count({ where: { ...dateFilter, isCompleted: true } }),
            prisma_1.prisma.examSession.count({ where: { isCompleted: true, submittedAt: { gte: startOfToday } } }),
            // الاشتراكات
            prisma_1.prisma.subscription.count({ where: { status: 'ACTIVE', endDate: { gte: now } } }),
            prisma_1.prisma.subscription.count({ where: { status: 'ACTIVE', endDate: { gte: now }, plan: 'WEEKLY' } }),
            prisma_1.prisma.subscription.count({ where: { status: 'ACTIVE', endDate: { gte: now }, plan: 'MONTHLY' } }),
            prisma_1.prisma.subscription.count({ where: { status: 'ACTIVE', endDate: { gte: now }, plan: 'YEARLY' } }),
            prisma_1.prisma.subscription.count({
                where: {
                    status: 'ACTIVE',
                    endDate: { gte: now, lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
                },
            }),
            // البلاغات
            prisma_1.prisma.report.count({ where: dateFilter }),
            prisma_1.prisma.report.count({ where: { status: 'PENDING' } }),
            // تسجيلات يومية آخر 7 أيام
            prisma_1.prisma.$queryRaw `
        SELECT
          DATE("createdAt") as date,
          COUNT(*) as count
        FROM "User"
        WHERE "createdAt" >= ${startOfWeek}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
            // أكثر المواد استخداماً
            prisma_1.prisma.examSession.groupBy({
                by: ['examId'],
                where: { isCompleted: true },
                _count: { examId: true },
                orderBy: { _count: { examId: 'desc' } },
                take: 5,
            }).then(async (results) => {
                const examIds = results.map(r => r.examId);
                const exams = await prisma_1.prisma.exam.findMany({
                    where: { id: { in: examIds } },
                    include: { subject: { select: { name: true } } },
                });
                return results.map(r => ({
                    examId: r.examId,
                    count: r._count.examId,
                    title: exams.find(e => e.id === r.examId)?.title ?? '',
                    subject: exams.find(e => e.id === r.examId)?.subject.name ?? '',
                }));
            }),
            // أصعب الأسئلة (أقل متوسط درجات)
            prisma_1.prisma.studentAnswer.groupBy({
                by: ['questionId'],
                _avg: { aiScore: true },
                _count: { questionId: true },
                having: { questionId: { _count: { gt: 2 } } },
                orderBy: { _avg: { aiScore: 'asc' } },
                take: 5,
            }).then(async (results) => {
                const questionIds = results.map(r => r.questionId);
                const questions = await prisma_1.prisma.question.findMany({
                    where: { id: { in: questionIds } },
                    include: { exam: { select: { title: true } } },
                });
                return results.map(r => ({
                    questionId: r.questionId,
                    avgScore: Math.round((r._avg.aiScore ?? 0) * 10) / 10,
                    attempts: r._count.questionId,
                    text: questions.find(q => q.id === r.questionId)?.text.slice(0, 80) ?? '',
                    examTitle: questions.find(q => q.id === r.questionId)?.exam.title ?? '',
                }));
            }),
            // الطلاب الأكثر نشاطاً
            prisma_1.prisma.user.findMany({
                where: { studyStreak: { gt: 0 } },
                orderBy: { studyStreak: 'desc' },
                take: 5,
                select: { id: true, name: true, studyStreak: true, bestStreak: true, province: true },
            }),
            // توزيع الطلاب حسب المحافظة
            prisma_1.prisma.user.groupBy({
                by: ['province'],
                _count: { province: true },
                orderBy: { _count: { province: 'desc' } },
            }),
            // آخر الجلسات
            prisma_1.prisma.examSession.findMany({
                where: { isCompleted: true },
                orderBy: { submittedAt: 'desc' },
                take: 10,
                include: {
                    user: { select: { name: true } },
                    exam: { select: { title: true } },
                },
            }),
        ]);
        // حساب الإيرادات التقديرية
        const estimatedRevenue = {
            weekly: weeklySubscriptions * 2000,
            monthly: monthlySubscriptions * 5000,
            yearly: yearlySubscriptions * 10000,
            total: (weeklySubscriptions * 2000) + (monthlySubscriptions * 5000) + (yearlySubscriptions * 10000),
        };
        // معدل الإكمال
        const completionRate = totalSessions > 0
            ? Math.round((completedSessions / totalSessions) * 100)
            : 0;
        res.json({
            success: true,
            data: {
                // المستخدمون
                users: {
                    total: totalUsers,
                    today: usersToday,
                    thisWeek: usersThisWeek,
                    thisMonth: usersThisMonth,
                },
                // الامتحانات
                exams: {
                    total: totalExams,
                    totalSessions,
                    completedSessions,
                    completedToday,
                    completionRate,
                },
                // الاشتراكات
                subscriptions: {
                    active: activeSubscriptions,
                    weekly: weeklySubscriptions,
                    monthly: monthlySubscriptions,
                    yearly: yearlySubscriptions,
                    expiringThisWeek,
                    revenue: estimatedRevenue,
                },
                // البلاغات
                reports: {
                    total: totalReports,
                    pending: pendingReports,
                },
                // التسجيلات اليومية
                dailyRegistrations: dailyRegistrations.map(d => ({
                    date: d.date,
                    count: Number(d.count),
                })),
                // أكثر المواد استخداماً
                topSubjects,
                // أصعب الأسئلة
                hardestQuestions,
                // الطلاب الأكثر نشاطاً
                topStudents,
                // توزيع المحافظات
                provinceDistribution: provinceDistribution.map(p => ({
                    province: p.province,
                    count: p._count.province,
                })),
                // آخر الجلسات
                recentSessions,
            },
        });
    }
    catch (err) {
        logger_1.default.error(`adminGetStats — ${err.message}`, { stack: err.stack });
        res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
    }
}
//# sourceMappingURL=stats.controller.js.map