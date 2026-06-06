import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../../hooks/useResponsive';
import { Colors } from '../../constants/colors';
import { redeemCode, getMySubscription } from '../../services/user.service';
import { useAuthStore } from '../../store/auth.store';

const PLANS = [
  { key: 'WEEKLY', label: 'أسبوعي', duration: '7 أيام', price: '2,000 د.ع', icon: '⚡' },
  { key: 'MONTHLY', label: 'شهري', duration: '30 يوم', price: '5,000 د.ع', icon: '🌙' },
  { key: 'YEARLY', label: 'سنوي', duration: 'سنة كاملة', price: '10,000 د.ع', icon: '⭐', popular: true },
];

export default function SubscriptionScreen() {
  const { rs, hp, wp, isTablet, contentWidth } = useResponsive();
  const { user, updateUser } = useAuthStore();
  const paddingH = isTablet ? (wp(100) - contentWidth) / 2 : wp(5);

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const isActive = user?.subscription?.status === 'ACTIVE' &&
    new Date(user.subscription.endDate) > new Date();

  async function onRedeem() {
    if (!code.trim()) {
      Alert.alert('تنبيه', 'أدخل الكود');
      return;
    }
    setLoading(true);
    try {
      await redeemCode(code.trim());
      const data = await getMySubscription();
      updateUser({ subscription: data.subscription });
      Alert.alert('🎉 تم', 'تم تفعيل اشتراكك بنجاح!');
      setCode('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'كود غير صحيح';
      Alert.alert('خطأ', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingHorizontal: paddingH, paddingBottom: hp(4) }}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: hp(6), paddingBottom: hp(2) }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={rs(24)} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { fontSize: rs(18) }]}>الاشتراكات</Text>
        <View style={{ width: rs(24) }} />
      </View>

      {/* Current Subscription */}
      {isActive && (
        <View style={[styles.activeCard, { padding: rs(16), borderRadius: rs(14), marginBottom: rs(20) }]}>
          <Ionicons name="checkmark-circle" size={rs(24)} color={Colors.success} />
          <View style={{ marginRight: rs(12), flex: 1 }}>
            <Text style={[styles.activeTitle, { fontSize: rs(15) }]}>اشتراك نشط ✅</Text>
            <Text style={[styles.activePlan, { fontSize: rs(13) }]}>
              {user?.subscription?.plan === 'WEEKLY' ? 'أسبوعي'
                : user?.subscription?.plan === 'MONTHLY' ? 'شهري' : 'سنوي'}
              {' • '}ينتهي {new Date(user!.subscription!.endDate).toLocaleDateString('ar-IQ')}
            </Text>
          </View>
        </View>
      )}

      {/* Plans */}
      <Text style={[styles.sectionTitle, { fontSize: rs(16), marginBottom: rs(12) }]}>الباقات</Text>
      {PLANS.map(plan => (
        <View key={plan.key} style={[
          styles.planCard,
          { padding: rs(16), borderRadius: rs(14), marginBottom: rs(12) },
          plan.popular && styles.planCardPopular,
        ]}>
          {plan.popular && (
            <View style={[styles.popularBadge, { paddingHorizontal: rs(10), paddingVertical: rs(4), borderRadius: rs(20), marginBottom: rs(8) }]}>
              <Text style={[styles.popularText, { fontSize: rs(12) }]}>⭐ الأكثر طلباً</Text>
            </View>
          )}
          <View style={styles.planRow}>
            <Text style={[styles.planIcon, { fontSize: rs(28) }]}>{plan.icon}</Text>
            <View style={{ flex: 1, marginHorizontal: rs(12) }}>
              <Text style={[styles.planLabel, { fontSize: rs(16) }]}>{plan.label}</Text>
              <Text style={[styles.planDuration, { fontSize: rs(13) }]}>{plan.duration}</Text>
            </View>
            <Text style={[styles.planPrice, { fontSize: rs(16) }]}>{plan.price}</Text>
          </View>
        </View>
      ))}

      {/* How to Subscribe */}
      <View style={[styles.howCard, { padding: rs(16), borderRadius: rs(14), marginBottom: rs(24), marginTop: rs(8) }]}>
        <Text style={[styles.howTitle, { fontSize: rs(14), marginBottom: rs(8) }]}>كيف تشترك؟</Text>
        <Text style={[styles.howStep, { fontSize: rs(13) }]}>1️⃣ تواصل معنا عبر واتساب</Text>
        <Text style={[styles.howStep, { fontSize: rs(13) }]}>2️⃣ ادفع قيمة الباقة</Text>
        <Text style={[styles.howStep, { fontSize: rs(13) }]}>3️⃣ احصل على كود الاشتراك</Text>
        <Text style={[styles.howStep, { fontSize: rs(13) }]}>4️⃣ أدخل الكود أدناه</Text>

        <TouchableOpacity
          style={[styles.whatsappBtn, { paddingVertical: rs(12), borderRadius: rs(10), marginTop: rs(12) }]}
          onPress={() => Alert.alert('واتساب', 'سيتم التواصل معك قريباً')}
        >
          <Ionicons name="logo-whatsapp" size={rs(20)} color={Colors.white} />
          <Text style={[styles.whatsappText, { fontSize: rs(14) }]}>تواصل عبر واتساب</Text>
        </TouchableOpacity>
      </View>

      {/* Redeem Code */}
      <Text style={[styles.sectionTitle, { fontSize: rs(16), marginBottom: rs(12) }]}>تفعيل كود الاشتراك</Text>
      <View style={[styles.codeRow, { marginBottom: rs(8) }]}>
        <TextInput
          style={[styles.codeInput, { fontSize: rs(15), height: hp(6.5), flex: 1 }]}
          placeholder="SAWAB-XXXX-XXXX-XXXX"
          placeholderTextColor={Colors.text.disabled}
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          textAlign="right"
        />
      </View>

      <TouchableOpacity
        style={[styles.redeemBtn, { height: hp(6.5), borderRadius: rs(12) }]}
        onPress={onRedeem}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color={Colors.white} />
          : <Text style={[styles.redeemBtnText, { fontSize: rs(16) }]}>تفعيل الكود</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: Colors.text.primary, fontWeight: 'bold' },
  activeCard: { backgroundColor: '#DCFCE7', flexDirection: 'row', alignItems: 'center' },
  activeTitle: { color: Colors.success, fontWeight: 'bold' },
  activePlan: { color: Colors.success, marginTop: 2 },
  sectionTitle: { color: Colors.text.primary, fontWeight: 'bold' },
  planCard: { backgroundColor: Colors.white, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6 },
  planCardPopular: { borderWidth: 2, borderColor: Colors.secondary },
  popularBadge: { backgroundColor: Colors.secondary, alignSelf: 'flex-start' },
  popularText: { color: Colors.text.primary, fontWeight: '600' },
  planRow: { flexDirection: 'row', alignItems: 'center' },
  planIcon: {},
  planLabel: { color: Colors.text.primary, fontWeight: 'bold' },
  planDuration: { color: Colors.text.secondary, marginTop: 2 },
  planPrice: { color: Colors.primary, fontWeight: 'bold' },
  howCard: { backgroundColor: Colors.white, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6 },
  howTitle: { color: Colors.text.primary, fontWeight: 'bold' },
  howStep: { color: Colors.text.secondary, marginBottom: 4 },
  whatsappBtn: { backgroundColor: '#25D366', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  whatsappText: { color: Colors.white, fontWeight: '600' },
  codeRow: { flexDirection: 'row', gap: 8 },
  codeInput: {
    backgroundColor: Colors.white, borderWidth: 1.5,
    borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 16, color: Colors.text.primary,
  },
  redeemBtn: { backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  redeemBtnText: { color: Colors.white, fontWeight: 'bold' },
});