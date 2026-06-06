import api from './api';
import { User } from '../types';

export async function getProfile(): Promise<User> {
  const res = await api.get('/users/profile');
  return res.data.data;
}

export async function updateProfile(data: {
  name?: string;
  username?: string;
  avatar?: { uri: string; name: string; type: string };
}): Promise<User> {
  const formData = new FormData();
  if (data.name) formData.append('name', data.name);
  if (data.username) formData.append('username', data.username);
  if (data.avatar) {
    formData.append('avatar', {
      uri: data.avatar.uri,
      name: data.avatar.name,
      type: data.avatar.type,
    } as unknown as Blob);
  }

  const res = await api.put('/users/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await api.put('/users/password', { currentPassword, newPassword });
}

export async function redeemCode(code: string): Promise<void> {
  await api.post('/subscriptions/redeem', { code });
}

export async function getMySubscription() {
  const res = await api.get('/subscriptions/my');
  return res.data.data;
}