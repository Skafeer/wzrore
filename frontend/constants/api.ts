const isLocal = typeof window !== 'undefined' && 
  window.location.hostname === 'localhost';

export const API_URL = isLocal
  ? 'http://localhost:3000/api'
  : 'https://wzrore-production.up.railway.app/api';

export const ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',

  // Subjects
  SUBJECTS: '/subjects',
  CHAPTERS: (subjectId: string) => `/subjects/${subjectId}/chapters`,
  TOPICS: (chapterId: string) => `/subjects/chapters/${chapterId}/topics`,

  // Exams
  EXAMS: '/exams',
  YEARS: (subjectId: string) => `/exams/${subjectId}/years`,
  ROUNDS: (subjectId: string) => `/exams/${subjectId}/rounds`,

  // Sessions
  START_EXAM: '/sessions/start',
  SAVE_ANSWER: (sessionId: string) => `/sessions/${sessionId}/answer`,
  SUBMIT_EXAM: (sessionId: string) => `/sessions/${sessionId}/submit`,
  GET_RESULT: (sessionId: string) => `/sessions/${sessionId}/result`,
  LAST_EXAM: '/sessions/last',
  PERFORMANCE: '/sessions/performance',

  // User
  PROFILE: '/users/profile',
  UPDATE_PROFILE: '/users/profile',
  CHANGE_PASSWORD: '/users/password',
  REPORT: '/users/reports',

  // Subscription
  REDEEM_CODE: '/subscriptions/redeem',
  MY_SUBSCRIPTION: '/subscriptions/my',
};