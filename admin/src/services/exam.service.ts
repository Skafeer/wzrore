import api from '../utils/api';
import type { Exam, Question } from '../types';

export async function getExams(params?: { subjectId?: string; type?: string }): Promise<Exam[]> {
  const res = await api.get('/exams/admin/all', { params });
  return res.data.data;
}

export async function createExam(data: {
  title: string;
  subjectId: string;
  type: string;
  chapterId?: string;
  topicId?: string;
  year?: number;
  round?: number;
  duration: number;
}): Promise<Exam> {
  const res = await api.post('/exams/admin', data);
  return res.data.data;
}

export async function updateExam(id: string, data: Partial<Exam>): Promise<Exam> {
  const res = await api.put(`/exams/admin/${id}`, data);
  return res.data.data;
}

export async function deleteExam(id: string): Promise<void> {
  await api.delete(`/exams/admin/${id}`);
}

export async function getQuestions(examId: string): Promise<Question[]> {
  const res = await api.get(`/exams/admin/${examId}/questions`);
  return res.data.data;
}

export async function createQuestion(examId: string, data: {
  text: string;
  modelAnswer: string;
  modelImages?: string[];
  degree: number;
  aiNotes?: string;
  order?: number;
}): Promise<Question> {
  const res = await api.post(`/exams/admin/${examId}/questions`, data);
  return res.data.data;
}

export async function updateQuestion(id: string, data: Partial<Question>): Promise<Question> {
  const res = await api.put(`/exams/admin/questions/${id}`, data);
  return res.data.data;
}

export async function deleteQuestion(id: string): Promise<void> {
  await api.delete(`/exams/admin/questions/${id}`);
}