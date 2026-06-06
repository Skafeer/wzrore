import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/auth.store';

export function useStoredAuth() {
  const { setAuth } = useAuthStore();

  useEffect(() => {
    async function loadAuth() {
      try {
        const token = await AsyncStorage.getItem('token');
        const userStr = await AsyncStorage.getItem('user');

        if (token && userStr) {
          const user = JSON.parse(userStr);
          setAuth(token, user);
        }
      } catch {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
      }
    }
    loadAuth();
  }, []);
}