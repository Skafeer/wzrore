import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../../hooks/useResponsive';
import { Colors } from '../../constants/colors';
import { changePassword } from '../../services/user.service';

export default function PasswordScreen() {
  const { rs, hp, wp, isTablet, contentWidth } = useResponsive();
  const paddingH = isTablet ? (wp(100) - contentWidth) / 2 : wp(5);

  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSave() {
    if (!current || !newPass || !confirm) {
      Alert.alert('تنبيه', 'جميع الحقول مطلوبة');
      return;
    }
    if (newPass !== confirm) {
      Alert.alert('تنبيه', 'كلمة المرور الجديدة غير متطابقة');
      return;
    }
    if (newPass.length < 6) {
      Alert.alert('تنبيه', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);
    try {
      await changePassword(current, newPass);
      Alert.alert('تم', 'تم تغيير كلمة المرور بنجاح');
      router.back();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'حدث خطأ';
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
      <View style={[styles.header, { paddingTop: hp(6), paddingBottom: hp(2) }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={rs(24)} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { fontSize: rs(18) }]}>تغيير كلمة المرور</Text>
        <View style={{ width: rs(24) }} />
      </View>

      <Text style={[styles.label, { fontSize: rs(14) }]}>كلمة المرور الحالية</Text>
      <TextInput
        style={[styles.input, { fontSize: rs(15), height: hp(6.5), marginBottom: rs(16) }]}
        value={current}
        onChangeText={setCurrent}
        secureTextEntry
        textAlign="right"
        placeholderTextColor={Colors.text.disabled}
        placeholder="••••••••"
      />

      <Text style={[styles.label, { fontSize: rs(14) }]}>كلمة المرور الجديدة</Text>
      <TextInput
        style={[styles.input, { fontSize: rs(15), height: hp(6.5), marginBottom: rs(16) }]}
        value={newPass}
        onChangeText={setNewPass}
        secureTextEntry
        textAlign="right"
        placeholderTextColor={Colors.text.disabled}
        placeholder="••••••••"
      />

      <Text style={[styles.label, { fontSize: rs(14) }]}>تأكيد كلمة المرور</Text>
      <TextInput
        style={[styles.input, { fontSize: rs(15), height: hp(6.5), marginBottom: rs(24) }]}
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        textAlign="right"
        placeholderTextColor={Colors.text.disabled}
        placeholder="••••••••"
      />

      <TouchableOpacity
        style={[styles.saveBtn, { height: hp(6.5), borderRadius: rs(12) }]}
        onPress={onSave}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color={Colors.white} />
          : <Text style={[styles.saveBtnText, { fontSize: rs(16) }]}>حفظ</Text>
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
    borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 16, color: Colors.text.primary,
  },
  saveBtn: { backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { color: Colors.white, fontWeight: 'bold' },
});