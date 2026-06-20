import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../../hooks/useResponsive';
import { Colors } from '../../constants/colors';
import { MotionView, PressableScale } from '../../components/motion';

export default function PrivacyScreen() {
  const { rs, hp, wp, isTablet, contentWidth } = useResponsive();
  const paddingH = isTablet ? (wp(100) - contentWidth) / 2 : wp(5);

  const sections = [
    {
      icon: 'shield-checkmark-outline',
      title: 'جمع البيانات',
      text: 'نقوم بجمع البيانات الأساسية فقط اللازمة لتشغيل التطبيق مثل الاسم والبريد الإلكتروني وبيانات الامتحانات. لا نشارك بياناتك مع أي طرف ثالث.',
    },
    {
      icon: 'lock-closed-outline',
      title: 'حماية البيانات',
      text: 'جميع البيانات مشفرة بالكامل ومحمية. نستخدم أحدث تقنيات الأمان لحماية معلوماتك الشخصية.',
    },
    {
      icon: 'trash-outline',
      title: 'حذف البيانات',
      text: 'يمكنك طلب حذف حسابك وجميع بياناتك في أي وقت عن طريق التواصل مع الدعم الفني.',
    },
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
        <Text style={[styles.title, { fontSize: rs(18) }]}>سياسة الخصوصية</Text>
        <View style={{ width: rs(24) }} />
      </MotionView>

      {/* Sections */}
      {sections.map((section, index) => (
        <MotionView key={index} delay={80 + index * 40} style={[styles.card, { padding: rs(20), borderRadius: rs(16), marginBottom: rs(16) }]}>
          <View style={[styles.cardHeader, { marginBottom: rs(10) }]}>
            <View style={[styles.iconBox, { width: rs(40), height: rs(40), borderRadius: rs(12) }]}>
              <Ionicons name={section.icon as any} size={rs(20)} color={Colors.primary} />
            </View>
            <Text style={[styles.sectionTitle, { fontSize: rs(16), flex: 1, marginRight: rs(12) }]}>
              {section.title}
            </Text>
          </View>
          <Text style={[styles.body, { fontSize: rs(14) }]}>
            {section.text}
          </Text>
        </MotionView>
      ))}
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
  sectionTitle: { color: Colors.text.primary, fontFamily: 'Tajawal_700Bold' },
  body: { color: Colors.text.secondary, fontFamily: 'Tajawal_500Medium', lineHeight: 24, textAlign: 'right' },
});