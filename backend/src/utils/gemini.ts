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

export async function gradeAnswer(params: {
  questionText: string;
  modelAnswer: string;
  studentAnswer: string;
  degree: number;
  aiNotes?: string | null;
  modelImages?: string[];
  studentImages?: string[];
}): Promise<{ score: number; feedback: string }> {
  const { questionText, modelAnswer, studentAnswer, degree, aiNotes, modelImages, studentImages } = params;

  const hasStudentImages = studentImages && studentImages.length > 0;
  const hasStudentText = studentAnswer && studentAnswer.trim().length > 0;

  const prompt = `أنت مصحح امتحانات متخصص لوزارة التربية العراقية.
مهمتك تصحيح إجابة الطالب بناءً على الإجابة النموذجية فقط، لا تستخدم أي معلومة خارجية.

السؤال: ${questionText}

الإجابة النموذجية: ${modelAnswer}

إجابة الطالب النصية: ${hasStudentText ? studentAnswer : 'لم يكتب الطالب إجابة نصية'}

${hasStudentImages ? `ملاحظة مهمة: الطالب أرفق ${studentImages!.length} صورة كجزء من إجابته. الصور مرفقة في هذا الطلب، قم بمراجعتها وتصحيحها.` : ''}

الدرجة الكاملة للسؤال: ${degree}

${aiNotes ? `ملاحظات للمصحح: ${aiNotes}` : ''}

قم بتصحيح الإجابة (النصية والصور إن وجدت) وأعط:
1. الدرجة المستحقة (رقم من 0 إلى ${degree})
2. تحليل مختصر يوضح نقاط القوة والضعف

أجب بصيغة JSON فقط بدون أي نص إضافي:
{
  "score": <الدرجة>,
  "feedback": "<التحليل>"
}`;

  // محاولة مع كل المفاتيح + retry
  const maxRounds = 3; // 3 جولات على كل المفاتيح
  for (let round = 0; round < maxRounds; round++) {
    for (let attempt = 0; attempt < keys.length; attempt++) {
      try {
        const model = getClient().getGenerativeModel({
          model: 'gemini-2.5-flash-lite',
        });

        const parts: any[] = [{ text: prompt }];

        if (hasStudentImages) {
          for (const imgUrl of studentImages!) {
            const imgData = await urlToBase64(imgUrl);
            if (imgData) {
              parts.push({ inlineData: { mimeType: imgData.mimeType, data: imgData.data } });
            }
          }
        }

        if (modelImages && modelImages.length > 0) {
          for (const imgUrl of modelImages) {
            const imgData = await urlToBase64(imgUrl);
            if (imgData) {
              parts.push({ inlineData: { mimeType: imgData.mimeType, data: imgData.data } });
            }
          }
        }

        const result = await model.generateContent(parts);
        const text = result.response.text().trim();
        const clean = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);

        return {
          score: Math.min(Math.max(Number(parsed.score), 0), degree),
          feedback: parsed.feedback,
        };
      } catch (err) {
        const errMsg = (err as Error).message;
        logger.warn(`Gemini key ${currentKeyIndex} failed (round ${round + 1}): ${errMsg}`);
        rotateKey();

        // تأخير بين المحاولات
        if (attempt < keys.length - 1) await sleep(1000);
      }
    }

    // تأخير بين الجولات
    if (round < maxRounds - 1) {
      logger.warn(`All keys failed, waiting 5s before retry (round ${round + 1}/${maxRounds})`);
      await sleep(5000);
    }
  }

  // Fallback — لو فشل كل شي، أعطه درجة جزئية مع رسالة
  logger.error('All Gemini attempts failed — using fallback score');
  return {
    score: 0,
    feedback: 'تعذر تصحيح الإجابة تلقائياً بسبب ضغط على الخدمة. سيتم مراجعة الإجابة لاحقاً.',
  };
}