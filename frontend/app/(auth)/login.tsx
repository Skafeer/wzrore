import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useResponsive } from '../../hooks/useResponsive';
import { Colors } from '../../constants/colors';

export default function LoginScreen() {
  const { rs, wp, hp, isTablet, contentWidth } = useResponsive();
  const { handleLogin, loading, error } = useAuth();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  async function onLogin() {
    if (!phone || !password) return;
    await handleLogin(phone, password);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingHorizontal: isTablet ? (wp(100) - contentWidth) / 2 : wp(6) },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.logo, { fontSize: rs(42) }]}>صواب</Text>
          <Text style={[styles.tagline, { fontSize: rs(14) }]}>الوزاري يبدي من صواب</Text>
        </View>

        {/* Form */}
        <View style={[styles.form, { width: contentWidth, padding: rs(24) }]}>
          <Text style={[styles.title, { fontSize: rs(24) }]}>تسجيل الدخول</Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={[styles.errorText, { fontSize: rs(13) }]}>{error}</Text>
            </View>
          )}

          {/* Phone */}
          <Text style={[styles.label, { fontSize: rs(13) }]}>رقم الهاتف</Text>
          <TextInput
            style={[styles.input, { fontSize: rs(15), height: hp(6.5) }]}
            placeholder="07XXXXXXXXX"
            placeholderTextColor={Colors.text.disabled}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={11}
            textAlign="right"
          />

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

          <TouchableOpacity
            style={[styles.btn, { height: hp(6.5), borderRadius: rs(12), marginTop: rs(8) }]}
            onPress={onLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={[styles.btnText, { fontSize: rs(16) }]}>دخول</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={[styles.link, { fontSize: rs(14) }]}>
              ما عندك حساب؟ <Text style={styles.linkBold}>سجّل الآن</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { color: Colors.secondary, fontWeight: 'bold', letterSpacing: 2 },
  tagline: { color: Colors.white, opacity: 0.8, marginTop: 4 },
  form: { backgroundColor: Colors.white, borderRadius: 20, alignSelf: 'center' },
  title: { color: Colors.text.primary, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  errorBox: { backgroundColor: '#FEE2E2', borderRadius: 8, padding: 12, marginBottom: 12 },
  errorText: { color: Colors.error, textAlign: 'center' },
  label: { color: Colors.text.secondary, fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 16, marginBottom: 14,
    color: Colors.text.primary, backgroundColor: Colors.background,
  },
  btn: { backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  btnText: { color: Colors.white, fontWeight: 'bold' },
  link: { color: Colors.text.secondary, textAlign: 'center' },
  linkBold: { color: Colors.primary, fontWeight: 'bold' },
});