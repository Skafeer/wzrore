import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  Alert, Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useResponsive } from '../../hooks/useResponsive';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/auth.store';
import { updateProfile } from '../../services/user.service';

export default function EditProfileScreen() {
  const { rs, hp, wp, isTablet, contentWidth } = useResponsive();
  const { user, updateUser } = useAuthStore();
  const paddingH = isTablet ? (wp(100) - contentWidth) / 2 : wp(5);

  const [name, setName] = useState(user?.name ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
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
      const updated = await updateProfile({ name, username, avatar: avatar ?? undefined });
      updateUser(updated);
      Alert.alert('تم', 'تم تحديث الملف الشخصي');
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
      {/* Header */}
      <View style={[styles.header, { paddingTop: hp(6), paddingBottom: hp(2) }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={rs(24)} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { fontSize: rs(18) }]}>تعديل الملف الشخصي</Text>
        <View style={{ width: rs(24) }} />
      </View>

      {/* Avatar */}
      <TouchableOpacity style={[styles.avatarContainer, { marginBottom: rs(24) }]} onPress={pickAvatar}>
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
        <View style={[styles.editBadge, { bottom: 0, left: rs(30) }]}>
          <Ionicons name="camera" size={rs(14)} color={Colors.white} />
        </View>
      </TouchableOpacity>

      {/* Form */}
      <Text style={[styles.label, { fontSize: rs(14) }]}>الاسم الكامل</Text>
      <TextInput
        style={[styles.input, { fontSize: rs(15), height: hp(6.5), marginBottom: rs(16) }]}
        value={name}
        onChangeText={setName}
        textAlign="right"
        placeholderTextColor={Colors.text.disabled}
      />

      <Text style={[styles.label, { fontSize: rs(14) }]}>اسم المستخدم</Text>
      <TextInput
        style={[styles.input, { fontSize: rs(15), height: hp(6.5), marginBottom: rs(24) }]}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        textAlign="right"
        placeholderTextColor={Colors.text.disabled}
      />

      <TouchableOpacity
        style={[styles.saveBtn, { height: hp(6.5), borderRadius: rs(12) }]}
        onPress={onSave}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color={Colors.white} />
          : <Text style={[styles.saveBtnText, { fontSize: rs(16) }]}>حفظ التغييرات</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: Colors.text.primary, fontWeight: 'bold' },
  avatarContainer: { alignItems: 'center', position: 'relative' },
  avatar: { resizeMode: 'cover' },
  avatarPlaceholder: { backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: Colors.white, fontWeight: 'bold' },
  editBadge: { position: 'absolute', backgroundColor: Colors.primary, borderRadius: 12, padding: 4 },
  label: { color: Colors.text.secondary, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: Colors.white, borderWidth: 1.5,
    borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 16, color: Colors.text.primary,
  },
  saveBtn: { backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { color: Colors.white, fontWeight: 'bold' },
});