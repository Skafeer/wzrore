import { useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/auth.store';
import { login, register } from '../services/auth.service';

async function saveToStorage(key: string, value: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await AsyncStorage.setItem(key, value);
  }
}

async function removeFromStorage(key: string) {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    await AsyncStorage.removeItem(key);
  }
}

export function useAuth() {
  const { setAuth, logout: storeLogout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(phone: string, password: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await login(phone, password);
      await saveToStorage('token', data.token);
      await saveToStorage('user', JSON.stringify(data.user));
      setAuth(data.token, data.user);
      return true;
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'حدث خطأ، حاول مرة أخرى';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(
    name: string,
    phone: string,
    province: string,
    password: string
  ) {
    setLoading(true);
    setError(null);
    try {
      const data = await register(name, phone, province, password);
      await saveToStorage('token', data.token);
      await saveToStorage('user', JSON.stringify(data.user));
      setAuth(data.token, data.user);
      return true;
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'حدث خطأ، حاول مرة أخرى';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await removeFromStorage('token');
    await removeFromStorage('user');
    storeLogout();
  }

  return { handleLogin, handleRegister, handleLogout, loading, error };
}