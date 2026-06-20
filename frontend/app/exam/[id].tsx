import { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator,
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
import CustomAlert, { CustomAlertRef } from '../../components/CustomAlert';

interface AnswerData {
  text: string;
  images: { uri: string; name: string; type: string }[];
}

export default function ExamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { rs, hp, pagePadding } = useResponsive();
  const user = useAuthStore((s) => s.user);

  const customAlertRef = useRef<CustomAlertRef>(null);

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
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; requiresSubscription?: boolean; nextRenewal?: string } } };
      const data = error?.response?.data;

      if (data?.requiresSubscription) {
        const nextRenewal = data.nextRenewal
          ? new Date(data.nextRenewal).toLocaleDateString('ar-IQ')
          : '';

        if (Platform.OS === 'web') {
          const goSub = window.confirm(
            `${data.message}\n\nهل تريد الاشتراك الآن؟`
          );
          if (goSub) router.replace('/profile/subscription' as never);
          else router.replace('/(tabs)/exams' as never);
        } else {
          customAlertRef.current?.show({
            title: '🔒 انتهت امتحاناتك المجانية',
            message: `${data.message}${nextRenewal ? `\n\n📅 تاريخ التجديد: ${nextRenewal}` : ''}`,
            buttons: [
              {
                text: '⭐ اشترك الآن',
                onPress: () => router.replace('/profile/subscription' as never),
              },
              {
                text: 'لاحقاً',
                style: 'cancel',
                onPress: () => router.replace('/(tabs)/exams' as never),
              },
            ],
          });
        }
      } else {
        customAlertRef.current?.show({
          title: 'خطأ',
          message: 'تعذر بدء الامتحان',
          buttons: [{ text: 'حسناً', style: 'default', onPress: () => router.replace('/(tabs)/exams' as never) }],
        });
      }
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
      customAlertRef.current?.show({
        title: 'تنبيه',
        message: `يمكنك رفع ${maxImages} صور فقط${!hasPaid ? ' في الحساب المجاني' : ''}`,
        buttons: [{ text: 'حسناً', style: 'default' }],
      });
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
      
      const result = await submitExam(sId);
      
      router.replace({
        pathname: `/result/${sId}`,
        params: {
          streakCurrent: result.streak.current.toString(),
          streakBest: result.streak.best.toString(),
          isNewBest: result.streak.isNewBest ? '1' : '0',
          alreadyToday: result.streak.alreadyCompletedToday ? '1' : '0',
        },
      } as never);
    } catch {
      customAlertRef.current?.show({
        title: 'خطأ',
        message: 'تعذر تسليم الامتحان',
        buttons: [{ text: 'حسناً', style: 'default' }],
      });
    } finally {
      setSubmitting(false);
    }
  }

  function confirmSubmit() {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('هل أنت متأكد من تسليم الامتحان؟');
      if (confirmed) handleSubmit();
    } else {
      customAlertRef.current?.show({
        title: 'تسليم الامتحان',
        message: 'هل أنت متأكد من تسليم الامتحان؟',
        buttons: [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'تسليم', style: 'default', onPress: () => handleSubmit() },
        ],
      });
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
      <View style={[styles.topBar, { paddingHorizontal: pagePadding, paddingTop: hp(4), paddingBottom: hp(2) }]}>
        <View style={[styles.timerBox, { flexDirection: 'row', alignItems: 'center', gap: rs(6), backgroundColor: '#FFF7E6', paddingHorizontal: rs(12), paddingVertical: rs(6), borderRadius: rs(20) }]}>
          <Ionicons name="time-outline" size={rs(16)} color={timeLeft < 300 ? Colors.error : Colors.secondary} />
          <Text style={[styles.timerText, { fontSize: rs(15), color: timeLeft < 300 ? Colors.error : Colors.secondary }]}>
            {formatTime(timeLeft)}
          </Text>
        </View>
        <Text style={[styles.examTitleText, { fontSize: rs(14), flex: 1, textAlign: 'center', marginHorizontal: rs(8), color: Colors.white }]} numberOfLines={1}>{examTitle}</Text>
        <View style={{ width: rs(50) }} />
      </View>

      <View style={[styles.infoBar, { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: pagePadding, paddingVertical: rs(10) }]}>
        <Text style={[styles.counterText, { fontSize: rs(13), color: Colors.text.secondary }]}>
          سؤال {currentIndex + 1} من {questions.length}
        </Text>
        <Text style={[styles.degreeText, { fontSize: rs(13), color: Colors.primary }]}>
          الدرجة: {currentQuestion?.degree}
        </Text>
      </View>
      <View style={[styles.progressBar, { marginHorizontal: pagePadding, height: rs(4), borderRadius: rs(2), backgroundColor: Colors.border }]}>
        <View style={[styles.progressFill, { width: `${((currentIndex + 1) / questions.length) * 100}%`, height: '100%', backgroundColor: Colors.secondary, borderRadius: rs(2) }]} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: pagePadding, paddingVertical: rs(16) }}
      >
        <MotionView delay={80} style={[styles.questionBox, { padding: rs(16), borderRadius: rs(14), marginBottom: rs(16), backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, shadowColor: Colors.shadow, shadowOpacity: 0.02, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 2 }]}>
          <Text style={[styles.questionText, { fontSize: rs(16), color: Colors.text.primary, fontFamily: 'Tajawal_500Medium', lineHeight: 26, textAlign: 'right' }]}>{currentQuestion?.text}</Text>
        </MotionView>

        <Text style={[styles.answerLabel, { fontSize: rs(14), color: Colors.text.secondary, fontFamily: 'Tajawal_700Bold', marginBottom: rs(8) }]}>إجابتك</Text>
        <MotionView delay={120} style={[styles.answerContainer, { borderRadius: rs(12), marginBottom: rs(12), flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: rs(8), backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border }]}>
          <View style={[styles.iconWrapper, { width: rs(36), height: rs(36), borderRadius: rs(10), backgroundColor: Colors.primarySoft, justifyContent: 'center', alignItems: 'center', marginTop: rs(8) }]}>
            <Ionicons name="create-outline" size={rs(18)} color={Colors.primary} />
          </View>
          <TextInput
            style={[styles.answerInput, { fontSize: rs(15), minHeight: hp(20), padding: rs(14), flex: 1, textAlignVertical: 'top', textAlign: 'right', color: Colors.text.primary, fontFamily: 'Tajawal_500Medium' }]}
            placeholder="اكتب إجابتك هنا..."
            placeholderTextColor={Colors.text.disabled}
            multiline
            value={currentAnswer.text}
            onChangeText={(text) =>
              setAnswers(prev => ({
                ...prev,
                [currentQuestion.id]: { ...currentAnswer, text },
              }))
            }
          />
        </MotionView>

        <MotionView delay={160}>
          <PressableScale
            style={[styles.imageBtn, { paddingVertical: rs(12), paddingHorizontal: rs(14), borderRadius: rs(10), marginTop: rs(12), flexDirection: 'row', alignItems: 'center', gap: rs(8), backgroundColor: Colors.secondary }]}
            onPress={pickImage}
          >
            <Ionicons name="camera-outline" size={rs(20)} color={Colors.primary} />
            <Text style={[styles.imageBtnText, { fontSize: rs(14), flex: 1, color: Colors.primary, fontFamily: 'Tajawal_700Bold' }]}>
              رفع صورة ({currentAnswer.images.length}/{maxImages})
            </Text>
            {!hasPaid && (
              <View style={[styles.freeBadge, { paddingHorizontal: rs(8), paddingVertical: rs(3), borderRadius: rs(10), backgroundColor: Colors.primary }]}>
                <Text style={[styles.freeBadgeText, { fontSize: rs(11), color: Colors.white, fontFamily: 'Tajawal_700Bold' }]}>مجاني</Text>
              </View>
            )}
          </PressableScale>
        </MotionView>

        {currentAnswer.images.length > 0 && (
          <ScrollView horizontal style={{ marginTop: rs(10) }} showsHorizontalScrollIndicator={false}>
            {currentAnswer.images.map((img, i) => (
              <View key={i} style={{ marginLeft: rs(8), position: 'relative' }}>
                <Image
                  source={{ uri: img.uri }}
                  style={{ width: rs(80), height: rs(80), borderRadius: rs(8) }}
                />
                <TouchableOpacity
                  style={[styles.removeImg, { top: -rs(6), left: -rs(6), position: 'absolute', backgroundColor: Colors.white, borderRadius: rs(10) }]}
                  onPress={() => removeImage(currentQuestion.id, i)}
                >
                  <Ionicons name="close-circle" size={rs(20)} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        <TouchableOpacity
          style={[styles.reportBtn, { marginTop: rs(16), paddingVertical: rs(8), flexDirection: 'row', alignItems: 'center', gap: rs(6), alignSelf: 'flex-end' }]}
          onPress={() => router.push(`/exam/report?questionId=${currentQuestion?.id}` as never)}
        >
          <Ionicons name="flag-outline" size={rs(14)} color={Colors.text.disabled} />
          <Text style={[styles.reportText, { fontSize: rs(12), color: Colors.text.disabled, fontFamily: 'Tajawal_500Medium' }]}>أبلاغ عن مشكلة</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={[styles.navBar, { paddingHorizontal: pagePadding, paddingVertical: rs(12), flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border }]}>
        <View style={{ flex: 1, alignItems: 'flex-start' }}>
          {!isFirst && (
            <PressableScale
              style={[styles.navBtn, { paddingVertical: rs(10), paddingHorizontal: rs(16), borderRadius: rs(12), flexDirection: 'row', alignItems: 'center', gap: rs(6), backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border }]}
              onPress={() => setCurrentIndex(prev => prev - 1)}
            >
              <Ionicons name="chevron-forward" size={rs(18)} color={Colors.primary} />
              <Text style={[styles.navBtnText, { fontSize: rs(15), color: Colors.primary, fontFamily: 'Tajawal_700Bold' }]}>السابق</Text>
            </PressableScale>
          )}
        </View>

        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          {isLast ? (
            <PressableScale
              style={[styles.submitBtn, { paddingVertical: rs(12), paddingHorizontal: rs(20), borderRadius: rs(12), flexDirection: 'row', alignItems: 'center', gap: rs(6), backgroundColor: Colors.secondary }]}
              onPress={confirmSubmit}
            >
              <Text style={[styles.submitBtnText, { fontSize: rs(15), color: Colors.primary, fontFamily: 'Tajawal_700Bold' }]}>تسليم الامتحان</Text>
              <Ionicons name="checkmark-circle" size={rs(18)} color={Colors.primary} />
            </PressableScale>
          ) : (
            <PressableScale
              style={[styles.nextBtn, { paddingVertical: rs(12), paddingHorizontal: rs(20), borderRadius: rs(12), flexDirection: 'row', alignItems: 'center', gap: rs(6), backgroundColor: Colors.secondary }]}
              onPress={() => setCurrentIndex(prev => prev + 1)}
            >
              <Text style={[styles.nextBtnText, { fontSize: rs(15), color: Colors.primary, fontFamily: 'Tajawal_700Bold' }]}>التالي</Text>
              <Ionicons name="chevron-back" size={rs(18)} color={Colors.primary} />
            </PressableScale>
          )}
        </View>
      </View>

      <CustomAlert ref={customAlertRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  loadingText: { color: Colors.text.primary, fontFamily: 'Tajawal_700Bold' },
  loadingSubText: { color: Colors.text.secondary, fontFamily: 'Tajawal_500Medium' },
  
  topBar: { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timerBox: { backgroundColor: '#FFF7E6' },
  timerText: { fontFamily: 'Tajawal_700Bold' },
  examTitleText: { fontFamily: 'Tajawal_700Bold' },
  
  infoBar: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  counterText: { fontFamily: 'Tajawal_500Medium' },
  degreeText: { fontFamily: 'Tajawal_700Bold' },
  
  progressBar: { backgroundColor: Colors.border },
  progressFill: { backgroundColor: Colors.secondary },
  
  questionBox: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, shadowColor: Colors.shadow, shadowOpacity: 0.02, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  questionText: { fontFamily: 'Tajawal_500Medium' },
  answerLabel: { fontFamily: 'Tajawal_700Bold' },
  answerContainer: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border },
  iconWrapper: { backgroundColor: Colors.primarySoft, justifyContent: 'center', alignItems: 'center' },
  answerInput: { fontFamily: 'Tajawal_500Medium' },
  
  imageBtn: { backgroundColor: Colors.secondary },
  imageBtnText: { fontFamily: 'Tajawal_700Bold' },
  freeBadge: { backgroundColor: Colors.primary },
  freeBadgeText: { fontFamily: 'Tajawal_700Bold' },
  removeImg: { backgroundColor: Colors.white, borderRadius: 10 },
  
  reportBtn: {  },
  reportText: { fontFamily: 'Tajawal_500Medium' },
  
  navBar: { backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border },
  navBtn: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border },
  navBtnText: { fontFamily: 'Tajawal_700Bold' },
  nextBtn: { backgroundColor: Colors.secondary },
  nextBtnText: { fontFamily: 'Tajawal_700Bold' },
  submitBtn: { backgroundColor: Colors.secondary },
  submitBtnText: { fontFamily: 'Tajawal_700Bold' },
});