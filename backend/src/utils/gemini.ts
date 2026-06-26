import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
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
];

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

    parts.push({ text: promptText });
    promptText = '';

    if (hasStudentImages) {
      for (const imgUrl of q.studentImages!) {
        const imgData = await urlToBase64(imgUrl);
        if (imgData) parts.push({ inlineData: { mimeType: imgData.mimeType, data: imgData.data } });
      }
    }

    if (hasModelImages) {
      for (const imgUrl of q.modelImages!) {
        const imgData = await urlToBase64(imgUrl);
        if (imgData) parts.push({ inlineData: { mimeType: imgData.mimeType, data: imgData.data } });
      }
    }
  }

  parts.push({ text: `
قم بتصحيح جميع الأسئلة بناءً على إجابة كل سؤال وصوره الخاصة فقط.
أعد النتيجة بصيغة JSON فقط — مصفوفة بنفس ترتيب الأسئلة:
[
  { "score": <الدرجة>, "feedback": "<التحليل>" },
  { "score": <الدرجة>, "feedback": "<التحليل>" }
]
بدون أي نص إضافي خارج الـ JSON.` });

  // ═══ محاولة Gemini ═══
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

  // ═══ Fallback: Groq ═══
  logger.warn('All Gemini models failed — trying Groq...');
  try {
    const results = await gradeWithGroq(questions);
    logger.info('Graded successfully with Groq');
    return results;
  } catch (err) {
    logger.error(`Groq also failed: ${(err as Error).message}`);
  }

  // ═══ Fallback نهائي ═══
  logger.error('All models and keys failed — using fallback scores');
  return questions.map(q => ({
    questionId: q.questionId,
    score: 0,
    feedback: 'تعذر التصحيح التلقائي بسبب ضغط على الخدمة.',
  }));
}

async function gradeWithGroq(questions: QuestionGradeInput[]): Promise<QuestionGradeResult[]> {
  const prompt = buildGroqPrompt(questions);

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
  });

  const text = response.choices[0]?.message?.content?.trim() ?? '';
  const clean = text.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean);

  if (!Array.isArray(parsed)) throw new Error('Response is not an array');

  return parsed.map((item: any, index: number) => ({
    questionId: questions[index].questionId,
    score: Math.min(Math.max(Number(item.score ?? 0), 0), questions[index].degree),
    feedback: item.feedback ?? 'لا يوجد تحليل',
  }));
}

function buildGroqPrompt(questions: QuestionGradeInput[]): string {
  const questionsText = questions.map((q, index) => {
    const hasText = q.studentAnswer?.trim();
    const hasImages = q.studentImages && q.studentImages.length > 0;

    let studentAnswerLine = '';
    if (hasText) {
      studentAnswerLine = `إجابة الطالب: ${q.studentAnswer}`;
    } else if (hasImages) {
      studentAnswerLine = `إجابة الطالب: أرفق صوراً فقط (لا يمكن قراءة الصور — أعطه درجة جزئية 50%)`;
    } else {
      studentAnswerLine = `إجابة الطالب: لم يكتب إجابة — الدرجة صفر`;
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
صحح إجابات الطالب بناءً على الإجابات النموذجية فقط، لا تستخدم أي معلومة خارجية.

${questionsText}

أعد النتيجة بصيغة JSON فقط — مصفوفة بنفس ترتيب الأسئلة:
[
  { "score": <الدرجة>, "feedback": "<التحليل>" }
]
بدون أي نص إضافي خارج الـ JSON.`;
}