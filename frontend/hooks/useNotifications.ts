import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { saveFcmToken } from '../services/notification.service';
import { useAuthStore } from '../store/auth.store';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotifications() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user || Platform.OS === 'web') return;

    async function setupNotifications() {
      try {
        // طلب إذن الإشعارات
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') return;

        // جلب الـ Expo Push Token
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: '3315321a-f55a-4318-a8c1-bd658a5f66ad',
        });

        const token = tokenData.data;
        if (token) await saveFcmToken(token);

      } catch (err) {
        console.log('Notifications setup error:', err);
      }
    }

    setupNotifications();
  }, [user]);
}