import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Animated, Linking,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../../hooks/useResponsive';
import { Colors } from '../../constants/colors';
import { redeemCode, getMySubscription } from '../../services/user.service';
import { useAuthStore } from '../../store/auth.store';
import { MotionView, PressableScale } from '../../components/motion';
import CustomAlert, { CustomAlertRef } from '../../components/CustomAlert';

function SubscriptionSkeleton({ rs, hp, paddingH }: { rs: (size: number) => number; hp: (size: number) => number; paddingH: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ paddingHorizontal: paddingH, paddingBottom: hp(4) }}
    >
      <Animated.View style={[styles.header, { paddingTop: hp(6), paddingBottom: hp(2), opacity }]}>
        <View style={{ width: rs(24), height: rs(24), backgroundColor: Colors.border, borderRadius: rs(4) }} />
        <View style={{ width: rs(100), height: rs(20), backgroundColor: Colors.border, borderRadius: rs(4) }} />
        <View style={{ width: rs(24), height: rs(24), backgroundColor: Colors.border, borderRadius: rs(4) }} />
      </Animated.View>

      <Animated.View style={[styles.activeCard, { padding: rs(16), borderRadius: rs(14), marginBottom: rs(20), opacity }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: rs(24), height: rs(24), backgroundColor: Colors.border, borderRadius: rs(12) }} />
          <View style={{ marginRight: rs(12), flex: 1 }}>
            <View style={{ width: '60%', height: rs(16), backgroundColor: Colors.border, borderRadius: rs(4), marginBottom: rs(4) }} />
            <View style={{ width: '80%', height: rs(12), backgroundColor: Colors.border, borderRadius: rs(4) }} />
          </View>
        </View>
      </Animated.View>

      <Animated.View style={{ opacity }}>
        <View style={{ width: '40%', height: rs(16), backgroundColor: Colors.border, borderRadius: rs(4), marginBottom: rs(12) }} />
        <View style={[styles.planCard, { padding: rs(16), borderRadius: rs(14), marginBottom: rs(12) }]}>
          <View style={styles.planRow}>
            <View style={{ width: rs(44), height: rs(44), backgroundColor: Colors.border, borderRadius: rs(12) }} />
            <View style={{ flex: 1, marginHorizontal: rs(12) }}>
              <View style={{ width: '50%', height: rs(16), backgroundColor: Colors.border, borderRadius: rs(4) }} />
              <View style={{ width: '30%', height: rs(12), backgroundColor: Colors.border, borderRadius: rs(4), marginTop: rs(4) }} />
            </View>
            <View style={{ width: rs(60), height: rs(16), backgroundColor: Colors.border, borderRadius: rs(4) }} />
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.howCard, { padding: rs(16), borderRadius: rs(14), marginBottom: rs(24), marginTop: rs(8), opacity }]}>
        <View style={{ width: '50%', height: rs(14), backgroundColor: Colors.border, borderRadius: rs(4), marginBottom: rs(8) }} />
        {[1, 2, 3].map((_, index) => (
          <View key={index} style={{ width: '80%', height: rs(12), backgroundColor: Colors.border, borderRadius: rs(4), marginBottom: rs(4) }} />
        ))}
        <View style={{ width: '100%', height: rs(40), backgroundColor: Colors.border, borderRadius: rs(10), marginTop: rs(12) }} />
      </Animated.View>
    </ScrollView>
  );
}

