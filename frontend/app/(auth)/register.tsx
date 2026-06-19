import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, ActivityIndicator, Modal, FlatList, Image, Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useResponsive } from '../../hooks/useResponsive';
import { Colors } from '../../constants/colors';
import { MotionView, PressableScale } from '../../components/motion';
import CustomAlert, { CustomAlertRef } from '../../components/CustomAlert';

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
  const customAlertRef = useRef<CustomAlertRef>(null);
  const formWidth = Math.min(contentWidth, 500);

  // أنميشن الخلفية
  const translateX1 = useRef(new Animated.Value(0)).current;
  const translateY1 = useRef(new Animated.Value(0)).current;
  const opacity1 = useRef(new Animated.Value(0.2)).current;
  const translateX2 = useRef(new Animated.Value(0)).current;
  const translateY2 = useRef(new Animated.Value(0)).current;
  const opacity2 = useRef(new Animated.Value(0.1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(translateX1, {
          toValue: 1,
          duration: 20000,
          useNativeDriver: true,
          easing: (t) => Math.sin(t * Math.PI * 2),
        }),
        Animated.timing(opacity1, {
          toValue: 0.3,
          duration: 15000,
          useNativeDriver: true,
        }),
        Animated.timing(translateY2, {
          toValue: 1,
          duration: 25000,
          useNativeDriver: true,
          easing: (t) => Math.cos(t * Math.PI * 2),
        }),
        Animated.timing(opacity2, {
          toValue: 0.15,
          duration: 18000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [translateX1, translateY2, opacity1, opacity2]);

  const x1 = translateX1.interpolate({ inputRange: [0, 1], outputRange: [-200, 200] });
  const y2 = translateY2.interpolate({ inputRange: [0, 1], outputRange: [-250, 250] });

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
      customAlertRef.current?.show({
        title: 'تنبيه',
        message: 'الرجاء تعبئة جميع الحقول المطلوبة',
        buttons: [{ text: 'حسناً', style: 'default' }],
      });
      return;
    }
    if (!phoneValid) {
      customAlertRef.current?.show({
        title: 'خطأ',
        message: 'رقم الهاتف يجب أن يبدأ بـ 07 ويكون مكوناً من 11 رقماً',
        buttons: [{ text: 'حسناً', style: 'default' }],
      });
      return;
    }
    if (!passwordsMatch) {
      customAlertRef.current?.show({
        title: 'خطأ',
        message: 'كلمة المرور وتأكيدها غير متطابقين',
        buttons: [{ text: 'حسناً', style: 'default' }],
      });
      return;
    }
    if (!agreed) {
      customAlertRef.current?.show({
        title: 'تنبيه',
        message: 'يجب الموافقة على الشروط وسياسة الخصوصية',
        buttons: [{ text: 'حسناً', style: 'default' }],
      });
      return;
    }
    await handleRegister(name, phone, province, password);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* عناصر الخلفية المتحركة */}
      <Animated.View style={[styles.circle1, { transform: [{ translateX: x1 }], opacity: opacity1 }]} />
      <Animated.View style={[styles.circle2, { transform: [{ translateY: y2 }], opacity: opacity2 }]} />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingHorizontal: pagePadding },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <MotionView delay={0} style={styles.header}>
          <Image
            source={require('../../assets/android-icon-monochrome.png')}
            style={{ width: rs(80), height: rs(80) }}
            resizeMode="contain"
          />
          <Text style={[styles.tagline, { fontSize: rs(14) }]}>الوزاري يبدي من صواب</Text>
        </MotionView>

        <MotionView delay={80} style={[styles.form, { width: formWidth, padding: rs(24) }]}>
          <Text style={[styles.title, { fontSize: rs(24) }]}>إنشاء حساب</Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={[styles.errorText, { fontSize: rs(13) }]}>{error}</Text>
            </View>
          )}

          <Text style={[styles.label, { fontSize: rs(13) }]}>اسم الطالب</Text>
          <View style={[styles.inputContainer, { height: hp(6.5), borderRadius: rs(12), marginBottom: rs(14) }]}>
            <View style={[styles.iconWrapper, { width: rs(36), height: rs(36), borderRadius: rs(10) }]}>
              <Ionicons name="person-outline" size={rs(18)} color={Colors.primary} />
            </View>
            <TextInput
              style={[styles.input, { fontSize: rs(15), flex: 1 }]}
              placeholder="الاسم الكامل"
              placeholderTextColor={Colors.text.disabled}
              value={name}
              onChangeText={setName}
              textAlign="right"
            />
          </View>

          <Text style={[styles.label, { fontSize: rs(13) }]}>رقم الهاتف</Text>
          <View style={[styles.inputContainer, { height: hp(6.5), borderRadius: rs(12), marginBottom: rs(14) }, phone.length > 0 && !phoneValid && styles.inputErrorContainer]}>
            <View style={[styles.iconWrapper, { width: rs(36), height: rs(36), borderRadius: rs(10) }]}>
              <Ionicons name="call-outline" size={rs(18)} color={Colors.primary} />
            </View>
            <TextInput
              style={[styles.input, { fontSize: rs(15), flex: 1 }]}
              placeholder="07XXXXXXXXX"
              placeholderTextColor={Colors.text.disabled}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={11}
              textAlign="right"
            />
          </View>

          <Text style={[styles.label, { fontSize: rs(13) }]}>المحافظة</Text>
          <TouchableOpacity
            style={[styles.inputContainer, { height: hp(6.5), borderRadius: rs(12), marginBottom: rs(14), flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }]}
            onPress={() => setShowProvince(true)}
          >
            <View style={[styles.iconWrapper, { width: rs(36), height: rs(36), borderRadius: rs(10) }]}>
              <Ionicons name="location-outline" size={rs(18)} color={Colors.primary} />
            </View>
            <Text style={[styles.input, { fontSize: rs(15), flex: 1, color: province ? Colors.text.primary : Colors.text.disabled }]}>
              {province || 'اختر محافظتك'}
            </Text>
            <Ionicons name="chevron-down" size={rs(18)} color={Colors.text.secondary} />
          </TouchableOpacity>

          <Text style={[styles.label, { fontSize: rs(13) }]}>كلمة المرور</Text>
          <View style={[styles.inputContainer, { height: hp(6.5), borderRadius: rs(12), marginBottom: rs(14) }]}>
            <View style={[styles.iconWrapper, { width: rs(36), height: rs(36), borderRadius: rs(10) }]}>
              <Ionicons name="lock-closed-outline" size={rs(18)} color={Colors.primary} />
            </View>
            <TextInput
              style={[styles.input, { fontSize: rs(15), flex: 1 }]}
              placeholder="••••••••"
              placeholderTextColor={Colors.text.disabled}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textAlign="right"
            />
          </View>

          {password.length > 0 && (
            <View style={[styles.rulesBox, { marginBottom: rs(14), padding: rs(12), borderRadius: rs(12) }]}>
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

          <Text style={[styles.label, { fontSize: rs(13) }]}>تأكيد كلمة المرور</Text>
          <View style={[styles.inputContainer, { height: hp(6.5), borderRadius: rs(12), marginBottom: rs(16) }, confirmPassword.length > 0 && !passwordsMatch && styles.inputErrorContainer]}>
            <View style={[styles.iconWrapper, { width: rs(36), height: rs(36), borderRadius: rs(10) }]}>
              <Ionicons name="lock-closed-outline" size={rs(18)} color={Colors.primary} />
            </View>
            <TextInput
              style={[styles.input, { fontSize: rs(15), flex: 1 }]}
              placeholder="••••••••"
              placeholderTextColor={Colors.text.disabled}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              textAlign="right"
            />
          </View>

          <TouchableOpacity
            style={[styles.termsRow, { marginBottom: rs(16), flexDirection: 'row', alignItems: 'center', gap: 8 }]}
            onPress={() => setAgreed(!agreed)}
          >
            <Ionicons
              name={agreed ? 'checkbox' : 'square-outline'}
              size={rs(22)}
              color={agreed ? Colors.primary : Colors.text.disabled}
            />
            <Text style={[styles.termsText, { fontSize: rs(13), flex: 1, textAlign: 'right' }]}>
              أوافق على <Text style={styles.termsLink}>شروط الاستخدام وسياسة الخصوصية</Text>
            </Text>
          </TouchableOpacity>

          <PressableScale
            style={[
              styles.btn,
              { height: hp(6.5), borderRadius: rs(12), marginBottom: rs(16) },
              (!agreed || !phoneValid || !passwordsMatch) && styles.btnDisabled,
            ]}
            onPress={onRegister}
            disabled={loading || !agreed || !phoneValid || !passwordsMatch}
          >
            {loading
              ? <ActivityIndicator color={Colors.primary} />
              : <Text style={[styles.btnText, { fontSize: rs(16) }]}>إنشاء حساب</Text>
            }
          </PressableScale>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.link, { fontSize: rs(14) }]}>
              عندك حساب؟ <Text style={styles.linkBold}>سجّل دخول</Text>
            </Text>
          </TouchableOpacity>
        </MotionView>

        <CustomAlert ref={customAlertRef} />

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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary, overflow: 'hidden' },
  // دوائر متحركة
  circle1: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: '#0F3B8C',
    top: -100,
    left: -100,
    opacity: 0.2,
  },
  circle2: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: Colors.secondary,
    bottom: -150,
    right: -150,
    opacity: 0.08,
  },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  header: { alignItems: 'center', marginBottom: 32, zIndex: 1 },
  tagline: { color: Colors.secondary, opacity: 0.9, marginTop: 8, fontFamily: 'Tajawal_700Bold' },
  form: { backgroundColor: Colors.white, borderRadius: 20, alignSelf: 'center', elevation: 4, shadowColor: Colors.shadow, shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  title: { color: Colors.text.primary, fontFamily: 'Tajawal_800ExtraBold', marginBottom: 20, textAlign: 'center' },
  errorBox: { backgroundColor: '#FEE2E2', borderRadius: 8, padding: 12, marginBottom: 12 },
  errorText: { color: Colors.error, textAlign: 'center', fontFamily: 'Tajawal_500Medium' },
  label: { color: Colors.text.secondary, fontFamily: 'Tajawal_700Bold', marginBottom: 6 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, paddingHorizontal: 8 },
  inputErrorContainer: { borderColor: Colors.error },
  input: { flex: 1, color: Colors.text.primary, textAlign: 'right', paddingHorizontal: 12, fontFamily: 'Tajawal_500Medium' },
  iconWrapper: { backgroundColor: Colors.primarySoft, justifyContent: 'center', alignItems: 'center' },
  rulesBox: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  ruleText: { fontWeight: '500', fontFamily: 'Tajawal_500Medium' },
  termsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  termsText: { color: Colors.text.secondary, flex: 1, textAlign: 'right', fontFamily: 'Tajawal_500Medium' },
  termsLink: { color: Colors.primary, fontWeight: '600', fontFamily: 'Tajawal_700Bold' },
  btn: { backgroundColor: Colors.secondary, justifyContent: 'center', alignItems: 'center', shadowColor: Colors.secondary, shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  btnDisabled: { backgroundColor: Colors.text.disabled, elevation: 0, shadowOpacity: 0 },
  btnText: { color: Colors.primary, fontFamily: 'Tajawal_700Bold' },
  link: { color: Colors.text.secondary, textAlign: 'center', fontFamily: 'Tajawal_500Medium' },
  linkBold: { color: Colors.primary, fontFamily: 'Tajawal_700Bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: Colors.white, maxHeight: '75%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: Colors.text.primary, fontFamily: 'Tajawal_700Bold' },
  provinceItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  provinceItemActive: { backgroundColor: '#EFF6FF' },
  provinceItemText: { color: Colors.text.primary, textAlign: 'right', fontFamily: 'Tajawal_500Medium' },
  provinceItemTextActive: { color: Colors.primary, fontWeight: '600', fontFamily: 'Tajawal_700Bold' },
  separator: { height: 1, backgroundColor: Colors.border },
});