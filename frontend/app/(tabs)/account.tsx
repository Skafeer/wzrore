import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth.store';
import { useAuth } from '../../hooks/useAuth';
import { useResponsive } from '../../hooks/useResponsive';
import { Colors } from '../../constants/colors';

export default function AccountScreen() {
  const { rs, hp, wp, isTablet, contentWidth } = useResponsive();
  const user = useAuthStore((s) => s.user);
  const { handleLogout } = useAuth();
  const paddingH = isTablet ? (wp(100) - contentWidth) / 2 : wp(5);

  function onLogout() {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'خروج', style: 'destructive', onPress: handleLogout },
    ]);
  }

  const menuItems = [
    { icon: 'person-outline', label: 'تعديل الملف الشخصي', route: '/profile/edit' },
    { icon: 'lock-closed-outline', label: 'تغيير كلمة المرور', route: '/profile/password' },
    { icon: 'card-outline', label: 'الاشتراكات', route: '/profile/subscription' },
    { icon: 'shield-checkmark-outline', label: 'سياسة الخصوصية', route: '/profile/privacy' },
    { icon: 'help-circle-outline', label: 'التواصل مع الدعم', route: '/profile/support' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingHorizontal: paddingH, paddingBottom: hp(4) }}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: hp(6), paddingBottom: hp(2) }]}>
        <Text style={[styles.title, { fontSize: rs(22) }]}>الحساب</Text>
      </View>

      {/* Profile Card */}
      <View style={[styles.profileCard, { padding: rs(20), marginBottom: rs(20), borderRadius: rs(16) }]}>
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
            <Text style={[styles.userUsername, { fontSize: rs(13) }]}>@{user?.username}</Text>
            <Text style={[styles.userEmail, { fontSize: rs(12) }]}>{user?.email}</Text>
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
      </View>

      {/* Menu */}
      <View style={[styles.menuCard, { borderRadius: rs(16), marginBottom: rs(20) }]}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={item.route}
            style={[
              styles.menuItem,
              { paddingVertical: rs(14), paddingHorizontal: rs(16) },
              index < menuItems.length - 1 && styles.menuItemBorder,
            ]}
            onPress={() => router.push(item.route as never)}
          >
            <Ionicons name={item.icon as never} size={rs(20)} color={Colors.text.secondary} />
            <Text style={[styles.menuLabel, { fontSize: rs(15), marginRight: rs(12) }]}>{item.label}</Text>
            <Ionicons name="chevron-back" size={rs(18)} color={Colors.text.disabled} style={{ marginRight: 'auto' }} />
          </TouchableOpacity>
        ))}
      </View>

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
  profileCard: { backgroundColor: Colors.white, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6 },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { resizeMode: 'cover' },
  avatarPlaceholder: { backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: Colors.white, fontWeight: 'bold' },
  userName: { color: Colors.text.primary, fontWeight: 'bold' },
  userUsername: { color: Colors.text.secondary, marginTop: 2 },
  userEmail: { color: Colors.text.disabled, marginTop: 2 },
  subBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  subText: { fontWeight: '600' },
  menuCard: { backgroundColor: Colors.white, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6 },
  menuItem: { flexDirection: 'row', alignItems: 'center' },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuLabel: { color: Colors.text.primary, flex: 1 },
  logoutBtn: { backgroundColor: '#FEF2F2', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  logoutText: { color: Colors.error, fontWeight: '600' },
});