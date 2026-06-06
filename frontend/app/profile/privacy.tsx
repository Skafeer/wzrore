import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../../hooks/useResponsive';
import { Colors } from '../../constants/colors';

export default function PrivacyScreen() {
  const { rs, hp, wp, isTablet, contentWidth } = useResponsive();
  const paddingH = isTablet ? (wp(100) - contentWidth) / 2 : wp(5);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingHorizontal: paddingH, paddingBottom: hp(4) }}
    >
      <View style={[styles.header, { paddingTop: hp(6), paddingBottom: hp(2) }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={rs(24)} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { fontSize: rs(18) }]}>سياسة الخصوصية</Text>
        <View style={{ width: rs(24) }} />
      </View>

      <View style={[styles.card, { padding: rs(20), borderRadius: rs(16) }]}>
        <Text style={[styles.sectionTitle, { fontSize: rs(16), marginBottom: rs(12) }]}>
          جمع البيانات
        </Text>
        <Text style={[styles.body, { fontSize: rs(14) }]}>
          نقوم بجمع البيانات الأساسية فقط اللازمة لتشغيل التطبيق مثل الاسم والبريد الإلكتروني وبيانات الامتحانات. لا نشارك بياناتك مع أي طرف ثالث.
        </Text>

        <Text style={[styles.sectionTitle, { fontSize: rs(16), marginBottom: rs(12), marginTop: rs(20) }]}>
          حماية البيانات
        </Text>
        <Text style={[styles.body, { fontSize: rs(14) }]}>
          جميع البيانات مشفرة بالكامل ومحمية. نستخدم أحدث تقنيات الأمان لحماية معلوماتك الشخصية.
        </Text>

        <Text style={[styles.sectionTitle, { fontSize: rs(16), marginBottom: rs(12), marginTop: rs(20) }]}>
          حذف البيانات
        </Text>
        <Text style={[styles.body, { fontSize: rs(14) }]}>
          يمكنك طلب حذف حسابك وجميع بياناتك في أي وقت عن طريق التواصل مع الدعم الفني.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: Colors.text.primary, fontWeight: 'bold' },
  card: { backgroundColor: Colors.white, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6 },
  sectionTitle: { color: Colors.text.primary, fontWeight: 'bold' },
  body: { color: Colors.text.secondary, lineHeight: 24, textAlign: 'right' },
});