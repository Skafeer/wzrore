import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveFcmToken } from '../services/notification.service';
import { useAuthStore } from '../store/auth.store';

const NOTIF_KEY = 'notifications_enabled';

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
        // تحقق إذا سبق وفعّل أو عطّل يدوياً
        const saved = await AsyncStorage.getItem(NOTIF_KEY);

        // إذا ما اختار بعد — فعّل تلقائياً
        if (saved === null) {
          const { status } = await Notifications.requestPermissionsAsync();
          if (status !== 'granted') return;

          const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: '3315321a-f55a-4318-a8c1-bd658a5f66ad',
          });

          await saveFcmToken(tokenData.data);
          await AsyncStorage.setItem(NOTIF_KEY, 'true');
        } else if (saved === 'true') {
          // مفعّل سابقاً — جدّد الـ token
          const { status } = await Notifications.getPermissionsAsync();
          if (status !== 'granted') return;

          const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: '3315321a-f55a-4318-a8c1-bd658a5f66ad',
          });
          await saveFcmToken(tokenData.data);
        }
      } catch (err) {
        console.log('Notifications setup error:', err);
      }
    }

    setupNotifications();
  }, [user]);
}