import { useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/auth.store';
import api from '../services/api';

export function useStoredAuth() {
  const { setAuth, logout } = useAuthStore();

  useEffect(() => {
    async function loadAuth() {
      try {
        let token: string | null = null;
        let userStr: string | null = null;

        if (Platform.OS === 'web') {
          token = localStorage.getItem('token');
          userStr = localStorage.getItem('user');
        } else {
          token = await AsyncStorage.getItem('token');
          userStr = await AsyncStorage.getItem('user');
        }

        if (token && userStr) {
          const user = JSON.parse(userStr);
          setAuth(token, user);

          // جلب البيانات المحدثة من السيرفر
          try {
            const res = await api.get('/users/profile', {
              headers: { Authorization: `Bearer ${token}` },
            });
            const updatedUser = res.data.data;

            if (Platform.OS === 'web') {
              localStorage.setItem('user', JSON.stringify(updatedUser));
            } else {
              await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            }

            setAuth(token, updatedUser);
          } catch {
            // إذا فشل الجلب استخدم البيانات المحفوظة
          }
        }
      } catch {
        if (Platform.OS === 'web') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } else {
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
        }
      }
    }
    loadAuth();
  }, []);
}