import { GoogleGenerativeAI } from '@google/generative-ai';

const keys = [
  process.env.GEMINI_KEY_1!,
  process.env.GEMINI_KEY_2!,
  process.env.GEMINI_KEY_3!,
  process.env.GEMINI_KEY_4!,
  process.env.GEMINI_KEY_5!,
  process.env.GEMINI_KEY_6!,
  process.env.GEMINI_KEY_7!,

];

let currentKeyIndex = 0;

function getClient(): GoogleGenerativeAI {
  return new GoogleGenerativeAI(keys[currentKeyIndex]);
}

function rotateKey(): void {
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
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

  for (let attempt = 0; attempt < keys.length; attempt++) {
    try {
      const model = getClient().getGenerativeModel({
        model: 'models/gemini-2.5-flash-lite',
      });

      const parts: any[] = [{ text: prompt }];

      // إضافة صور الطالب
      if (hasStudentImages) {
        for (const imgUrl of studentImages!) {
          const imgData = await urlToBase64(imgUrl);
          if (imgData) {
            parts.push({
              inlineData: {
                mimeType: imgData.mimeType,
                data: imgData.data,
              },
            });
          }
        }
      }

      // إضافة صور الإجابة النموذجية إذا موجودة
      if (modelImages && modelImages.length > 0) {
        for (const imgUrl of modelImages) {
          const imgData = await urlToBase64(imgUrl);
          if (imgData) {
            parts.push({
              inlineData: {
                mimeType: imgData.mimeType,
                data: imgData.data,
              },
            });
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
      rotateKey();
      if (attempt === keys.length - 1) throw err;
    }
  }

  throw new Error('All Gemini keys failed');
}