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

const MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash-8b',
];

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

export async function gradeExam(
  questions: QuestionGradeInput[]
): Promise<QuestionGradeResult[]> {

  const parts: any[] = [];

  // مقدمة الـ prompt
  let promptText = `أنت مصحح امتحانات متخصص لوزارة التربية العراقية.
مهمتك تصحيح إجابات الطالب بناءً على الإجابات النموذجية فقط، لا تستخدم أي معلومة خارجية.
كل سؤال له صوره الخاصة المذكورة بعده مباشرة — لا تطبق صور سؤال على سؤال آخر.

`;

  // نبني الـ parts بترتيب: نص السؤال ثم صوره مباشرة
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const hasText = q.studentAnswer?.trim();
    const hasStudentImages = q.studentImages && q.studentImages.length > 0;
    const hasModelImages = q.modelImages && q.modelImages.length > 0;

    let studentAnswerLine = '';
    if (hasText && hasStudentImages) {
      studentAnswerLine = `إجابة الطالب النصية: ${q.studentAnswer}\n(+ ${q.studentImages!.length} صورة مرفقة بعد هذا النص مباشرة)`;
    } else if (hasText) {
      studentAnswerLine = `إجابة الطالب: ${q.studentAnswer}`;
    } else if (hasStudentImages) {
      studentAnswerLine = `إجابة الطالب: عبر صور فقط — ${q.studentImages!.length} صورة مرفقة بعد هذا السؤال مباشرة`;
    } else {
      studentAnswerLine = `إجابة الطالب: لم يكتب إجابة ولم يرفع صور — الدرجة صفر`;
    }

    promptText += `
--- السؤال ${i + 1} ---
نص السؤال: ${q.questionText}
الإجابة النموذجية: ${q.modelAnswer}
${studentAnswerLine}
الدرجة الكاملة: ${q.degree}
${q.aiNotes ? `ملاحظات للمصحح: ${q.aiNotes}` : ''}
${hasStudentImages || hasModelImages ? `[الصور الخاصة بالسؤال ${i + 1} تأتي بعد هذا النص مباشرة]` : ''}
`;

    // أضف النص المتراكم كـ part
    parts.push({ text: promptText });
    promptText = ''; // reset

    // أضف صور الطالب مباشرة بعد نص السؤال
    if (hasStudentImages) {
      for (const imgUrl of q.studentImages!) {
        const imgData = await urlToBase64(imgUrl);
        if (imgData) parts.push({ inlineData: { mimeType: imgData.mimeType, data: imgData.data } });
      }
    }

    // أضف صور الإجابة النموذجية
    if (hasModelImages) {
      for (const imgUrl of q.modelImages!) {
        const imgData = await urlToBase64(imgUrl);
        if (imgData) parts.push({ inlineData: { mimeType: imgData.mimeType, data: imgData.data } });
      }
    }
  }

  // التعليمات النهائية
  parts.push({ text: `
قم بتصحيح جميع الأسئلة بناءً على إجابة كل سؤال وصوره الخاصة فقط.
أعد النتيجة بصيغة JSON فقط — مصفوفة بنفس ترتيب الأسئلة:
[
  { "score": <الدرجة>, "feedback": "<التحليل>" },
  { "score": <الدرجة>, "feedback": "<التحليل>" }
]
بدون أي نص إضافي خارج الـ JSON.` });

  // نجرب كل موديل مع كل المفاتيح
  for (const modelName of MODELS) {
    for (let attempt = 0; attempt < keys.length; attempt++) {
      try {
        const model = getClient().getGenerativeModel({ model: modelName });
        const result = await model.generateContent(parts);
        const text = result.response.text().trim();
        const clean = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);

        if (!Array.isArray(parsed)) throw new Error('Response is not an array');

        logger.info(`Graded successfully — model: ${modelName}, key: ${currentKeyIndex}`);

        return parsed.map((item: any, index: number) => ({
          questionId: questions[index].questionId,
          score: Math.min(Math.max(Number(item.score ?? 0), 0), questions[index].degree),
          feedback: item.feedback ?? 'لا يوجد تحليل',
        }));

      } catch (err) {
        logger.warn(`Model ${modelName} key ${currentKeyIndex} failed (attempt ${attempt + 1}): ${(err as Error).message}`);
        rotateKey();
        if (attempt < keys.length - 1) await sleep(1000);
      }
    }

    logger.warn(`All keys failed for model ${modelName} — trying next model...`);
    await sleep(3000);
  }

  // Fallback
  logger.error('All models and keys failed — using fallback scores');
  return questions.map(q => ({
    questionId: q.questionId,
    score: 0,
    feedback: 'تعذر التصحيح التلقائي بسبب ضغط على الخدمة.',
  }));
}