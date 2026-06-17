import { useEffect } from 'react';
import { Platform } from 'react-native';
import { saveFcmToken } from '../services/notification.service';
import { useAuthStore } from '../store/auth.store';

export function useNotifications() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user || Platform.OS === 'web') return;

    async function setupNotifications() {
      try {
        const { default: messaging } = await import('@react-native-firebase/messaging');

        // طلب إذن الإشعارات
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) return;

        // جلب الـ FCM Token
        const token = await messaging().getToken();
        if (token) await saveFcmToken(token);

        // تحديث الـ Token لو تغيّر
        messaging().onTokenRefresh(async (newToken) => {
          await saveFcmToken(newToken);
        });

        // استقبال الإشعارات في الخلفية
        messaging().setBackgroundMessageHandler(async () => {});

      } catch {
        // Firebase ما يشتغل على الويب
      }
    }

    setupNotifications();
  }, [user]);
}