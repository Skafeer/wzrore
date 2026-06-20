import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../../hooks/useResponsive';
import { Colors } from '../../constants/colors';
import { createReport } from '../../services/exam.service';
import CustomAlert, { CustomAlertRef } from '../../components/CustomAlert';

export default function ReportScreen() {
  const { questionId } = useLocalSearchParams<{ questionId: string }>();
  const { rs, hp, wp, isTablet, contentWidth } = useResponsive();
  const paddingH = isTablet ? (wp(100) - contentWidth) / 2 : wp(5);
  const customAlertRef = useRef<CustomAlertRef>(null);

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!message.trim()) {
      customAlertRef.current?.show({
        title: 'تنبيه',
        message: 'اكتب وصف المشكلة',
        buttons: [{ text: 'حسناً', style: 'default' }],
      });
      return;
    }
    setLoading(true);
    try {
      await createReport(questionId!, message);
      customAlertRef.current?.show({
        title: 'تم',
        message: 'تم إرسال البلاغ بنجاح',
        buttons: [{ text: 'رائع', style: 'default', onPress: () => router.back() }],
      });
    } catch {
      customAlertRef.current?.show({
        title: 'خطأ',
        message: 'تعذر إرسال البلاغ',
        buttons: [{ text: 'حاول مرة أخرى', style: 'cancel' }],
      });
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
          <Ionicons name="arrow-forward" size={rs(24)} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { fontSize: rs(18) }]}>أبلاغ عن مشكلة</Text>
        <View style={{ width: rs(24) }} />
      </View>

      {/* Input Field with Icon */}
      <Text style={[styles.label, { fontSize: rs(14) }]}>وصف المشكلة</Text>
      <View style={[styles.inputContainer, { minHeight: hp(20), borderRadius: rs(12), marginBottom: rs(16), flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: rs(8), backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border }]}>
        <View style={[styles.iconWrapper, { width: rs(36), height: rs(36), borderRadius: rs(10), backgroundColor: Colors.primarySoft, justifyContent: 'center', alignItems: 'center', marginTop: rs(8) }]}>
          <Ionicons name="flag-outline" size={rs(18)} color={Colors.primary} />
        </View>
        <TextInput
          style={[styles.input, { fontSize: rs(15), padding: rs(14), flex: 1, textAlignVertical: 'top', textAlign: 'right', color: Colors.text.primary, fontFamily: 'Tajawal_500Medium' }]}
          placeholder="اكتب وصفاً للمشكلة..."
          placeholderTextColor={Colors.text.disabled}
          multiline
          value={message}
          onChangeText={setMessage}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitBtn, { height: hp(6.5), borderRadius: rs(12), backgroundColor: Colors.secondary, justifyContent: 'center', alignItems: 'center' }]}
        onPress={onSubmit}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color={Colors.primary} />
          : <Text style={[styles.submitBtnText, { fontSize: rs(16), color: Colors.primary, fontFamily: 'Tajawal_700Bold' }]}>إرسال البلاغ</Text>
        }
      </TouchableOpacity>

      <CustomAlert ref={customAlertRef} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: Colors.text.primary, fontFamily: 'Tajawal_800ExtraBold' },
  label: { color: Colors.text.secondary, fontFamily: 'Tajawal_700Bold', marginBottom: 8 },
  inputContainer: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border },
  iconWrapper: { backgroundColor: Colors.primarySoft, justifyContent: 'center', alignItems: 'center' },
  input: { fontFamily: 'Tajawal_500Medium' },
  submitBtn: { backgroundColor: Colors.secondary, justifyContent: 'center', alignItems: 'center' },
  submitBtnText: { color: Colors.primary, fontFamily: 'Tajawal_700Bold' },
});