import api from '../utils/api';
import type { Admin } from '../types';

export async function adminLogin(
  email: string,
  password: string
): Promise<{ token: string; admin: Admin }> {
  const res = await api.post('/auth/admin/login', { email, password });
  return res.data.data;
}