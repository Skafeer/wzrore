import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../../hooks/useResponsive';
import { Colors } from '../../constants/colors';
import { createReport } from '../../services/exam.service';

export default function ReportScreen() {
  const { questionId } = useLocalSearchParams<{ questionId: string }>();
  const { rs, hp, wp, isTablet, contentWidth } = useResponsive();
  const paddingH = isTablet ? (wp(100) - contentWidth) / 2 : wp(5);

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!message.trim()) {
      Alert.alert('تنبيه', 'اكتب وصف المشكلة');
      return;
    }
    setLoading(true);
    try {
      await createReport(questionId!, message);
      Alert.alert('تم', 'تم إرسال البلاغ بنجاح');
      router.back();
    } catch {
      Alert.alert('خطأ', 'تعذر إرسال البلاغ');
    } finally {
      setLoading(false);
    }
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
        <Text style={[styles.title, { fontSize: rs(18) }]}>أبلاغ عن مشكلة</Text>
        <View style={{ width: rs(24) }} />
      </View>

      <Text style={[styles.label, { fontSize: rs(14) }]}>وصف المشكلة</Text>
      <TextInput
        style={[styles.input, { fontSize: rs(15), minHeight: hp(20), padding: rs(14), borderRadius: rs(12) }]}
        placeholder="اكتب وصفاً للمشكلة..."
        placeholderTextColor={Colors.text.disabled}
        multiline
        textAlignVertical="top"
        textAlign="right"
        value={message}
        onChangeText={setMessage}
      />

      <TouchableOpacity
        style={[styles.submitBtn, { height: hp(6.5), borderRadius: rs(12), marginTop: rs(20) }]}
        onPress={onSubmit}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color={Colors.white} />
          : <Text style={[styles.submitBtnText, { fontSize: rs(16) }]}>إرسال البلاغ</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: Colors.text.primary, fontWeight: 'bold' },
  label: { color: Colors.text.secondary, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: Colors.white, borderWidth: 1.5,
    borderColor: Colors.border, color: Colors.text.primary,
  },
  submitBtn: { backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  submitBtnText: { color: Colors.white, fontWeight: 'bold' },
});