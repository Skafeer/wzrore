import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Animated, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useResponsive } from '../hooks/useResponsive';

const CHECK_URL = 'https://wzrore-production.up.railway.app/health';
const CHECK_INTERVAL = 5000;

export function NetworkAlert() {
  const { rs } = useResponsive();
  const [isOffline, setIsOffline] = useState(false);
  const [checking, setChecking] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkConnection = useCallback(async () => {
    try {
      const res = await fetch(CHECK_URL, { method: 'HEAD' });
      if (res.ok) {
        setIsOffline(false);
      } else {
        setIsOffline(true);
      }
    } catch {
      setIsOffline(true);
    }
  }, []);

  // فحص عند البدء
  useEffect(() => {
    checkConnection();
  }, []);

  // فحص دوري
  useEffect(() => {
    intervalRef.current = setInterval(checkConnection, CHECK_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkConnection]);

  // Web events
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => checkConnection();

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [checkConnection]);

  // Animation
  useEffect(() => {
    if (isOffline) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 16,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0.8,
          damping: 16,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOffline]);

  async function handleRetry() {
    setChecking(true);
    await checkConnection();
    setChecking(false);
  }

  return (
    <Modal
      visible={isOffline}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View style={[
          styles.card,
          {
            padding: rs(28),
            borderRadius: rs(24),
            transform: [{ scale: scaleAnim }],
          },
        ]}>
          {/* أيقونة */}
          <View style={[styles.iconBox, { width: rs(72), height: rs(72), borderRadius: rs(36), marginBottom: rs(16) }]}>
            <Ionicons name="wifi-outline" size={rs(36)} color={Colors.error} />
          </View>

          {/* العنوان */}
          <Text style={[styles.title, { fontSize: rs(20), marginBottom: rs(8) }]}>
            لا يوجد اتصال
          </Text>

          {/* الرسالة */}
          <Text style={[styles.message, { fontSize: rs(14), marginBottom: rs(24) }]}>
            تحقق من اتصالك بالإنترنت وحاول مجدداً
          </Text>

          {/* زر إعادة المحاولة */}
          <TouchableOpacity
            style={[styles.retryBtn, { paddingVertical: rs(14), borderRadius: rs(14), width: '100%' }]}
            onPress={handleRetry}
            disabled={checking}
            activeOpacity={0.85}
          >
            {checking ? (
              <View style={styles.retryRow}>
                <Ionicons name="reload-outline" size={rs(18)} color={Colors.white} />
                <Text style={[styles.retryText, { fontSize: rs(15) }]}>جاري الفحص...</Text>
              </View>
            ) : (
              <View style={styles.retryRow}>
                <Ionicons name="refresh-outline" size={rs(18)} color={Colors.white} />
                <Text style={[styles.retryText, { fontSize: rs(15) }]}>إعادة المحاولة</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: Colors.white,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  iconBox: {
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  title: {
    color: Colors.text.primary,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  retryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryText: {
    color: Colors.white,
    fontWeight: '700',
  },
});