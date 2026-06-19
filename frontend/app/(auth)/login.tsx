import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, ActivityIndicator, Image, Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useResponsive } from '../../hooks/useResponsive';
import { Colors } from '../../constants/colors';
import { MotionView, PressableScale } from '../../components/motion';
import CustomAlert, { CustomAlertRef } from '../../components/CustomAlert';

export default function LoginScreen() {
  const { rs, hp, pagePadding, contentWidth } = useResponsive();
  const { handleLogin, loading, error } = useAuth();
  const customAlertRef = useRef<CustomAlertRef>(null);
  const formWidth = Math.min(contentWidth, 460);

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
        // الدائرة الأولى: تتحرك يميناً ويساراً وتغير شفافيتها ببطء
        Animated.timing(translateX1, {
          toValue: 1,
          duration: 20000,
          useNativeDriver: true,
          easing: (t) => Math.sin(t * Math.PI * 2), // حركة ذهاب وإياب
        }),
        Animated.timing(opacity1, {
          toValue: 0.3,
          duration: 15000,
          useNativeDriver: true,
        }),
        // الدائرة الثانية: تتحرك للأعلى والأسفل
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

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  async function onLogin() {
    if (!phone || !password) {
      customAlertRef.current?.show({
        title: 'تنبيه',
        message: 'الرجاء إدخال رقم الهاتف وكلمة المرور',
        buttons: [{ text: 'حسناً', style: 'default' }],
      });
      return;
    }
    await handleLogin(phone, password);
  }

  // تحويل القيمة من 0-1 إلى -200 إلى 200
  const x1 = translateX1.interpolate({ inputRange: [0, 1], outputRange: [-200, 200] });
  const y2 = translateY2.interpolate({ inputRange: [0, 1], outputRange: [-250, 250] });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* العناصر المتحركة في الخلفية */}
      <Animated.View
        style={[
          styles.circle1,
          {
            transform: [{ translateX: x1 }],
            opacity: opacity1,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.circle2,
          {
            transform: [{ translateY: y2 }],
            opacity: opacity2,
          },
        ]}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingHorizontal: pagePadding },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <MotionView delay={0} style={styles.header}>
          {/* ✅ استبدال النص بأيقونة بيضاء */}
          <Image
            source={require('../../assets/android-icon-monochrome.png')}
            style={{ width: rs(80), height: rs(80) }}
            resizeMode="contain"
          />
          {/* العبارة باللون الأصفر */}
          <Text style={[styles.tagline, { fontSize: rs(14) }]}>الوزاري يبدي من صواب</Text>
        </MotionView>

        <MotionView delay={80} style={[styles.form, { width: formWidth, padding: rs(24) }]}>
          <Text style={[styles.title, { fontSize: rs(24) }]}>تسجيل الدخول</Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={[styles.errorText, { fontSize: rs(13) }]}>{error}</Text>
            </View>
          )}

          <Text style={[styles.label, { fontSize: rs(13) }]}>رقم الهاتف</Text>
          <View style={[styles.inputContainer, { height: hp(6.5), borderRadius: rs(12), marginBottom: rs(14) }]}>
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

          <Text style={[styles.label, { fontSize: rs(13) }]}>كلمة المرور</Text>
          <View style={[styles.inputContainer, { height: hp(6.5), borderRadius: rs(12), marginBottom: rs(20) }]}>
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

          <PressableScale
            style={[styles.btn, { height: hp(6.5), borderRadius: rs(12), marginBottom: rs(16) }]}
            onPress={onLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={Colors.primary} />
              : <Text style={[styles.btnText, { fontSize: rs(16) }]}>دخول</Text>
            }
          </PressableScale>

          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={[styles.link, { fontSize: rs(14) }]}>
              ما عندك حساب؟ <Text style={styles.linkBold}>سجّل الآن</Text>
            </Text>
          </TouchableOpacity>
        </MotionView>

        <CustomAlert ref={customAlertRef} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary, overflow: 'hidden' },
  // دوائر متحركة في الخلفية
  circle1: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: '#0F3B8C', // درجة أغمق قليلاً من الأساسي
    top: -100,
    left: -100,
    opacity: 0.2,
  },
  circle2: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: Colors.secondary, // لمسة صفراء خفيفة جداً في الخلفية
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
  input: { flex: 1, color: Colors.text.primary, textAlign: 'right', paddingHorizontal: 12, fontFamily: 'Tajawal_500Medium' },
  iconWrapper: { backgroundColor: Colors.primarySoft, justifyContent: 'center', alignItems: 'center' },
  btn: { backgroundColor: Colors.secondary, justifyContent: 'center', alignItems: 'center', shadowColor: Colors.secondary, shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  btnText: { color: Colors.primary, fontFamily: 'Tajawal_700Bold' },
  link: { color: Colors.text.secondary, textAlign: 'center', fontFamily: 'Tajawal_500Medium' },
  linkBold: { color: Colors.primary, fontFamily: 'Tajawal_700Bold' },
});