export default function SubscriptionScreen() {
  const { rs, hp, wp, isTablet, contentWidth } = useResponsive();
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [loadingPage, setLoadingPage] = useState(true);
  const customAlertRef = useRef<CustomAlertRef>(null);

  const paddingH = isTablet ? (wp(100) - contentWidth) / 2 : wp(5);

  const [code, setCode] = useState('');

  useEffect(() => {
    setTimeout(() => setLoadingPage(false), 500);
  }, []);

  const isActive = user?.subscription?.status === 'ACTIVE' &&
    new Date(user.subscription.endDate) > new Date();

  async function onRedeem() {
    if (!code.trim()) {
      customAlertRef.current?.show({
        title: 'تنبيه',
        message: 'أدخل الكود',
        buttons: [{ text: 'حسناً', style: 'default' }],
      });
      return;
    }
    setLoading(true);
    try {
      await redeemCode(code.trim());
      const data = await getMySubscription();
      updateUser({ subscription: data.subscription });
      customAlertRef.current?.show({
        title: 'تم التفعيل',
        message: 'تم تفعيل اشتراك صواب بلس بنجاح! 🎉',
        buttons: [{ text: 'رائع', style: 'default', onPress: () => setCode('') }],
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'كود غير صحيح';
      customAlertRef.current?.show({
        title: 'خطأ',
        message: msg,
        buttons: [{ text: 'حاول مرة أخرى', style: 'cancel' }],
      });
    } finally {
      setLoading(false);
    }
  }

  async function onWhatsAppPress() {
    const phone = '9647833730038'; // الرقم بصيغة دولية
    const name = user?.name || 'الاسم';
    const phoneNumber = user?.phone || 'رقم الهاتف';
    const province = user?.province || 'المحافظة';
    const plan = 'صواب بلس';

    const message = `مرحباً، أريد الاشتراك في باقة صواب بلس.\nالاسم: ${name}\nرقم الهاتف: ${phoneNumber}\nالمحافظة: ${province}\nالباقة: ${plan}`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    try {
      await Linking.openURL(url);
    } catch {
      customAlertRef.current?.show({
        title: 'خطأ',
        message: 'تعذر فتح واتساب، تأكد من تثبيت التطبيق',
        buttons: [{ text: 'حسناً', style: 'default' }],
      });
    }
  }

  if (loadingPage) {
    return <SubscriptionSkeleton rs={rs} hp={hp} paddingH={paddingH} />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingHorizontal: paddingH, paddingBottom: hp(4) }}
    >
      <MotionView delay={0} style={[styles.header, { paddingTop: hp(6), paddingBottom: hp(2) }]}>
        <PressableScale onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={rs(24)} color={Colors.text.primary} />
        </PressableScale>
        <Text style={[styles.title, { fontSize: rs(18) }]}>الاشتراكات</Text>
        <View style={{ width: rs(24) }} />
      </MotionView>

      {isActive && (
        <MotionView delay={80} style={[styles.activeCard, { padding: rs(16), borderRadius: rs(14), marginBottom: rs(20) }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="checkmark-circle" size={rs(24)} color={Colors.success} />
            <View style={{ marginRight: rs(12), flex: 1 }}>
              <Text style={[styles.activeTitle, { fontSize: rs(15) }]}>اشتراك نشط</Text>
              <Text style={[styles.activePlan, { fontSize: rs(13) }]}>
                {user?.subscription?.plan === 'YEARLY' ? 'صواب بلس' : user?.subscription?.plan === 'MONTHLY' ? 'شهري' : 'أسبوعي'}
                {' • '}ينتهي {new Date(user!.subscription!.endDate).toLocaleDateString('ar-IQ')}
              </Text>
            </View>
          </View>
        </MotionView>
      )}

      <MotionView delay={120}>
        <Text style={[styles.sectionTitle, { fontSize: rs(16), marginBottom: rs(12) }]}>الباقة المتاحة</Text>
        <MotionView delay={140}>
          <PressableScale
            style={[
              styles.planCard,
              { padding: rs(16), borderRadius: rs(14), marginBottom: rs(12), borderWidth: 2, borderColor: Colors.secondary },
            ]}
          >
            <View style={styles.planRow}>
              <View style={[styles.planIconBox, { width: rs(44), height: rs(44), borderRadius: rs(12), backgroundColor: Colors.primarySoft, justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="star" size={rs(22)} color={Colors.secondary} />
              </View>
              <View style={{ flex: 1, marginHorizontal: rs(12) }}>
                <Text style={[styles.planLabel, { fontSize: rs(16) }]}>صواب بلس</Text>
                <Text style={[styles.planDuration, { fontSize: rs(13) }]}>سنة كاملة</Text>
              </View>
              <Text style={[styles.planPrice, { fontSize: rs(16) }]}>10,000 د.ع</Text>
            </View>
          </PressableScale>
        </MotionView>
      </MotionView>

      <MotionView delay={200} style={[styles.howCard, { padding: rs(16), borderRadius: rs(14), marginBottom: rs(24), marginTop: rs(8) }]}>
        <Text style={[styles.howTitle, { fontSize: rs(14), marginBottom: rs(8) }]}>كيف تشترك؟</Text>
        <View style={styles.howStepRow}>
          <Ionicons name="call" size={rs(16)} color={Colors.primary} />
          <Text style={[styles.howStep, { fontSize: rs(13), marginRight: rs(8) }]}>تواصل معنا عبر واتساب</Text>
        </View>
        <View style={styles.howStepRow}>
          <Ionicons name="cash-outline" size={rs(16)} color={Colors.primary} />
          <Text style={[styles.howStep, { fontSize: rs(13), marginRight: rs(8) }]}>ادفع قيمة الباقة (10,000 د.ع)</Text>
        </View>
        <View style={styles.howStepRow}>
          <Ionicons name="key-outline" size={rs(16)} color={Colors.primary} />
          <Text style={[styles.howStep, { fontSize: rs(13), marginRight: rs(8) }]}>احصل على كود الاشتراك</Text>
        </View>
        <View style={styles.howStepRow}>
          <Ionicons name="checkmark-done-outline" size={rs(16)} color={Colors.primary} />
          <Text style={[styles.howStep, { fontSize: rs(13), marginRight: rs(8) }]}>أدخل الكود أدناه وقم بتفعيله</Text>
        </View>

        <PressableScale
          style={[styles.whatsappBtn, { paddingVertical: rs(12), borderRadius: rs(10), marginTop: rs(12), backgroundColor: Colors.secondary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }]}
          onPress={onWhatsAppPress}
        >
          <Ionicons name="logo-whatsapp" size={rs(20)} color={Colors.primary} />
          <Text style={[styles.whatsappText, { fontSize: rs(14), color: Colors.primary }]}>تواصل عبر واتساب</Text>
        </PressableScale>
      </MotionView>

      <MotionView delay={240}>
        <Text style={[styles.sectionTitle, { fontSize: rs(16), marginBottom: rs(12) }]}>تفعيل كود الاشتراك</Text>
        <View style={[styles.codeRow, { marginBottom: rs(8), flexDirection: 'row', gap: 8 }]}>
          <TextInput
            style={[styles.codeInput, { fontSize: rs(15), height: hp(6.5), flex: 1, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, color: Colors.text.primary, textAlign: 'right' }]}
            placeholder="SAWAB-XXXX-XXXX-XXXX"
            placeholderTextColor={Colors.text.disabled}
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
          />
        </View>

        <PressableScale
          style={[styles.redeemBtn, { height: hp(6.5), borderRadius: rs(12), backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' }]}
          onPress={onRedeem}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={[styles.redeemBtnText, { fontSize: rs(16), color: Colors.white }]}>تفعيل الكود</Text>
          }
        </PressableScale>
      </MotionView>

      <CustomAlert ref={customAlertRef} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: Colors.text.primary, fontFamily: 'Tajawal_800ExtraBold' },
  activeCard: { backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#BBF7D0' },
  activeTitle: { color: Colors.success, fontFamily: 'Tajawal_700Bold' },
  activePlan: { color: Colors.success, marginTop: 2, fontFamily: 'Tajawal_500Medium' },
  sectionTitle: { color: Colors.text.primary, fontFamily: 'Tajawal_700Bold' },
  planCard: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, elevation: 2, shadowColor: Colors.shadow, shadowOpacity: 0.02, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } },
  planIconBox: { justifyContent: 'center', alignItems: 'center' },
  planRow: { flexDirection: 'row', alignItems: 'center' },
  planLabel: { color: Colors.text.primary, fontFamily: 'Tajawal_700Bold' },
  planDuration: { color: Colors.text.secondary, marginTop: 2, fontFamily: 'Tajawal_500Medium' },
  planPrice: { color: Colors.primary, fontFamily: 'Tajawal_800ExtraBold' },
  howCard: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, elevation: 2, shadowColor: Colors.shadow, shadowOpacity: 0.02, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } },
  howTitle: { color: Colors.text.primary, fontFamily: 'Tajawal_700Bold' },
  howStepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  howStep: { color: Colors.text.secondary, fontFamily: 'Tajawal_500Medium' },
  whatsappBtn: {  },
  whatsappText: { fontFamily: 'Tajawal_700Bold' },
  codeRow: {  },
  codeInput: {  },
  redeemBtn: {  },
  redeemBtnText: { fontFamily: 'Tajawal_700Bold' },
});