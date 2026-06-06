import api from './api';
import { User } from '../types';

export async function login(
  phone: string,
  password: string
): Promise<{ token: string; user: User }> {
  const res = await api.post('/auth/login', { phone, password });
  return res.data.data;
}

export async function register(
  name: string,
  phone: string,
  province: string,
  password: string
): Promise<{ token: string; user: User }> {
  const res = await api.post('/auth/register', { name, phone, province, password });
  return res.data.data;
}