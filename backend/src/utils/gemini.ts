import { GoogleGenerativeAI } from '@google/generative-ai';

const keys = [
  process.env.GEMINI_KEY_1!,
  process.env.GEMINI_KEY_2!,
  process.env.GEMINI_KEY_3!,
];

let currentKeyIndex = 0;

function getClient(): GoogleGenerativeAI {
  return new GoogleGenerativeAI(keys[currentKeyIndex]);
}

function rotateKey(): void {
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
}

export async function gradeAnswer(params: {
  questionText: string;
  modelAnswer: string;
  studentAnswer: string;
  degree: number;
  aiNotes?: string | null;
  modelImages?: string[];
}): Promise<{ score: number; feedback: string }> {
  const { questionText, modelAnswer, studentAnswer, degree, aiNotes, modelImages } = params;

  const prompt = `
أنت مصحح امتحانات متخصص لوزارة التربية العراقية.
مهمتك تصحيح إجابة الطالب بناءً على الإجابة النموذجية فقط، لا تستخدم أي معلومة خارجية.

السؤال: ${questionText}

الإجابة النموذجية: ${modelAnswer}

إجابة الطالب: ${studentAnswer || 'لم يجب الطالب'}

الدرجة الكاملة للسؤال: ${degree}

${aiNotes ? `ملاحظات للمصحح: ${aiNotes}` : ''}

قم بتصحيح الإجابة وأعط:
1. الدرجة المستحقة (رقم من 0 إلى ${degree})
2. تحليل مختصر يوضح نقاط القوة والضعف في إجابة الطالب

أجب بصيغة JSON فقط بدون أي نص إضافي:
{
  "score": <الدرجة>,
  "feedback": "<التحليل>"
}
`;

  for (let attempt = 0; attempt < keys.length; attempt++) {
    try {
      const model = getClient().getGenerativeModel({
        model: 'models/gemini-2.5-flash-lite',
      });

      const result = await model.generateContent(prompt);
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