import api from '../utils/api';
import type { Subject, Chapter, Topic } from '../types';

export async function getSubjects(): Promise<Subject[]> {
  const res = await api.get('/subjects/admin/all');
  return res.data.data;
}

export async function createSubject(name: string, order: number): Promise<Subject> {
  const res = await api.post('/subjects/admin', { name, order });
  return res.data.data;
}

export async function updateSubject(id: string, data: Partial<Subject>): Promise<Subject> {
  const res = await api.put(`/subjects/admin/${id}`, data);
  return res.data.data;
}

export async function deleteSubject(id: string): Promise<void> {
  await api.delete(`/subjects/admin/${id}`);
}

export async function getChapters(subjectId: string): Promise<Chapter[]> {
  const res = await api.get(`/subjects/admin/${subjectId}/chapters`);
  return res.data.data;
}

export async function createChapter(subjectId: string, name: string, order: number): Promise<Chapter> {
  const res = await api.post(`/subjects/admin/${subjectId}/chapters`, { name, order });
  return res.data.data;
}

export async function updateChapter(id: string, data: Partial<Chapter>): Promise<Chapter> {
  const res = await api.put(`/subjects/admin/chapters/${id}`, data);
  return res.data.data;
}

export async function deleteChapter(id: string): Promise<void> {
  await api.delete(`/subjects/admin/chapters/${id}`);
}

export async function getTopics(chapterId: string): Promise<Topic[]> {
  const res = await api.get(`/subjects/admin/chapters/${chapterId}/topics`);
  return res.data.data;
}

export async function createTopic(chapterId: string, name: string, order: number): Promise<Topic> {
  const res = await api.post(`/subjects/admin/chapters/${chapterId}/topics`, { name, order });
  return res.data.data;
}

export async function updateTopic(id: string, data: Partial<Topic>): Promise<Topic> {
  const res = await api.put(`/subjects/admin/topics/${id}`, data);
  return res.data.data;
}

export async function deleteTopic(id: string): Promise<void> {
  await api.delete(`/subjects/admin/topics/${id}`);
}