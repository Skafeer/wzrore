import { Platform } from 'react-native';
import api from './api';

export async function saveFcmToken(token: string): Promise<void> {
  try {
    await api.post('/notifications/fcm-token', { token });
  } catch {
  }
}