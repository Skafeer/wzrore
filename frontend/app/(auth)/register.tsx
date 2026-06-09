import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, ActivityIndicator, Modal, FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useResponsive } from '../../hooks/useResponsive';
import { Colors } from '../../constants/colors';
import { MotionView, PressableScale } from '../../components/motion';

const PROVINCES = [
  'بغداد', 'البصرة', 'نينوى', 'أربيل', 'النجف',
  'كربلاء', 'الأنبار', 'ديالى', 'صلاح الدين', 'بابل',
  'واسط', 'ميسان', 'ذي قار', 'المثنى', 'القادسية',
  'كركوك', 'السليمانية', 'دهوك',
];

const PASSWORD_RULES = [
  { id: 1, text: '8 أحرف على الأقل', test: (p: string) => p.length >= 8 },
  { id: 2, text: 'يحتوي على حروف إنجليزية', test: (p: string) => /[a-zA-Z]/.test(p) },
  { id: 3, text: 'يحتوي على أرقام', test: (p: string) => /[0-9]/.test(p) },
];

export default function RegisterScreen() {
  const { rs, hp, pagePadding, contentWidth } = useResponsive();
  const { handleRegister, loading, error } = useAuth();
  const formWidth = Math.min(contentWidth, 500);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showProvince, setShowProvince] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const phoneValid = /^07\d{9}$/.test(phone);
  const passwordsMatch = password === confirmPassword;

  async function onRegister() {
    if (!name || !phone || !province || !password || !confirmPassword) {
      return;
    }
    if (!phoneValid) return;
    if (!passwordsMatch) return;
    if (!agreed) return;
    await handleRegister(name, phone, province, password);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingHorizontal: pagePadding },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.logo, { fontSize: rs(42) }]}>صواب</Text>
          <Text style={[styles.tagline, { fontSize: rs(14) }]}>الوزاري يبدي من صواب</Text>
        </View>

        {/* Form */}
        <MotionView delay={80} style={[styles.form, { width: formWidth, padding: rs(24) }]}>
          <Text style={[styles.title, { fontSize: rs(24) }]}>إنشاء حساب</Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={[styles.errorText, { fontSize: rs(13) }]}>{error}</Text>
            </View>
          )}

          {/* Name */}
          <Text style={[styles.label, { fontSize: rs(13) }]}>اسم الطالب</Text>
          <TextInput
            style={[styles.input, { fontSize: rs(15), height: hp(6.5) }]}
            placeholder="الاسم الكامل"
            placeholderTextColor={Colors.text.disabled}
            value={name}
            onChangeText={setName}
            textAlign="right"
          />

          {/* Phone */}
          <Text style={[styles.label, { fontSize: rs(13) }]}>رقم الهاتف</Text>
          <TextInput
            style={[
              styles.input,
              { fontSize: rs(15), height: hp(6.5) },
              phone.length > 0 && !phoneValid && styles.inputError,
            ]}
            placeholder="07XXXXXXXXX"
            placeholderTextColor={Colors.text.disabled}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={11}
            textAlign="right"
          />
          {phone.length > 0 && !phoneValid && (
            <Text style={[styles.fieldError, { fontSize: rs(12) }]}>
              ⚠️ يجب أن يبدأ بـ 07 ويكون 11 رقم
            </Text>
          )}

          {/* Province */}
          <Text style={[styles.label, { fontSize: rs(13) }]}>المحافظة</Text>
          <TouchableOpacity
            style={[styles.input, styles.provinceBtn, { height: hp(6.5) }]}
            onPress={() => setShowProvince(true)}
          >
            <Text style={[
              styles.provinceBtnText,
              { fontSize: rs(15) },
              !province && { color: Colors.text.disabled },
            ]}>
              {province || 'اختر محافظتك'}
            </Text>
            <Ionicons name="chevron-down" size={rs(18)} color={Colors.text.secondary} />
          </TouchableOpacity>

          {/* Password */}
          <Text style={[styles.label, { fontSize: rs(13) }]}>كلمة المرور</Text>
          <TextInput
            style={[styles.input, { fontSize: rs(15), height: hp(6.5) }]}
            placeholder="••••••••"
            placeholderTextColor={Colors.text.disabled}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textAlign="right"
          />

          {/* Password Rules */}
          {password.length > 0 && (
            <View style={[styles.rulesBox, { marginBottom: rs(12), padding: rs(10), borderRadius: rs(8) }]}>
              {PASSWORD_RULES.map(rule => (
                <View key={rule.id} style={styles.ruleRow}>
                  <Ionicons
                    name={rule.test(password) ? 'checkmark-circle' : 'close-circle'}
                    size={rs(16)}
                    color={rule.test(password) ? Colors.success : Colors.error}
                  />
                  <Text style={[styles.ruleText, { fontSize: rs(12), color: rule.test(password) ? Colors.success : Colors.error }]}>
                    {rule.text}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Confirm Password */}
          <Text style={[styles.label, { fontSize: rs(13) }]}>تأكيد كلمة المرور</Text>
          <TextInput
            style={[
              styles.input,
              { fontSize: rs(15), height: hp(6.5) },
              confirmPassword.length > 0 && !passwordsMatch && styles.inputError,
            ]}
            placeholder="••••••••"
            placeholderTextColor={Colors.text.disabled}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            textAlign="right"
          />
          {confirmPassword.length > 0 && !passwordsMatch && (
            <Text style={[styles.fieldError, { fontSize: rs(12) }]}>
              ⚠️ كلمة المرور غير متطابقة
            </Text>
          )}

          {/* Terms */}
          <TouchableOpacity
            style={[styles.termsRow, { marginBottom: rs(16), marginTop: rs(4) }]}
            onPress={() => setAgreed(!agreed)}
          >
            <Ionicons
              name={agreed ? 'checkbox' : 'square-outline'}
              size={rs(22)}
              color={agreed ? Colors.primary : Colors.text.disabled}
            />
            <Text style={[styles.termsText, { fontSize: rs(13) }]}>
              أوافق على <Text style={styles.termsLink}>شروط الاستخدام وسياسة الخصوصية</Text>
            </Text>
          </TouchableOpacity>

          <PressableScale
            style={[
              styles.btn,
              { height: hp(6.5), borderRadius: rs(12) },
              (!agreed || !phoneValid || !passwordsMatch) && styles.btnDisabled,
            ]}
            onPress={onRegister}
            disabled={loading || !agreed || !phoneValid || !passwordsMatch}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={[styles.btnText, { fontSize: rs(16) }]}>إنشاء حساب</Text>
            }
          </PressableScale>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.link, { fontSize: rs(14) }]}>
              عندك حساب؟ <Text style={styles.linkBold}>سجّل دخول</Text>
            </Text>
          </TouchableOpacity>
        </MotionView>
      </ScrollView>

      {/* Province Modal */}
      <Modal visible={showProvince} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { borderRadius: rs(20), padding: rs(20) }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { fontSize: rs(18) }]}>اختر محافظتك</Text>
              <TouchableOpacity onPress={() => setShowProvince(false)}>
                <Ionicons name="close" size={rs(24)} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={PROVINCES}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.provinceItem,
                    { paddingVertical: rs(14), paddingHorizontal: rs(16) },
                    province === item && styles.provinceItemActive,
                  ]}
                  onPress={() => { setProvince(item); setShowProvince(false); }}
                >
                  <Text style={[
                    styles.provinceItemText,
                    { fontSize: rs(16) },
                    province === item && styles.provinceItemTextActive,
                  ]}>
                    {item}
                  </Text>
                  {province === item && (
                    <Ionicons name="checkmark" size={rs(20)} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { color: Colors.secondary, fontWeight: 'bold', letterSpacing: 2 },
  tagline: { color: Colors.white, opacity: 0.8, marginTop: 4 },
  form: { backgroundColor: Colors.white, borderRadius: 20, alignSelf: 'center', elevation: 4, shadowColor: Colors.shadow, shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  title: { color: Colors.text.primary, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  errorBox: { backgroundColor: '#FEE2E2', borderRadius: 8, padding: 12, marginBottom: 12 },
  errorText: { color: Colors.error, textAlign: 'center' },
  label: { color: Colors.text.secondary, fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 16, marginBottom: 14,
    color: Colors.text.primary, backgroundColor: Colors.background,
  },
  inputError: { borderColor: Colors.error },
  fieldError: { color: Colors.error, marginTop: -10, marginBottom: 10, textAlign: 'right' },
  provinceBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  provinceBtnText: { color: Colors.text.primary },
  rulesBox: { backgroundColor: Colors.background },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  ruleText: { fontWeight: '500' },
  termsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  termsText: { color: Colors.text.secondary, flex: 1, textAlign: 'right' },
  termsLink: { color: Colors.primary, fontWeight: '600' },
  btn: { backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  btnDisabled: { backgroundColor: Colors.text.disabled },
  btnText: { color: Colors.white, fontWeight: 'bold' },
  link: { color: Colors.text.secondary, textAlign: 'center' },
  linkBold: { color: Colors.primary, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: Colors.white, maxHeight: '75%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: Colors.text.primary, fontWeight: 'bold' },
  provinceItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  provinceItemActive: { backgroundColor: '#EFF6FF' },
  provinceItemText: { color: Colors.text.primary, textAlign: 'right' },
  provinceItemTextActive: { color: Colors.primary, fontWeight: '600' },
  separator: { height: 1, backgroundColor: Colors.border },
});
