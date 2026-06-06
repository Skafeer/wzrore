import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, Linking,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../../hooks/useResponsive';
import { Colors } from '../../constants/colors';

export default function SupportScreen() {
  const { rs, hp, wp, isTablet, contentWidth } = useResponsive();
  const paddingH = isTablet ? (wp(100) - contentWidth) / 2 : wp(5);

  function openWhatsApp() {
    Linking.openURL('https://wa.me/9647800000000');
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingHorizontal: paddingH, paddingBottom: hp(4) }}
    >
      <View style={[styles.header, { paddingTop: hp(6), paddingBottom: hp(2) }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={rs(24)} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { fontSize: rs(18) }]}>الدعم الفني</Text>
        <View style={{ width: rs(24) }} />
      </View>

      <View style={[styles.card, { padding: rs(20), borderRadius: rs(16), marginBottom: rs(16) }]}>
        <Text style={[styles.cardTitle, { fontSize: rs(16), marginBottom: rs(8) }]}>
          تواصل معنا
        </Text>
        <Text style={[styles.cardBody, { fontSize: rs(14), marginBottom: rs(16) }]}>
          فريق الدعم متاح للمساعدة في أي مشكلة تواجهها
        </Text>

        <TouchableOpacity
          style={[styles.whatsappBtn, { paddingVertical: rs(14), borderRadius: rs(12) }]}
          onPress={openWhatsApp}
        >
          <Ionicons name="logo-whatsapp" size={rs(22)} color={Colors.white} />
          <Text style={[styles.whatsappText, { fontSize: rs(15) }]}>تواصل عبر واتساب</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { padding: rs(20), borderRadius: rs(16) }]}>
        <Text style={[styles.cardTitle, { fontSize: rs(16), marginBottom: rs(16) }]}>
          أسئلة شائعة
        </Text>

        {[
          { q: 'كيف أفعّل الاشتراك؟', a: 'تواصل معنا عبر واتساب وبعد الدفع ستحصل على كود تفعيل.' },
          { q: 'كم عدد الامتحانات المجانية؟', a: '5 امتحانات شهرياً مع آخر سنتين وزاريتين فقط.' },
          { q: 'هل يمكنني استرداد المبلغ؟', a: 'لا يوجد استرداد بعد تفعيل الكود.' },
        ].map((item, i) => (
          <View key={i} style={[styles.faqItem, { paddingVertical: rs(12), borderTopWidth: i > 0 ? 1 : 0, borderTopColor: Colors.border }]}>
            <Text style={[styles.faqQ, { fontSize: rs(14) }]}>{item.q}</Text>
            <Text style={[styles.faqA, { fontSize: rs(13) }]}>{item.a}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: Colors.text.primary, fontWeight: 'bold' },
  card: { backgroundColor: Colors.white, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6 },
  cardTitle: { color: Colors.text.primary, fontWeight: 'bold' },
  cardBody: { color: Colors.text.secondary },
  whatsappBtn: { backgroundColor: '#25D366', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  whatsappText: { color: Colors.white, fontWeight: '600' },
  faqItem: {},
  faqQ: { color: Colors.text.primary, fontWeight: '600', marginBottom: 4, textAlign: 'right' },
  faqA: { color: Colors.text.secondary, textAlign: 'right', lineHeight: 20 },
});