import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Platform,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../../store/auth.store';
import { useAuth } from '../../hooks/useAuth';
import { useResponsive } from '../../hooks/useResponsive';
import { Colors } from '../../constants/colors';
import { MotionView, PressableScale } from '../../components/motion';
import { saveFcmToken, deleteFcmToken } from '../../services/notification.service';

export default function AccountScreen() {
  const { rs, hp, pagePadding } = useResponsive();
  const { user, updateUser } = useAuthStore();
  const { handleLogout } = useAuth();

  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(
    !!user?.fcmToken
  );
  const [isToggling, setIsToggling] = useState(false);

  // Update toggle state if user data changes
  useEffect(() => {
    setNotificationsEnabled(!!user?.fcmToken);
  }, [user?.fcmToken]);

  async function handleNotificationToggle(value: boolean) {
    if (isToggling) return;
    setIsToggling(true);

    try {
      if (value) {
        // 🔔 تفعيل الإشعارات
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('⚠️', 'يجب منح صلاحية الإشعارات لتلقي التنبيهات');
          setNotificationsEnabled(false);
          return;
        }

        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: '3315321a-f55a-4318-a8c1-bd658a5f66ad',
        });
        const token = tokenData.data;

        if (!token) {
          Alert.alert('خطأ', 'تعذر الحصول على توكن الإشعارات');
          setNotificationsEnabled(false);
          return;
        }

        await saveFcmToken(token);

        if (user) {
          updateUser({ ...user, fcmToken: token });
        }

        setNotificationsEnabled(true);

        if (Platform.OS !== 'web') {
          Alert.alert('✅', 'تم تفعيل الإشعارات بنجاح');
        }
      } else {
        // 🔕 إيقاف الإشعارات
        await deleteFcmToken();

        if (user) {
          updateUser({ ...user, fcmToken: null });
        }

        setNotificationsEnabled(false);

        if (Platform.OS !== 'web') {
          Alert.alert('🔕', 'تم إيقاف الإشعارات');
        }
      }
    } catch (error) {
      console.error('Notification toggle error:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تغيير حالة الإشعارات');
      setNotificationsEnabled(!!user?.fcmToken);
    } finally {
      setIsToggling(false);
    }
  }

  function onLogout() {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('هل أنت متأكد من تسجيل الخروج؟');
      if (confirmed) {
        handleLogout();
      }
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
    { icon: 'notifications-outline', label: 'الإشعارات', route: null, toggle: true },
    { icon: 'shield-checkmark-outline', label: 'سياسة الخصوصية', route: '/profile/privacy' },
    { icon: 'help-circle-outline', label: 'التواصل مع الدعم', route: '/profile/support' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingHorizontal: pagePadding, paddingBottom: hp(4) }}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: hp(6), paddingBottom: hp(2) }]}>
        <Text style={[styles.title, { fontSize: rs(22) }]}>الحساب</Text>
      </View>

      {/* Profile Card */}
      <MotionView delay={80} style={[styles.profileCard, { padding: rs(20), marginBottom: rs(20), borderRadius: rs(16) }]}>
        <View style={styles.profileRow}>
          {user?.avatar
            ? <Image source={{ uri: user.avatar }} style={[styles.avatar, { width: rs(64), height: rs(64), borderRadius: rs(32) }]} />
            : (
              <View style={[styles.avatarPlaceholder, { width: rs(64), height: rs(64), borderRadius: rs(32) }]}>
                <Text style={[styles.avatarText, { fontSize: rs(26) }]}>
                  {user?.name?.charAt(0) ?? '؟'}
                </Text>
              </View>
            )
          }
          <View style={{ marginRight: rs(14), flex: 1 }}>
            <Text style={[styles.userName, { fontSize: rs(18) }]}>{user?.name}</Text>
            <Text style={[styles.userUsername, { fontSize: rs(13) }]}>{user?.phone}</Text>
            <Text style={[styles.userEmail, { fontSize: rs(12) }]}>{user?.province}</Text>
          </View>
        </View>

        {/* Subscription Badge */}
        <View style={[styles.subBadge, {
          marginTop: rs(14), paddingVertical: rs(8),
          paddingHorizontal: rs(14), borderRadius: rs(8),
          backgroundColor: user?.subscription?.status === 'ACTIVE' ? '#DCFCE7' : Colors.background,
        }]}>
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
              ? `مشترك — ${user.subscription!.plan === 'WEEKLY' ? 'أسبوعي' : user.subscription!.plan === 'MONTHLY' ? 'شهري' : 'سنوي'}`
              : 'الحساب المجاني'}
          </Text>
        </View>
      </MotionView>

      {/* Menu */}
      <MotionView delay={150} style={[styles.menuCard, { borderRadius: rs(16), marginBottom: rs(20) }]}>
        {menuItems.map((item, index) => (
          <PressableScale
            key={item.label}
            style={[
              styles.menuItem,
              { paddingVertical: rs(14), paddingHorizontal: rs(16) },
              index < menuItems.length - 1 && styles.menuItemBorder,
            ]}
            onPress={() => {
              if (item.route) {
                router.push(item.route as never);
              }
            }}
            disabled={item.toggle || false}
          >
            <Ionicons name={item.icon as never} size={rs(20)} color={Colors.text.secondary} />
            <Text style={[styles.menuLabel, { fontSize: rs(15), marginRight: rs(12) }]}>
              {item.label}
            </Text>

            {item.toggle ? (
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                disabled={isToggling}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.white}
                style={styles.switch}
              />
            ) : (
              <Ionicons name="chevron-back" size={rs(18)} color={Colors.text.disabled} style={{ marginRight: 'auto' }} />
            )}
          </PressableScale>
        ))}
      </MotionView>

      {/* Logout */}
      <TouchableOpacity
        style={[styles.logoutBtn, { paddingVertical: rs(14), borderRadius: rs(12) }]}
        onPress={onLogout}
      >
        <Ionicons name="log-out-outline" size={rs(20)} color={Colors.error} />
        <Text style={[styles.logoutText, { fontSize: rs(15) }]}>تسجيل الخروج</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {},
  title: { color: Colors.text.primary, fontWeight: 'bold' },
  profileCard: { backgroundColor: Colors.white, elevation: 2, shadowColor: Colors.shadow, shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { resizeMode: 'cover' },
  avatarPlaceholder: { backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: Colors.white, fontWeight: 'bold' },
  userName: { color: Colors.text.primary, fontWeight: 'bold' },
  userUsername: { color: Colors.text.secondary, marginTop: 2 },
  userEmail: { color: Colors.text.disabled, marginTop: 2 },
  subBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  subText: { fontWeight: '600' },
  menuCard: { backgroundColor: Colors.white, elevation: 2, shadowColor: Colors.shadow, shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center' },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuLabel: { color: Colors.text.primary, flex: 1 },
  switch: {
    transform: [{ scale: 0.9 }],
  },
  logoutBtn: { backgroundColor: '#FEF2F2', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  logoutText: { color: Colors.error, fontWeight: '600' },
});