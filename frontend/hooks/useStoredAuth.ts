import { useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/auth.store';

export function useStoredAuth() {
  const { setAuth } = useAuthStore();

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