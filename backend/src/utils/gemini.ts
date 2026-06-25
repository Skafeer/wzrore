import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from './logger';

const keys = [
  process.env.GEMINI_KEY_1!,
  process.env.GEMINI_KEY_2!,
  process.env.GEMINI_KEY_3!,
  process.env.GEMINI_KEY_4!,
  process.env.GEMINI_KEY_5!,
  process.env.GEMINI_KEY_6!,
  process.env.GEMINI_KEY_7!,
].filter(Boolean);

let currentKeyIndex = 0;

function getClient(): GoogleGenerativeAI {
  return new GoogleGenerativeAI(keys[currentKeyIndex]);
}

function rotateKey(): void {
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function urlToBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const contentType = response.headers.get('content-type') ?? 'image/jpeg';
    return { data: base64, mimeType: contentType };
  } catch {
    return null;
  }
}

export type QuestionGradeInput = {
  questionId: string;
  questionText: string;
  modelAnswer: string;
  studentAnswer: string;
  degree: number;
  aiNotes?: string | null;
  modelImages?: string[];
  studentImages?: string[];
};

export type QuestionGradeResult = {
  questionId: string;
  score: number;
  feedback: string;
};

// ═══ تصحيح كل أسئلة الامتحان بطلب واحد ═══
export async function gradeExam(
  questions: QuestionGradeInput[]
): Promise<QuestionGradeResult[]> {

  const prompt = buildBatchPrompt(questions);
  const parts: any[] = [{ text: prompt }];

  // إضافة الصور
  for (const q of questions) {
    if (q.studentImages && q.studentImages.length > 0) {
      for (const imgUrl of q.studentImages) {
        const imgData = await urlToBase64(imgUrl);
        if (imgData) {
          parts.push({ inlineData: { mimeType: imgData.mimeType, data: imgData.data } });
        }
      }
    }
    if (q.modelImages && q.modelImages.length > 0) {
      for (const imgUrl of q.modelImages) {
        const imgData = await urlToBase64(imgUrl);
        if (imgData) {
          parts.push({ inlineData: { mimeType: imgData.mimeType, data: imgData.data } });
        }
      }
    }
  }

  // محاولة مع كل المفاتيح
  for (let attempt = 0; attempt < keys.length; attempt++) {
    try {
      const model = getClient().getGenerativeModel({
        model: 'gemini-2.5-flash-lite',
      });

      const result = await model.generateContent(parts);
      const text = result.response.text().trim();
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);

      // التحقق من النتيجة
      if (!Array.isArray(parsed)) throw new Error('Response is not an array');

      return parsed.map((item: any, index: number) => ({
        questionId: questions[index].questionId,
        score: Math.min(Math.max(Number(item.score ?? 0), 0), questions[index].degree),
        feedback: item.feedback ?? 'لا يوجد تحليل',
      }));

    } catch (err) {
      logger.warn(`Gemini key ${currentKeyIndex} failed (attempt ${attempt + 1}): ${(err as Error).message}`);
      rotateKey();
      if (attempt < keys.length - 1) await sleep(2000);
    }
  }

  // Fallback — لو فشل كل شي
  logger.error('All Gemini keys failed — using fallback scores');
  return questions.map(q => ({
    questionId: q.questionId,
    score: 0,
    feedback: 'تعذر التصحيح التلقائي بسبب ضغط على الخدمة.',
  }));
}

function buildBatchPrompt(questions: QuestionGradeInput[]): string {
  const questionsText = questions.map((q, index) => {
    const hasText = q.studentAnswer?.trim();
    const hasImages = q.studentImages && q.studentImages.length > 0;

    let studentAnswerLine = '';
    if (hasText && hasImages) {
      studentAnswerLine = `إجابة الطالب النصية: ${q.studentAnswer}\n(كما أرفق ${q.studentImages!.length} صورة — راجعها أعلاه)`;
    } else if (hasText) {
      studentAnswerLine = `إجابة الطالب: ${q.studentAnswer}`;
    } else if (hasImages) {
      studentAnswerLine = `إجابة الطالب: الطالب أجاب عبر ${q.studentImages!.length} صورة فقط — راجع الصور أعلاه وصحح بناءً عليها`;
    } else {
      studentAnswerLine = `إجابة الطالب: لم يكتب إجابة ولم يرفع صور — الدرجة صفر`;
    }

    return `
--- السؤال ${index + 1} ---
نص السؤال: ${q.questionText}
الإجابة النموذجية: ${q.modelAnswer}
${studentAnswerLine}
الدرجة الكاملة: ${q.degree}
${q.aiNotes ? `ملاحظات للمصحح: ${q.aiNotes}` : ''}
`;
  }).join('\n');

  return `أنت مصحح امتحانات متخصص لوزارة التربية العراقية.
مهمتك تصحيح إجابات الطالب بناءً على الإجابات النموذجية فقط، لا تستخدم أي معلومة خارجية.
الصور المرفقة في هذا الطلب هي إجابات الطلاب — قم بمراجعتها وتصحيحها.

${questionsText}

قم بتصحيح جميع الأسئلة وأعد النتيجة بصيغة JSON فقط — مصفوفة بنفس ترتيب الأسئلة:
[
  { "score": <الدرجة>, "feedback": "<التحليل>" },
  { "score": <الدرجة>, "feedback": "<التحليل>" }
]

بدون أي نص إضافي خارج الـ JSON.`;
}