import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, Alert, Platform, Switch,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth.store';
import { useAuth } from '../../hooks/useAuth';
import { useResponsive } from '../../hooks/useResponsive';
import { Colors } from '../../constants/colors';
import { MotionView, PressableScale } from '../../components/motion';
import { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform as RNPlatform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveFcmToken } from '../../services/notification.service';
import api from '../../services/api';

const NOTIF_KEY = 'notifications_enabled';

export default function AccountScreen() {
  const { rs, hp, pagePadding } = useResponsive();
  const user = useAuthStore((s) => s.user);
  const { handleLogout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => { checkNotificationStatus(); }, []);

  async function checkNotificationStatus() {
    if (RNPlatform.OS === 'web') return;
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') { setNotificationsEnabled(false); return; }
      const saved = await AsyncStorage.getItem(NOTIF_KEY);
      setNotificationsEnabled(saved === 'true');
    } catch { setNotificationsEnabled(false); }
  }

  async function toggleNotifications(value: boolean) {
    if (RNPlatform.OS === 'web') return;
    setNotifLoading(true);
    try {
      if (value) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('تنبيه', 'يرجى السماح بالإشعارات من إعدادات الجهاز');
          return;
        }
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: '3315321a-f55a-4318-a8c1-bd658a5f66ad',
        });
        await saveFcmToken(tokenData.data);
        await AsyncStorage.setItem(NOTIF_KEY, 'true');
        setNotificationsEnabled(true);
      } else {
        await api.post('/notifications/fcm-token', { token: null });
        await AsyncStorage.setItem(NOTIF_KEY, 'false');
        setNotificationsEnabled(false);
      }
    } catch {
      Alert.alert('خطأ', 'تعذر تغيير إعدادات الإشعارات');
    } finally { setNotifLoading(false); }
  }

  function onLogout() {
    if (Platform.OS === 'web') {
      if (window.confirm('هل أنت متأكد من تسجيل الخروج؟')) handleLogout();
    } else {
      Alert.alert('تسجيل الخروج', 'هل أنت متأكد؟', [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'خروج', style: 'destructive', onPress: handleLogout },
      ]);
    }
  }

  const menuItems = [
    { icon: 'person-outline', label: 'تعديل الملف الشخصي', route: '/profile/edit' },
    { icon: 'lock-closed-outline', label: 'تغيير كلمة المرور', route: '/profile/password' },
    { icon: 'card-outline', label: 'الاشتراكات', route: '/profile/subscription' },
    { icon: 'shield-checkmark-outline', label: 'سياسة الخصوصية', route: '/profile/privacy' },
    { icon: 'help-circle-outline', label: 'التواصل مع الدعم', route: '/profile/support' },
  ];

  const planLabel = (plan: string) =>
    plan === 'WEEKLY' ? 'أسبوعي' : plan === 'MONTHLY' ? 'شهري' : 'سنوي';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingHorizontal: pagePadding, paddingBottom: hp(4) }}
    >
      <MotionView delay={0} style={[styles.header, { paddingTop: hp(6), paddingBottom: hp(2) }]}>
        <Text style={[styles.title, { fontSize: rs(22) }]}>الحساب</Text>
      </MotionView>

      <MotionView delay={80} style={[styles.profileCard, { padding: rs(20), marginBottom: rs(16), borderRadius: rs(20) }]}>
        <View style={styles.profileRow}>
          {user?.avatar ? (
            <Image
              source={{ uri: user.avatar }}
              style={[styles.avatar, { width: rs(64), height: rs(64), borderRadius: rs(32) }]}
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { width: rs(64), height: rs(64), borderRadius: rs(32) }]}>
              <Text style={[styles.avatarText, { fontSize: rs(26) }]}>
                {user?.name?.charAt(0) ?? '؟'}
              </Text>
            </View>
          )}
          <View style={{ flex: 1, marginRight: rs(16) }}>
            <Text style={[styles.userName, { fontSize: rs(18) }]}>{user?.name}</Text>
            <Text style={[styles.userPhone, { fontSize: rs(13) }]}>{user?.phone}</Text>
            <Text style={[styles.userProvince, { fontSize: rs(12) }]}>{user?.province}</Text>
          </View>
        </View>

        <View style={[
          styles.subBadge,
          {
            marginTop: rs(14),
            paddingVertical: rs(10),
            paddingHorizontal: rs(14),
            borderRadius: rs(12),
            backgroundColor: user?.subscription?.status === 'ACTIVE' ? '#DCFCE7' : Colors.background,
            borderWidth: 1,
            borderColor: user?.subscription?.status === 'ACTIVE' ? '#BBF7D0' : Colors.border,
          }
        ]}>
          <Ionicons
            name={user?.subscription?.status === 'ACTIVE' ? 'checkmark-circle' : 'time-outline'}
            size={rs(16)}
            color={user?.subscription?.status === 'ACTIVE' ? Colors.success : Colors.text.secondary}
          />
          <Text style={[styles.subText, {
            fontSize: rs(13),
            color: user?.subscription?.status === 'ACTIVE' ? Colors.success : Colors.text.secondary,
          }]}>
            {user?.subscription?.status === 'ACTIVE'
              ? `مشترك — ${planLabel(user.subscription!.plan)}`
              : 'الحساب المجاني'}
          </Text>
          {user?.subscription?.status === 'ACTIVE' && (
            <Text style={[styles.subExpiry, { fontSize: rs(11) }]}>
              ينتهي {new Date(user.subscription!.endDate).toLocaleDateString('ar-IQ')}
            </Text>
          )}
        </View>
      </MotionView>

      {RNPlatform.OS !== 'web' && (
        <MotionView delay={120} style={[styles.section, { borderRadius: rs(20), marginBottom: rs(12) }]}>
          <View style={[styles.row, { paddingVertical: rs(14), paddingHorizontal: rs(16) }]}>
            <View style={[styles.iconBox, { width: rs(36), height: rs(36), borderRadius: rs(10) }]}>
              <Ionicons
                name={notificationsEnabled ? 'notifications' : 'notifications-outline'}
                size={rs(18)}
                color={Colors.primary}
              />
            </View>
            <View style={{ flex: 1, marginRight: rs(16) }}>
              <Text style={[styles.rowLabel, { fontSize: rs(15) }]}>الإشعارات</Text>
              <Text style={[styles.rowSub, { fontSize: rs(11), marginTop: rs(1) }]}>
                {notificationsEnabled ? 'مفعّلة' : 'معطّلة'}
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              disabled={notifLoading}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
        </MotionView>
      )}

      <MotionView delay={150} style={[styles.section, { borderRadius: rs(20), marginBottom: rs(16) }]}>
        {menuItems.map((item, index) => (
          <PressableScale
            key={item.route}
            style={[
              styles.row,
              { paddingVertical: rs(14), paddingHorizontal: rs(16) },
              index < menuItems.length - 1 && styles.rowBorder,
            ]}
            onPress={() => router.push(item.route as never)}
          >
            <View style={[styles.iconBox, { width: rs(36), height: rs(36), borderRadius: rs(10) }]}>
              <Ionicons name={item.icon as never} size={rs(18)} color={Colors.primary} />
            </View>
            <Text style={[styles.rowLabel, { fontSize: rs(15), flex: 1, marginRight: rs(16) }]}>
              {item.label}
            </Text>
            <Ionicons name="chevron-back" size={rs(16)} color={Colors.text.disabled} />
          </PressableScale>
        ))}
      </MotionView>

      <MotionView delay={200}>
        <TouchableOpacity
          style={[styles.logoutBtn, { paddingVertical: rs(14), borderRadius: rs(16) }]}
          onPress={onLogout}
        >
          <Ionicons name="log-out-outline" size={rs(18)} color={Colors.primary} />
          <Text style={[styles.logoutText, { fontSize: rs(15) }]}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </MotionView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {},
  title: { color: Colors.text.primary, fontWeight: 'bold', fontFamily: 'Tajawal_800ExtraBold' },

  profileCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { resizeMode: 'cover' },
  avatarPlaceholder: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: Colors.white, fontWeight: 'bold', fontFamily: 'Tajawal_700Bold' },
  userName: { color: Colors.text.primary, fontWeight: '700', fontFamily: 'Tajawal_800ExtraBold' },
  userPhone: { color: Colors.text.secondary, marginTop: 2, fontFamily: 'Tajawal_500Medium' },
  userProvince: { color: Colors.text.disabled, marginTop: 2, fontFamily: 'Tajawal_500Medium' },
  subBadge: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  subText: { fontWeight: '600', flex: 1, fontFamily: 'Tajawal_700Bold' },
  subExpiry: { color: Colors.text.disabled, fontFamily: 'Tajawal_500Medium' },

  section: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  iconBox: {
    backgroundColor: Colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabel: { color: Colors.text.primary, fontWeight: '500', fontFamily: 'Tajawal_500Medium' },
  rowSub: { color: Colors.text.disabled, fontFamily: 'Tajawal_500Medium' },

  logoutBtn: {
    backgroundColor: Colors.secondary,
    borderWidth: 1,
    borderColor: Colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  logoutText: { color: Colors.primary, fontWeight: '600', fontFamily: 'Tajawal_700Bold' },
});