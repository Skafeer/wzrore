import { Platform } from 'react-native';
import api from './api';
import { Subject, Chapter, Topic, Exam, ExamSession, ExamResult, LastExam, PerformanceSummary } from '../types';

export async function getSubjects(): Promise<Subject[]> {
  const res = await api.get('/subjects');
  return res.data.data;
}

export async function getChapters(subjectId: string): Promise<Chapter[]> {
  const res = await api.get(`/subjects/${subjectId}/chapters`);
  return res.data.data;
}

export async function getTopics(chapterId: string): Promise<Topic[]> {
  const res = await api.get(`/subjects/chapters/${chapterId}/topics`);
  return res.data.data;
}

export async function getAvailableYears(subjectId: string): Promise<number[]> {
  const res = await api.get(`/exams/${subjectId}/years`);
  return res.data.data;
}

export async function getAvailableRounds(subjectId: string, year: number): Promise<number[]> {
  const res = await api.get(`/exams/${subjectId}/rounds`, { params: { year } });
  return res.data.data;
}

export async function getExams(params: {
  subjectId: string;
  type: 'WIZARI' | 'CHAPTER';
  chapterId?: string;
  topicId?: string;
  year?: number;
  round?: number;
}): Promise<Exam[]> {
  const res = await api.get('/exams', { params });
  return res.data.data;
}

export async function startExam(examId: string): Promise<ExamSession> {
  const res = await api.post('/sessions/start', { examId });
  return res.data.data;
}

export async function saveAnswer(
  sessionId: string,
  questionId: string,
  answerText: string,
  images?: { uri: string; name: string; type: string }[]
): Promise<void> {
  const formData = new FormData();
  formData.append('questionId', questionId);
  formData.append('answerText', answerText);

  if (images && images.length > 0) {
    for (const img of images) {
      if (Platform.OS === 'web') {
        try {
          const response = await fetch(img.uri);
          const blob = await response.blob();
          const file = new File([blob], img.name, { type: img.type });
          formData.append('images', file);
        } catch {
          // تجاهل الصورة إذا فشل التحويل
        }
      } else {
        formData.append('images', {
          uri: img.uri,
          name: img.name,
          type: img.type,
        } as unknown as Blob);
      }
    }
  }

  await api.post(`/sessions/${sessionId}/answer`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function submitExam(sessionId: string): Promise<{
  totalScore: number;
  maxScore: number;
  streak: {
    current: number;
    best: number;
    isNewBest: boolean;
    alreadyCompletedToday: boolean;
  };
}> {
  const res = await api.post(`/sessions/${sessionId}/submit`);
  return res.data.data;
}

export async function getResult(sessionId: string): Promise<ExamResult> {
  const res = await api.get(`/sessions/${sessionId}/result`);
  return res.data.data;
}

export async function getLastExam(): Promise<LastExam | null> {
  const res = await api.get('/sessions/last');
  return res.data.data;
}

export async function getPerformance(): Promise<PerformanceSummary> {
  const res = await api.get('/sessions/performance');
  return res.data.data;
}

export async function createReport(questionId: string, message: string, category: string = 'OTHER'): Promise<void> {
  await api.post('/reports', { questionId, message, category });
}