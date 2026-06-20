import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useResponsive } from '../../hooks/useResponsive';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/auth.store';
import { updateProfile } from '../../services/user.service';
import CustomAlert, { CustomAlertRef } from '../../components/CustomAlert';

export default function EditProfileScreen() {
  const { rs, hp, wp, isTablet, contentWidth } = useResponsive();
  const { user, updateUser } = useAuthStore();
  const customAlertRef = useRef<CustomAlertRef>(null);
  const paddingH = isTablet ? (wp(100) - contentWidth) / 2 : wp(5);

  const [name, setName] = useState(user?.name ?? '');
  const [avatar, setAvatar] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setAvatar({
        uri: asset.uri,
        name: asset.fileName ?? 'avatar.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      });
    }
  }

  async function onSave() {
    setLoading(true);
    try {
      const updated = await updateProfile({ name, avatar: avatar ?? undefined });
      updateUser(updated);
      customAlertRef.current?.show({
        title: 'تم الحفظ',
        message: 'تم تحديث الملف الشخصي بنجاح!',
        buttons: [{ text: 'رائع', style: 'default', onPress: () => router.back() }],
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'حدث خطأ أثناء حفظ التغييرات.';
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
        <Text style={[styles.title, { fontSize: rs(18) }]}>تعديل الملف الشخصي</Text>
        <View style={{ width: rs(24) }} />
      </View>

      {/* Avatar Selection */}
      <TouchableOpacity style={[styles.avatarContainer, { marginBottom: rs(32) }]} onPress={pickAvatar}>
        {avatar || user?.avatar
          ? <Image
              source={{ uri: avatar?.uri ?? user?.avatar }}
              style={[styles.avatar, { width: rs(90), height: rs(90), borderRadius: rs(45) }]}
            />
          : <View style={[styles.avatarPlaceholder, { width: rs(90), height: rs(90), borderRadius: rs(45) }]}>
              <Text style={[styles.avatarText, { fontSize: rs(36) }]}>
                {user?.name?.charAt(0) ?? '؟'}
              </Text>
            </View>
        }
        {/* Camera Badge - مسقطة على الزاوية السفلية */}
        <View style={[
          styles.editBadge,
          {
            width: rs(36),
            height: rs(36),
            borderRadius: rs(18),
            right: 0,
            bottom: 0,
            backgroundColor: Colors.primarySoft,
          }
        ]}>
          <Ionicons name="camera" size={rs(16)} color={Colors.primary} />
        </View>
      </TouchableOpacity>

      {/* Name Input */}
      <Text style={[styles.label, { fontSize: rs(13) }]}>الاسم الكامل</Text>
      <View style={[styles.inputContainer, { height: hp(6.5), borderRadius: rs(12), marginBottom: rs(16) }]}>
        <View style={[styles.iconWrapper, { width: rs(36), height: rs(36), borderRadius: rs(10), backgroundColor: Colors.primarySoft, justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="person-outline" size={rs(18)} color={Colors.primary} />
        </View>
        <TextInput
          style={[styles.input, { fontSize: rs(15), flex: 1, textAlign: 'right', paddingHorizontal: rs(12) }]}
          value={name}
          onChangeText={setName}
          placeholder="الاسم الكامل"
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
          : <Text style={[styles.saveBtnText, { fontSize: rs(16) }]}>حفظ التغييرات</Text>
        }
      </TouchableOpacity>

      {/* Custom Alert */}
      <CustomAlert ref={customAlertRef} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: Colors.text.primary, fontFamily: 'Tajawal_800ExtraBold', fontWeight: 'bold' },
  avatarContainer: { alignItems: 'center', position: 'relative' },
  avatar: {
    resizeMode: 'cover',
    borderWidth: 3,
    borderColor: Colors.white,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  avatarText: { color: Colors.white, fontFamily: 'Tajawal_700Bold' },
  editBadge: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
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