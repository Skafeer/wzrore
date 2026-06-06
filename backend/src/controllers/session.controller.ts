import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { gradeAnswer } from '../utils/gemini';
import { uploadImage } from '../utils/cloudinary';
import { AuthRequest } from '../types';

// بدء امتحان جديد
export async function startExam(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { examId } = req.body;
    const userId = req.user!.id;

    if (!examId) {
      res.status(400).json({ success: false, message: 'معرف الامتحان مطلوب' });
      return;
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            text: true,
            degree: true,
            order: true,
            modelImages: true,
          },
        },
      },
    });

    if (!exam) {
      res.status(404).json({ success: false, message: 'الامتحان غير موجود' });
      return;
    }

    // التحقق من حد الامتحانات للمجاني
    const isLaunchPeriod = await checkLaunchPeriod();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    const hasPaidSub = user?.subscription?.status === 'ACTIVE' &&
      new Date(user.subscription.endDate) > new Date();

    if (!isLaunchPeriod && !hasPaidSub) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const examCount = await prisma.examSession.count({
        where: { userId, createdAt: { gte: startOfMonth }, isCompleted: true },
      });
      if (examCount >= 5) {
        res.status(403).json({
          success: false,
          message: 'وصلت للحد الأقصى للامتحانات المجانية هذا الشهر (5 امتحانات)',
          requiresSubscription: true,
        });
        return;
      }
    }

    // إنشاء جلسة جديدة بـ UUID
    const session = await prisma.examSession.create({
      data: {
        userId,
        examId,
        totalScore: 0,
        maxScore: exam.questions.reduce((sum, q) => sum + q.degree, 0),
      },
    });

    // تحديث streak
    await updateStudyStreak(userId);

    res.status(201).json({
      success: true,
      data: {
        sessionId: session.id,
        exam: {
          id: exam.id,
          title: exam.title,
          duration: exam.duration,
          questions: exam.questions,
        },
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

// حفظ إجابة سؤال
export async function saveAnswer(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { sessionId } = req.params as { sessionId: string };
    const { questionId, answerText } = req.body;
    const userId = req.user!.id;

    const session = await prisma.examSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      res.status(403).json({ success: false, message: 'غير مصرح' });
      return;
    }

    if (session.isCompleted) {
      res.status(400).json({ success: false, message: 'الامتحان مسلّم بالفعل' });
      return;
    }

    // رفع الصور إذا موجودة
    const answerImages: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      const hasPaidSub = req.user!.plan !== null;
      const maxImages = hasPaidSub ? 3 : 1;
      const filesToUpload = req.files.slice(0, maxImages);

      for (const file of filesToUpload) {
        const url = await uploadImage(file.buffer, 'answers');
        answerImages.push(url);
      }
    }

    const answer = await prisma.studentAnswer.upsert({
      where: {
        sessionId_questionId: { sessionId, questionId },
      },
      update: { answerText, answerImages },
      create: { sessionId, questionId, answerText, answerImages },
    });

    res.json({ success: true, data: answer });
  } catch {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

// تسليم الامتحان وتصحيح بالذكاء الاصطناعي
export async function submitExam(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { sessionId } = req.params as { sessionId: string };
    const userId = req.user!.id;

    const session = await prisma.examSession.findUnique({
      where: { id: sessionId },
      include: {
        exam: {
          include: {
            questions: { orderBy: { order: 'asc' } },
          },
        },
        studentAnswers: true,
      },
    });

    if (!session || session.userId !== userId) {
      res.status(403).json({ success: false, message: 'غير مصرح' });
      return;
    }

    if (session.isCompleted) {
      res.status(400).json({ success: false, message: 'الامتحان مسلّم بالفعل' });
      return;
    }

    // تصحيح كل سؤال بالذكاء الاصطناعي
    let totalScore = 0;
    const gradingResults = [];

    for (const question of session.exam.questions) {
      const studentAnswer = session.studentAnswers.find(
        a => a.questionId === question.id
      );

      const result = await gradeAnswer({
        questionText: question.text,
        modelAnswer: question.modelAnswer,
        studentAnswer: studentAnswer?.answerText ?? '',
        degree: question.degree,
        aiNotes: question.aiNotes,
        modelImages: question.modelImages,
      });

      totalScore += result.score;

      // تحديث الإجابة بنتيجة التصحيح
      await prisma.studentAnswer.upsert({
        where: {
          sessionId_questionId: { sessionId, questionId: question.id },
        },
        update: { aiScore: result.score, aiFeedback: result.feedback },
        create: {
          sessionId,
          questionId: question.id,
          answerText: studentAnswer?.answerText ?? '',
          answerImages: studentAnswer?.answerImages ?? [],
          aiScore: result.score,
          aiFeedback: result.feedback,
        },
      });

      gradingResults.push({
        questionId: question.id,
        score: result.score,
        feedback: result.feedback,
      });
    }

    // تحديث الجلسة كمكتملة
    const updatedSession = await prisma.examSession.update({
      where: { id: sessionId },
      data: {
        isCompleted: true,
        submittedAt: new Date(),
        totalScore,
      },
    });

    res.json({
      success: true,
      data: {
        sessionId,
        totalScore,
        maxScore: updatedSession.maxScore,
        gradingResults,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

// صفحة النتيجة الكاملة
export async function getResult(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { sessionId } = req.params as { sessionId: string };
    const userId = req.user!.id;

    const session = await prisma.examSession.findUnique({
      where: { id: sessionId },
      include: {
        exam: {
          include: {
            subject: { select: { name: true } },
            chapter: { select: { name: true } },
            topic: { select: { name: true } },
            questions: { orderBy: { order: 'asc' } },
          },
        },
        studentAnswers: true,
      },
    });

    if (!session || session.userId !== userId) {
      res.status(403).json({ success: false, message: 'غير مصرح' });
      return;
    }

    if (!session.isCompleted) {
      res.status(400).json({ success: false, message: 'الامتحان لم يُسلَّم بعد' });
      return;
    }

    // بناء تفصيل الأسئلة
    const questionsDetail = session.exam.questions.map(q => {
      const answer = session.studentAnswers.find(a => a.questionId === q.id);
      return {
        questionId: q.id,
        questionText: q.text,
        modelAnswer: q.modelAnswer,
        modelImages: q.modelImages,
        degree: q.degree,
        studentAnswer: answer?.answerText ?? '',
        studentImages: answer?.answerImages ?? [],
        aiScore: answer?.aiScore ?? 0,
        aiFeedback: answer?.aiFeedback ?? '',
      };
    });

    res.json({
      success: true,
      data: {
        sessionId,
        examTitle: session.exam.title,
        subject: session.exam.subject.name,
        totalScore: session.totalScore,
        maxScore: session.maxScore,
        submittedAt: session.submittedAt,
        questions: questionsDetail,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

// آخر امتحان للصفحة الرئيسية
export async function getLastExam(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;

    const session = await prisma.examSession.findFirst({
      where: { userId, isCompleted: true },
      orderBy: { submittedAt: 'desc' },
      include: {
        exam: {
          include: {
            subject: { select: { name: true } },
            chapter: { select: { name: true } },
          },
        },
      },
    });

    if (!session) {
      res.json({ success: true, data: null });
      return;
    }

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        subject: session.exam.subject.name,
        chapter: session.exam.chapter?.name ?? null,
        examTitle: session.exam.title,
        totalScore: session.totalScore,
        maxScore: session.maxScore,
        submittedAt: session.submittedAt,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

// ملخص الأداء للصفحة الرئيسية
export async function getPerformanceSummary(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;

    const sessions = await prisma.examSession.findMany({
      where: { userId, isCompleted: true },
      select: { totalScore: true, maxScore: true },
    });

    const totalExams = sessions.length;
    const avgScore = totalExams > 0
      ? sessions.reduce((sum, s) => {
          const pct = s.maxScore && s.maxScore > 0
            ? (s.totalScore ?? 0) / s.maxScore * 100
            : 0;
          return sum + pct;
        }, 0) / totalExams
      : 0;

    res.json({
      success: true,
      data: {
        totalExams,
        avgScore: Math.round(avgScore * 10) / 10,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

// ═══ HELPER ═══

async function checkLaunchPeriod(): Promise<boolean> {
  const now = new Date();
  const launch = await prisma.launchPeriod.findFirst({
    where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
  });
  return !!launch;
}

async function updateStudyStreak(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastStudy = user.lastStudyDate
    ? new Date(user.lastStudyDate.getFullYear(), user.lastStudyDate.getMonth(), user.lastStudyDate.getDate())
    : null;

  if (!lastStudy) {
    await prisma.user.update({
      where: { id: userId },
      data: { studyStreak: 1, lastStudyDate: now },
    });
    return;
  }

  const diffDays = Math.floor((today.getTime() - lastStudy.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return; // نفس اليوم
  if (diffDays === 1) {
    await prisma.user.update({
      where: { id: userId },
      data: { studyStreak: { increment: 1 }, lastStudyDate: now },
    });
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: { studyStreak: 1, lastStudyDate: now },
    });
  }
}