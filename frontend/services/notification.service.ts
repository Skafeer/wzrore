import { Platform } from 'react-native';
import api from './api';

export async function saveFcmToken(token: string): Promise<void> {
  try {
    await api.post('/notifications/fcm-token', { token });
  } catch {
    // تجاهل الخطأ
  }
}

export async function deleteFcmToken(): Promise<void> {
  try {
    await api.delete('/notifications/fcm-token');
  } catch {
    // تجاهل الخطأ
  }
}