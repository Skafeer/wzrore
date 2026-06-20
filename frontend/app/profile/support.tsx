import { useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../../hooks/useResponsive';
import { Colors } from '../../constants/colors';
import { MotionView, PressableScale } from '../../components/motion';
import CustomAlert, { CustomAlertRef } from '../../components/CustomAlert';

export default function SupportScreen() {
  const { rs, hp, wp, isTablet, contentWidth } = useResponsive();
  const paddingH = isTablet ? (wp(100) - contentWidth) / 2 : wp(5);
  const customAlertRef = useRef<CustomAlertRef>(null);

  function openWhatsApp() {
    Linking.openURL('https://wa.me/9647800000000');
  }

  const faqs = [
    { icon: 'key-outline', q: 'كيف أفعّل الاشتراك؟', a: 'تواصل معنا عبر واتساب وبعد الدفع ستحصل على كود تفعيل.' },
    { icon: 'documents-outline', q: 'كم عدد الامتحانات المجانية؟', a: '5 امتحانات شهرياً مع آخر سنتين وزاريتين فقط.' },
    { icon: 'cash-outline', q: 'هل يمكنني استرداد المبلغ؟', a: 'لا يوجد استرداد بعد تفعيل الكود.' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingHorizontal: paddingH, paddingBottom: hp(4) }}
    >
      {/* Header */}
      <MotionView delay={0} style={[styles.header, { paddingTop: hp(6), paddingBottom: hp(2) }]}>
        <PressableScale onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={rs(24)} color={Colors.text.primary} />
        </PressableScale>
        <Text style={[styles.title, { fontSize: rs(18) }]}>الدعم الفني</Text>
        <View style={{ width: rs(24) }} />
      </MotionView>

      {/* Contact Card */}
      <MotionView delay={80} style={[styles.card, { padding: rs(24), borderRadius: rs(20), marginBottom: rs(16) }]}>
        <View style={[styles.cardHeader, { marginBottom: rs(12) }]}>
          <View style={[styles.iconBox, { width: rs(40), height: rs(40), borderRadius: rs(12) }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={rs(20)} color={Colors.primary} />
          </View>
          <Text style={[styles.cardTitle, { fontSize: rs(16), flex: 1, marginRight: rs(12) }]}>
            تواصل معنا
          </Text>
        </View>
        <Text style={[styles.cardBody, { fontSize: rs(14), marginBottom: rs(16) }]}>
          فريق الدعم متاح للمساعدة في أي مشكلة تواجهها
        </Text>

        <PressableScale
          style={[styles.whatsappBtn, { paddingVertical: rs(14), borderRadius: rs(12) }]}
          onPress={openWhatsApp}
        >
          <Ionicons name="logo-whatsapp" size={rs(22)} color={Colors.primary} />
          <Text style={[styles.whatsappText, { fontSize: rs(15) }]}>تواصل عبر واتساب</Text>
        </PressableScale>
      </MotionView>

      {/* FAQ Section */}
      <MotionView delay={160} style={[styles.card, { padding: rs(24), borderRadius: rs(20) }]}>
        <View style={[styles.cardHeader, { marginBottom: rs(12) }]}>
          <View style={[styles.iconBox, { width: rs(40), height: rs(40), borderRadius: rs(12) }]}>
            <Ionicons name="help-circle-outline" size={rs(20)} color={Colors.primary} />
          </View>
          <Text style={[styles.cardTitle, { fontSize: rs(16), flex: 1, marginRight: rs(12) }]}>
            أسئلة شائعة
          </Text>
        </View>

        {faqs.map((item, i) => (
          <View
            key={i}
            style={[
              styles.faqItem,
              { paddingVertical: rs(12), borderTopWidth: i > 0 ? 1 : 0, borderTopColor: Colors.border }
            ]}
          >
            <View style={[styles.faqHeader, { flexDirection: 'row', alignItems: 'center', marginBottom: rs(4) }]}>
              <Ionicons name={item.icon as any} size={rs(16)} color={Colors.primary} />
              <Text style={[styles.faqQ, { fontSize: rs(14), flex: 1, marginRight: rs(8) }]}>{item.q}</Text>
            </View>
            <Text style={[styles.faqA, { fontSize: rs(13) }]}>{item.a}</Text>
          </View>
        ))}
      </MotionView>

      <CustomAlert ref={customAlertRef} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: Colors.text.primary, fontFamily: 'Tajawal_800ExtraBold', fontWeight: 'bold' },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.02,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { backgroundColor: Colors.primarySoft, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { color: Colors.text.primary, fontFamily: 'Tajawal_700Bold' },
  cardBody: { color: Colors.text.secondary, fontFamily: 'Tajawal_500Medium', lineHeight: 24, textAlign: 'right' },
  whatsappBtn: { backgroundColor: Colors.secondary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  whatsappText: { color: Colors.primary, fontFamily: 'Tajawal_700Bold' },
  faqItem: {},
  faqHeader: { flexDirection: 'row', alignItems: 'center' },
  faqQ: { color: Colors.text.primary, fontFamily: 'Tajawal_700Bold', textAlign: 'right' },
  faqA: { color: Colors.text.secondary, fontFamily: 'Tajawal_500Medium', textAlign: 'right', lineHeight: 20 },
});