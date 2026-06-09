import { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Alert, ActivityIndicator,
  Image, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useResponsive } from '../../hooks/useResponsive';
import { Colors } from '../../constants/colors';
import { startExam, saveAnswer, submitExam } from '../../services/exam.service';
import { useAuthStore } from '../../store/auth.store';
import { Question } from '../../types';
import { MotionView, PressableScale } from '../../components/motion';

interface AnswerData {
  text: string;
  images: { uri: string; name: string; type: string }[];
}

export default function ExamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { rs, hp, pagePadding } = useResponsive();
  const user = useAuthStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [examTitle, setExamTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerData>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasPaid = !!user?.subscription;
  const maxImages = hasPaid ? 3 : 1;

  useEffect(() => {
    initExam();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  async function initExam() {
    try {
      const session = await startExam(id!);
      setSessionId(session.sessionId);
      setExamTitle(session.exam.title);
      setQuestions(session.exam.questions);
      setTimeLeft(session.exam.duration * 60);

      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleSubmit(session.sessionId, session.exam.questions);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      Alert.alert('خطأ', 'تعذر بدء الامتحان');
      router.replace('/(tabs)/exams' as never);
    } finally {
      setLoading(false);
    }
  }

  function formatTime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  async function pickImage() {
    const q = questions[currentIndex];
    const current = answers[q.id] ?? { text: '', images: [] };
    if (current.images.length >= maxImages) {
      Alert.alert('تنبيه', `يمكنك رفع ${maxImages} صور فقط${!hasPaid ? ' في الحساب المجاني' : ''}`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const img = {
        uri: asset.uri,
        name: asset.fileName ?? `image_${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      };
      setAnswers(prev => ({
        ...prev,
        [q.id]: { ...current, images: [...current.images, img] },
      }));
    }
  }

  function removeImage(questionId: string, index: number) {
    setAnswers(prev => {
      const current = prev[questionId] ?? { text: '', images: [] };
      const newImages = current.images.filter((_, i) => i !== index);
      return { ...prev, [questionId]: { ...current, images: newImages } };
    });
  }

  async function handleSubmit(sid?: string, qs?: Question[]) {
    const sId = sid ?? sessionId;
    const allQuestions = qs ?? questions;
    if (!sId) return;

    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      for (const q of allQuestions) {
        const answer = answers[q.id];
        if (answer?.text || answer?.images?.length) {
          await saveAnswer(sId, q.id, answer.text ?? '', answer.images);
        }
      }
      await submitExam(sId);
      router.replace(`/result/${sId}` as never);
    } catch {
      Alert.alert('خطأ', 'تعذر تسليم الامتحان');
    } finally {
      setSubmitting(false);
    }
  }

  function confirmSubmit() {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('هل أنت متأكد من تسليم الامتحان؟');
      if (confirmed) handleSubmit();
    } else {
      Alert.alert(
        'تسليم الامتحان',
        'هل أنت متأكد من تسليم الامتحان؟',
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'تسليم', onPress: () => handleSubmit() },
        ]
      );
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.loadingText, { fontSize: rs(14), marginTop: rs(12) }]}>جاري تحميل الامتحان...</Text>
      </View>
    );
  }

  if (submitting) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.loadingText, { fontSize: rs(14), marginTop: rs(12) }]}>جاري التصحيح بالذكاء الاصطناعي...</Text>
        <Text style={[styles.loadingSubText, { fontSize: rs(12), marginTop: rs(8) }]}>قد يستغرق هذا بضعة ثوانٍ</Text>
      </View>
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentQuestion?.id] ?? { text: '', images: [] };
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === questions.length - 1;

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={[styles.topBar, { paddingHorizontal: pagePadding, paddingTop: hp(5), paddingBottom: hp(1.5) }]}>
        <View style={[styles.timerBox, { paddingHorizontal: rs(12), paddingVertical: rs(6), borderRadius: rs(20) }]}>
          <Ionicons name="time-outline" size={rs(16)} color={timeLeft < 300 ? Colors.error : Colors.white} />
          <Text style={[styles.timerText, { fontSize: rs(15), color: timeLeft < 300 ? Colors.error : Colors.white }]}>
            {formatTime(timeLeft)}
          </Text>
        </View>
        <Text style={[styles.examTitleText, { fontSize: rs(14) }]} numberOfLines={1}>{examTitle}</Text>
      </View>

      {/* Question Counter */}
      <View style={[styles.counterBar, { paddingHorizontal: pagePadding, paddingVertical: rs(10) }]}>
        <Text style={[styles.counterText, { fontSize: rs(13) }]}>
          سؤال {currentIndex + 1} من {questions.length}
        </Text>
        <Text style={[styles.degreeText, { fontSize: rs(13) }]}>
          الدرجة: {currentQuestion?.degree}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressBar, { marginHorizontal: pagePadding }]}>
        <View style={[styles.progressFill, { width: `${((currentIndex + 1) / questions.length) * 100}%` }]} />
      </View>

      {/* Question Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: pagePadding, paddingVertical: rs(16) }}
      >
        {/* Question Text */}
        <MotionView delay={80} style={[styles.questionBox, { padding: rs(16), borderRadius: rs(14), marginBottom: rs(16) }]}>
          <Text style={[styles.questionText, { fontSize: rs(16) }]}>{currentQuestion?.text}</Text>
        </MotionView>

        {/* Answer Input */}
        <Text style={[styles.answerLabel, { fontSize: rs(14), marginBottom: rs(8) }]}>إجابتك</Text>
        <TextInput
          style={[styles.answerInput, { fontSize: rs(15), minHeight: hp(20), padding: rs(14), borderRadius: rs(12) }]}
          placeholder="اكتب إجابتك هنا..."
          placeholderTextColor={Colors.text.disabled}
          multiline
          textAlignVertical="top"
          textAlign="right"
          value={currentAnswer.text}
          onChangeText={(text) =>
            setAnswers(prev => ({
              ...prev,
              [currentQuestion.id]: { ...currentAnswer, text },
            }))
          }
        />

        {/* Image Upload */}
        <PressableScale
          style={[styles.imageBtn, { padding: rs(12), borderRadius: rs(10), marginTop: rs(12) }]}
          onPress={pickImage}
        >
          <Ionicons name="camera-outline" size={rs(20)} color={Colors.primary} />
          <Text style={[styles.imageBtnText, { fontSize: rs(14) }]}>
            رفع صورة ({currentAnswer.images.length}/{maxImages})
          </Text>
          {!hasPaid && (
            <View style={[styles.freeBadge, { paddingHorizontal: rs(8), paddingVertical: rs(3), borderRadius: rs(10) }]}>
              <Text style={[styles.freeBadgeText, { fontSize: rs(11) }]}>مجاني</Text>
            </View>
          )}
        </PressableScale>

        {/* Images Preview */}
        {currentAnswer.images.length > 0 && (
          <ScrollView horizontal style={{ marginTop: rs(10) }} showsHorizontalScrollIndicator={false}>
            {currentAnswer.images.map((img, i) => (
              <View key={i} style={{ marginLeft: rs(8), position: 'relative' }}>
                <Image
                  source={{ uri: img.uri }}
                  style={{ width: rs(80), height: rs(80), borderRadius: rs(8) }}
                />
                <TouchableOpacity
                  style={[styles.removeImg, { top: -rs(6), left: -rs(6) }]}
                  onPress={() => removeImage(currentQuestion.id, i)}
                >
                  <Ionicons name="close-circle" size={rs(20)} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Report Button */}
        <TouchableOpacity
          style={[styles.reportBtn, { marginTop: rs(16), paddingVertical: rs(8) }]}
          onPress={() => router.push(`/exam/report?questionId=${currentQuestion?.id}` as never)}
        >
          <Ionicons name="flag-outline" size={rs(14)} color={Colors.text.disabled} />
          <Text style={[styles.reportText, { fontSize: rs(12) }]}>أبلاغ عن مشكلة</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={[styles.navBar, { paddingHorizontal: pagePadding, paddingVertical: rs(12) }]}>
        {!isFirst && (
          <PressableScale
            style={[styles.navBtn, { paddingVertical: rs(12), paddingHorizontal: rs(24), borderRadius: rs(12) }]}
            onPress={() => setCurrentIndex(prev => prev - 1)}
          >
            <Ionicons name="chevron-forward" size={rs(18)} color={Colors.primary} />
            <Text style={[styles.navBtnText, { fontSize: rs(15) }]}>السابق</Text>
          </PressableScale>
        )}

        {!isFirst && <View style={{ flex: 1 }} />}

        {isLast ? (
          <PressableScale
            style={[styles.submitBtn, { paddingVertical: rs(12), paddingHorizontal: rs(24), borderRadius: rs(12) }]}
            onPress={confirmSubmit}
          >
            <Text style={[styles.submitBtnText, { fontSize: rs(15) }]}>تسليم الامتحان</Text>
            <Ionicons name="checkmark-circle" size={rs(18)} color={Colors.white} />
          </PressableScale>
        ) : (
          <PressableScale
            style={[styles.nextBtn, { paddingVertical: rs(12), paddingHorizontal: rs(24), borderRadius: rs(12) }]}
            onPress={() => setCurrentIndex(prev => prev + 1)}
          >
            <Text style={[styles.nextBtnText, { fontSize: rs(15) }]}>التالي</Text>
            <Ionicons name="chevron-back" size={rs(18)} color={Colors.white} />
          </PressableScale>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  loadingText: { color: Colors.text.primary, fontWeight: '600' },
  loadingSubText: { color: Colors.text.secondary },
  topBar: { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timerBox: { backgroundColor: 'rgba(255,255,255,0.15)', flexDirection: 'row', alignItems: 'center', gap: 6 },
  timerText: { fontWeight: 'bold' },
  examTitleText: { color: Colors.white, flex: 1, textAlign: 'center', marginHorizontal: 8 },
  counterBar: { backgroundColor: Colors.white, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: Colors.border },
  counterText: { color: Colors.text.secondary },
  degreeText: { color: Colors.primary, fontWeight: '600' },
  progressBar: { height: 4, backgroundColor: Colors.border, borderRadius: 2, marginBottom: 4 },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  questionBox: { backgroundColor: Colors.white, elevation: 2, shadowColor: Colors.shadow, shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  questionText: { color: Colors.text.primary, lineHeight: 26, textAlign: 'right' },
  answerLabel: { color: Colors.text.secondary, fontWeight: '600' },
  answerInput: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, color: Colors.text.primary },
  imageBtn: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 8 },
  imageBtnText: { color: Colors.primary, fontWeight: '600', flex: 1 },
  freeBadge: { backgroundColor: Colors.secondary },
  freeBadgeText: { color: Colors.text.primary, fontWeight: '600' },
  removeImg: { position: 'absolute', backgroundColor: Colors.white, borderRadius: 10 },
  reportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end' },
  reportText: { color: Colors.text.disabled },
  navBar: { backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border, flexDirection: 'row', alignItems: 'center' },
  navBtn: { backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 6 },
  navBtnText: { color: Colors.primary, fontWeight: '600' },
  nextBtn: { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', gap: 6 },
  nextBtnText: { color: Colors.white, fontWeight: '600' },
  submitBtn: { backgroundColor: Colors.success, flexDirection: 'row', alignItems: 'center', gap: 6 },
  submitBtnText: { color: Colors.white, fontWeight: '600' },
});
