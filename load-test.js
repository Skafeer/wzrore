import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');
const BASE_URL = 'https://wzrore-production.up.railway.app';

// 🔥 استخدم معرفات حقيقية من قاعدة البيانات
const EXAM_ID = '44827c8a-3ab3-455f-b3a2-c3ed1b6e4513';
const QUESTION_ID = '9c9a1d32-22e4-4fce-b389-9755c791b117';

export const options = {
  stages: [
    { duration: '30s', target: 5 },   // بداية بـ 3 مستخدمين
    { duration: '1m', target: 10 },    // زيادة إلى 5 مستخدمين
    { duration: '30s', target: 0 },   // إنهاء
  ],
  thresholds: {
    http_req_duration: ['p(95)<15000'], // 15 ثانية (Gemini يحتاج وقت)
    http_req_failed: ['rate<0.1'],
    errors: ['rate<0.1'],
  },
  // زيادة المهلة العالمية للطلبات (لأن Gemini بطيء)
  http_req_timeout: '60s',
};

export function setup() {
  let token = null;
  let attempts = 0;

  while (attempts < 3 && !token) {
    const res = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ phone: '07700000000', password: 'Sajad667' }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (res.status === 200) {
      token = res.json('data.token');
    } else {
      console.log(`⚠️ Login attempt ${attempts + 1} failed: ${res.status}`);
      attempts++;
      sleep(2);
    }
  }

  if (!token) {
    console.error('❌ Setup failed: Could not obtain token');
    return { token: null };
  }

  console.log(`✅ Login successful, token received`);
  return { token };
}

export default function (data) {
  if (!data.token) {
    console.error('❌ No token available, skipping iteration');
    errorRate.add(1);
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  // =============================================
  // 🔥 اختبار الذكاء الاصطناعي (تسليم الامتحان)
  // =============================================

  // 1. بدء امتحان
  const startRes = http.post(
    `${BASE_URL}/api/sessions/start`,
    JSON.stringify({ examId: EXAM_ID }),
    { headers }
  );

  let sessionId = null;
  if (startRes.status === 201) {
    sessionId = startRes.json('data.sessionId');
    console.log(`✅ Exam started, sessionId: ${sessionId}`);
  } else {
    console.log(`⚠️ Start exam failed: ${startRes.status} - ${startRes.body.slice(0, 200)}`);
    errorRate.add(1);
    // نكمل لباقي الطلبات حتى لو فشل بدء الامتحان
  }

  if (sessionId) {
    // 2. حفظ إجابة
    const answerRes = http.post(
      `${BASE_URL}/api/sessions/${sessionId}/answer`,
      JSON.stringify({
        questionId: QUESTION_ID,
        answerText: 'هذه إجابة اختبارية من K6 لمحاكاة الطالب',
      }),
      { headers }
    );
    const answerOk = check(answerRes, { '✅ answer saved': (r) => r.status === 200 });
    if (!answerOk) {
      console.log(`⚠️ Answer save failed: ${answerRes.status} - ${answerRes.body.slice(0, 200)}`);
      errorRate.add(1);
    }

    // 3. تسليم الامتحان (هنا يُستدعى Gemini/Groq)
    const submitRes = http.post(
      `${BASE_URL}/api/sessions/${sessionId}/submit`,
      null,
      { headers }
    );
    const submitOk = check(submitRes, { '✅ exam submitted (AI)': (r) => r.status === 200 });
    if (!submitOk) {
      console.log(`❌ Submit exam failed: ${submitRes.status} - ${submitRes.body.slice(0, 200)}`);
      errorRate.add(1);
    } else {
      console.log(`✅ Exam submitted successfully (AI grading done)`);
    }

    // انتظر أطول لأن Gemini يحتاج وقت
    sleep(3);
  }

  // =============================================
  // باقي الطلبات (كما كانت)
  // =============================================

  // 1. جلب آخر امتحان
  const lastRes = http.get(`${BASE_URL}/api/sessions/last`, { headers });
  const lastOk = check(lastRes, { '✅ last exam': (r) => r.status === 200 });
  if (!lastOk) {
    console.log(`❌ last exam failed: ${lastRes.status} - ${lastRes.body.slice(0, 200)}`);
    errorRate.add(1);
  }
  sleep(1);

  // 2. جلب المواد
  const subjectsRes = http.get(`${BASE_URL}/api/subjects`, { headers });
  const subjectsOk = check(subjectsRes, { '✅ subjects': (r) => r.status === 200 });
  if (!subjectsOk) {
    console.log(`❌ subjects failed: ${subjectsRes.status} - ${subjectsRes.body.slice(0, 200)}`);
    errorRate.add(1);
  }
  sleep(1);

  // 3. جلب الأداء
  const perfRes = http.get(`${BASE_URL}/api/sessions/performance`, { headers });
  const perfOk = check(perfRes, { '✅ performance': (r) => r.status === 200 });
  if (!perfOk) {
    console.log(`❌ performance failed: ${perfRes.status} - ${perfRes.body.slice(0, 200)}`);
    errorRate.add(1);
  }
  sleep(2);

  // 4. جلب الملف الشخصي
  const profileRes = http.get(`${BASE_URL}/api/users/profile`, { headers });
  const profileOk = check(profileRes, { '✅ profile': (r) => r.status === 200 });
  if (!profileOk) {
    console.log(`❌ profile failed: ${profileRes.status} - ${profileRes.body.slice(0, 200)}`);
    errorRate.add(1);
  }
  sleep(1);
}