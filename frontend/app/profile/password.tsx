import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../../hooks/useResponsive';
import { Colors } from '../../constants/colors';
import { changePassword } from '../../services/user.service';
import CustomAlert, { CustomAlertRef } from '../../components/CustomAlert';

export default function PasswordScreen() {
  const { rs, hp, wp, isTablet, contentWidth } = useResponsive();
  const customAlertRef = useRef<CustomAlertRef>(null);
  const paddingH = isTablet ? (wp(100) - contentWidth) / 2 : wp(5);

  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSave() {
    if (!current || !newPass || !confirm) {
      customAlertRef.current?.show({
        title: 'تنبيه',
        message: 'جميع الحقول مطلوبة',
        buttons: [{ text: 'حسناً', style: 'default' }],
      });
      return;
    }
    if (newPass !== confirm) {
      customAlertRef.current?.show({
        title: 'تنبيه',
        message: 'كلمة المرور الجديدة غير متطابقة',
        buttons: [{ text: 'حسناً', style: 'default' }],
      });
      return;
    }
    if (newPass.length < 6) {
      customAlertRef.current?.show({
        title: 'تنبيه',
        message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        buttons: [{ text: 'حسناً', style: 'default' }],
      });
      return;
    }

    setLoading(true);
    try {
      await changePassword(current, newPass);
      customAlertRef.current?.show({
        title: 'تم',
        message: 'تم تغيير كلمة المرور بنجاح',
        buttons: [{ text: 'رائع', style: 'default', onPress: () => router.back() }],
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'حدث خطأ أثناء تغيير كلمة المرور.';
      customAlertRef.current?.show({
        title: 'خطأ',
        message: msg,
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
        <Text style={[styles.title, { fontSize: rs(18) }]}>تغيير كلمة المرور</Text>
        <View style={{ width: rs(24) }} />
      </View>

      {/* Current Password */}
      <Text style={[styles.label, { fontSize: rs(13) }]}>كلمة المرور الحالية</Text>
      <View style={[styles.inputContainer, { height: hp(6.5), borderRadius: rs(12), marginBottom: rs(16) }]}>
        <View style={[styles.iconWrapper, { width: rs(36), height: rs(36), borderRadius: rs(10), backgroundColor: Colors.primarySoft, justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="lock-closed-outline" size={rs(18)} color={Colors.primary} />
        </View>
        <TextInput
          style={[styles.input, { fontSize: rs(15), flex: 1, textAlign: 'right', paddingHorizontal: rs(12) }]}
          value={current}
          onChangeText={setCurrent}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor={Colors.text.disabled}
        />
      </View>

      {/* New Password */}
      <Text style={[styles.label, { fontSize: rs(13) }]}>كلمة المرور الجديدة</Text>
      <View style={[styles.inputContainer, { height: hp(6.5), borderRadius: rs(12), marginBottom: rs(16) }]}>
        <View style={[styles.iconWrapper, { width: rs(36), height: rs(36), borderRadius: rs(10), backgroundColor: Colors.primarySoft, justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="lock-closed-outline" size={rs(18)} color={Colors.primary} />
        </View>
        <TextInput
          style={[styles.input, { fontSize: rs(15), flex: 1, textAlign: 'right', paddingHorizontal: rs(12) }]}
          value={newPass}
          onChangeText={setNewPass}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor={Colors.text.disabled}
        />
      </View>

      {/* Confirm Password */}
      <Text style={[styles.label, { fontSize: rs(13) }]}>تأكيد كلمة المرور</Text>
      <View style={[styles.inputContainer, { height: hp(6.5), borderRadius: rs(12), marginBottom: rs(24) }]}>
        <View style={[styles.iconWrapper, { width: rs(36), height: rs(36), borderRadius: rs(10), backgroundColor: Colors.primarySoft, justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="lock-closed-outline" size={rs(18)} color={Colors.primary} />
        </View>
        <TextInput
          style={[styles.input, { fontSize: rs(15), flex: 1, textAlign: 'right', paddingHorizontal: rs(12) }]}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor={Colors.text.disabled}
        />
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveBtn, { height: hp(6.5), borderRadius: rs(12) }]}
        onPress={onSave}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color={Colors.primary} />
          : <Text style={[styles.saveBtnText, { fontSize: rs(16) }]}>حفظ</Text>
        }
      </TouchableOpacity>

      <CustomAlert ref={customAlertRef} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: Colors.text.primary, fontFamily: 'Tajawal_800ExtraBold', fontWeight: 'bold' },
  label: { color: Colors.text.secondary, fontFamily: 'Tajawal_700Bold', marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  input: {
    flex: 1,
    color: Colors.text.primary,
    fontFamily: 'Tajawal_500Medium',
  },
  iconWrapper: {
    backgroundColor: Colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtn: {
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.secondary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  saveBtnText: {
    color: Colors.primary,
    fontFamily: 'Tajawal_700Bold',
  },
});