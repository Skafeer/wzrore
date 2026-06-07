import api from '../utils/api';
import type { User } from '../types';

export async function getUsers(params?: {
  search?: string;
  hasSubscription?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: User[]; pagination: { total: number; pages: number; page: number } }> {
  const res = await api.get('/users/admin/users', { params });
  return res.data;
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/admin/users/${id}`);
}

export async function activateSubscription(userId: string, plan: string): Promise<void> {
  await api.post('/subscriptions/admin/activate', { userId, plan });
}

export async function getCodes(isUsed?: boolean) {
  const res = await api.get('/subscriptions/admin/codes', {
    params: isUsed !== undefined ? { isUsed } : {},
  });
  return res.data.data;
}

export async function createCodes(plan: string, count: number): Promise<string[]> {
  const res = await api.post('/subscriptions/admin/codes', { plan, count });
  return res.data.data;
}

export async function getReports(status?: string) {
  const res = await api.get('/users/admin/reports', {
    params: status ? { status } : {},
  });
  return res.data.data;
}

export async function updateReport(id: string, status: string) {
  const res = await api.put(`/users/admin/reports/${id}`, { status });
  return res.data.data;
}

export async function getStats(params?: { from?: string; to?: string }) {
  const res = await api.get('/users/admin/stats', { params });
  return res.data.data;
}

export async function getAdmins() {
  const res = await api.get('/users/admin/admins');
  return res.data.data;
}

export async function createAdmin(data: {
  name: string;
  username: string;
  email: string;
  password: string;
  permissions: Record<string, boolean>;
}) {
  const res = await api.post('/users/admin/admins', data);
  return res.data.data;
}

export async function updateAdmin(id: string, data: { name?: string; permissions?: Record<string, boolean> }) {
  const res = await api.put(`/users/admin/admins/${id}`, data);
  return res.data.data;
}

export async function deleteAdmin(id: string): Promise<void> {
  await api.delete(`/users/admin/admins/${id}`);
}

export async function getLaunchPeriod() {
  const res = await api.get('/subscriptions/admin/launch');
  return res.data.data;
}

export async function setLaunchPeriod(startDate: string, endDate: string) {
  const res = await api.post('/subscriptions/admin/launch', { startDate, endDate });
  return res.data.data;
}