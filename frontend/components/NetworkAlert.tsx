import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useResponsive } from '../hooks/useResponsive';

export function NetworkAlert() {
  const { rs } = useResponsive();
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [message, setMessage] = useState('');
  const translateY = useRef(new Animated.Value(-100)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showBannerAnimated(msg: string) {
    setMessage(msg);
    setShowBanner(true);
    Animated.spring(translateY, {
      toValue: 0,
      damping: 18,
      stiffness: 200,
      useNativeDriver: true,
    }).start();
  }

  function hideBannerAnimated() {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowBanner(false));
  }

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Web
      function handleOnline() {
        setIsOnline(true);
        showBannerAnimated('عادت الاتصال بالإنترنت ✓');
        if (hideTimer.current) clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(hideBannerAnimated, 2500);
      }

      function handleOffline() {
        setIsOnline(false);
        if (hideTimer.current) clearTimeout(hideTimer.current);
        showBannerAnimated('لا يوجد اتصال بالإنترنت');
      }

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    } else {
      // Mobile — نستخدم fetch للتحقق
      let interval: ReturnType<typeof setInterval>;

      async function checkConnection() {
        try {
          await fetch('https://wzrore-production.up.railway.app/health', {
            method: 'HEAD',
          });
          if (!isOnline) {
            setIsOnline(true);
            showBannerAnimated('عادت الاتصال بالإنترنت ✓');
            if (hideTimer.current) clearTimeout(hideTimer.current);
            hideTimer.current = setTimeout(hideBannerAnimated, 2500);
          }
        } catch {
          if (isOnline) {
            setIsOnline(false);
            if (hideTimer.current) clearTimeout(hideTimer.current);
            showBannerAnimated('لا يوجد اتصال بالإنترنت');
          }
        }
      }

      interval = setInterval(checkConnection, 5000);
      return () => clearInterval(interval);
    }
  }, [isOnline]);

  if (!showBanner) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        { transform: [{ translateY }], paddingVertical: rs(10), paddingHorizontal: rs(16) },
        isOnline ? styles.bannerOnline : styles.bannerOffline,
      ]}
    >
      <Ionicons
        name={isOnline ? 'wifi' : 'wifi-outline'}
        size={rs(18)}
        color={Colors.white}
      />
      <Text style={[styles.text, { fontSize: rs(13) }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 9999,
  },
  bannerOffline: { backgroundColor: '#DC2626' },
  bannerOnline: { backgroundColor: '#16A34A' },
  text: {
    color: Colors.white,
    fontWeight: '600',
  },
});