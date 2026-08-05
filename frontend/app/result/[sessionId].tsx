import { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../../hooks/useResponsive';
import { Colors } from '../../constants/colors';
import { getResult } from '../../services/exam.service';
import { ExamResult, QuestionResult } from '../../types';
import { useAuthStore } from '../../store/auth.store';
import { MotionView, PressableScale } from '../../components/motion';
import CustomAlert, { CustomAlertRef } from '../../components/CustomAlert';
import RichTextDisplay from '../../components/RichTextDisplay';

export default function ResultScreen() {
  const { sessionId, streakCurrent, streakBest, isNewBest, alreadyToday } = useLocalSearchParams<{
    sessionId: string;
    streakCurrent?: string;
    streakBest?: string;
    isNewBest?: string;
    alreadyToday?: string;
  }>();
  const { rs, hp, pagePadding, isTablet } = useResponsive();
  const user = useAuthStore((s) => s.user);
  const customAlertRef = useRef<CustomAlertRef>(null);

  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedQ, setExpandedQ] = useState<string | null>(null);
  const [showStreakPopup, setShowStreakPopup] = useState(false);
  const [showBestPopup, setShowBestPopup] = useState(false);

  const hasPaid = !!user?.subscription;

  useEffect(() => {
    getResult(sessionId!).then(setResult).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (streakCurrent && alreadyToday !== '1') {
      setTimeout(() => {
        if (isNewBest === '1') {
          setShowBestPopup(true);
        } else {
          setShowStreakPopup(true);
        }
      }, 1000);
    }
  }, []);

  function getStreakMessage(streak: number): string {
    if (streak >= 100) return 'أنت من أكثر الطلاب التزاماً';
    if (streak >= 60) return 'إنجاز رائع، استمر بنفس الوتيرة';
    if (streak >= 30) return 'شهر كامل من الاستمرارية';
    if (streak >= 14) return 'مستواك يتحسن يوماً بعد يوم';
    if (streak >= 7) return 'أسبوع كامل من الالتزام';
    if (streak >= 3) return 'استمر، أنت تبني عادة دراسة حقيقية';
    return 'بداية ممتازة';
  }

  function onPrint() {
    if (!hasPaid) {
      customAlertRef.current?.show({
        title: 'ميزة مدفوعة',
        message: 'طباعة النتيجة متاحة للمشتركين فقط',
        buttons: [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'اشترك الآن', style: 'default', onPress: () => router.push('/profile/subscription' as never) },
        ],
      });
      return;
    }
  }

  function getScoreColor(score: number, max: number) {
    const pct = max > 0 ? (score / max) * 100 : 0;
    if (pct >= 80) return Colors.success;
    if (pct >= 50) return Colors.warning;
    return Colors.error;
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.loadingText, { fontSize: rs(14), marginTop: rs(12) }]}>
          جاري تحميل النتيجة...
        </Text>
      </View>
    );
  }

  if (!result) {
    return (
      <View style={styles.center}>
        <Text style={[styles.errorText, { fontSize: rs(15) }]}>تعذر تحميل النتيجة</Text>
      </View>
    );
  }

  const scoreColor = getScoreColor(result.totalScore ?? 0, result.maxScore ?? 1);
  const scorePct = result.maxScore > 0
    ? Math.round(((result.totalScore ?? 0) / result.maxScore) * 100)
    : 0;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingHorizontal: pagePadding, paddingBottom: hp(4) }}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: hp(6), paddingBottom: hp(2) }]}>
          <TouchableOpacity onPress={() => router.replace('/(tabs)/' as never)}>
            <View style={[styles.iconBox, { width: rs(40), height: rs(40), borderRadius: rs(12), backgroundColor: Colors.primarySoft, justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="home-outline" size={rs(18)} color={Colors.primary} />
            </View>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { fontSize: rs(18) }]}>نتيجة الامتحان</Text>
          <TouchableOpacity onPress={onPrint}>
            <View style={[styles.iconBox, { width: rs(40), height: rs(40), borderRadius: rs(12), backgroundColor: hasPaid ? Colors.primarySoft : Colors.disabled, justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="print-outline" size={rs(18)} color={hasPaid ? Colors.primary : Colors.text.disabled} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Score Card */}
        <MotionView delay={80} style={[styles.scoreCard, { padding: rs(24), borderRadius: rs(20), marginBottom: rs(20) }]}>
          <View style={[styles.scoreCardBorder, { height: rs(4), left: 0, right: 0, borderTopLeftRadius: rs(20), borderTopRightRadius: rs(20), backgroundColor: Colors.secondary }]} />

          <Text style={[styles.examTitle, { fontSize: rs(16), marginTop: rs(16), marginBottom: rs(16) }]}>
            {result.examTitle}
          </Text>

          <View style={[styles.circleScore, {
            width: rs(120), height: rs(120), borderRadius: rs(60),
            borderWidth: rs(8), borderColor: scoreColor, marginBottom: rs(16),
          }]}>
            <Text style={[styles.scoreNum, { fontSize: rs(32), color: scoreColor }]}>
              {result.totalScore?.toFixed(1)}
            </Text>
            <Text style={[styles.scoreMax, { fontSize: rs(14) }]}>/ {result.maxScore}</Text>
          </View>

          <Text style={[styles.scorePct, { fontSize: rs(20), color: scoreColor }]}>
            {scorePct}%
          </Text>

          <Text style={[styles.scoreLabel, { fontSize: rs(14), marginTop: rs(8) }]}>
            {scorePct >= 80 ? 'ممتاز' : scorePct >= 60 ? 'جيد' : scorePct >= 50 ? 'مقبول' : 'تحتاج مراجعة'}
          </Text>

          <Text style={[styles.scoreDate, { fontSize: rs(12), marginTop: rs(8) }]}>
            {new Date(result.submittedAt).toLocaleDateString('ar-IQ')}
          </Text>
        </MotionView>

        {/* Stats */}
        <MotionView delay={140} style={[styles.statsRow, { marginBottom: rs(20), gap: rs(12) }, !isTablet && styles.statsRowMobile]}>
          <View style={[styles.statCard, { padding: rs(16), borderRadius: rs(14) }]}>
            <Text style={[styles.statNum, { fontSize: rs(22), color: Colors.success }]}>
              {result.questions.filter(q => q.aiScore >= q.degree * 0.5).length}
            </Text>
            <Text style={[styles.statLabel, { fontSize: rs(12) }]}>إجابات صحيحة</Text>
          </View>
          <View style={[styles.statCard, { padding: rs(16), borderRadius: rs(14) }]}>
            <Text style={[styles.statNum, { fontSize: rs(22), color: Colors.error }]}>
              {result.questions.filter(q => q.aiScore < q.degree * 0.5).length}
            </Text>
            <Text style={[styles.statLabel, { fontSize: rs(12) }]}>تحتاج مراجعة</Text>
          </View>
          <View style={[styles.statCard, { padding: rs(16), borderRadius: rs(14) }]}>
            <Text style={[styles.statNum, { fontSize: rs(22), color: Colors.primary }]}>
              {result.questions.length}
            </Text>
            <Text style={[styles.statLabel, { fontSize: rs(12) }]}>عدد الأسئلة</Text>
          </View>
        </MotionView>

        {/* Questions Detail */}
        <Text style={[styles.sectionTitle, { fontSize: rs(16), marginBottom: rs(12) }]}>
          تفصيل الأسئلة
        </Text>

        {result.questions.map((q, index) => (
          <QuestionCard
            key={q.questionId}
            question={q}
            index={index}
            expanded={expandedQ === q.questionId}
            onToggle={() => setExpandedQ(expandedQ === q.questionId ? null : q.questionId)}
            rs={rs}
          />
        ))}
      </ScrollView>

      {/* Streak Popup */}
      {showStreakPopup && (
        <View style={styles.popupOverlay}>
          <View style={[styles.popupBox, { padding: rs(28), borderRadius: rs(24), margin: rs(24) }]}>
            <Ionicons name="flame" size={rs(48)} color={Colors.secondary} />
            <Text style={[styles.popupTitle, { fontSize: rs(22), marginTop: rs(12) }]}>
              تم الحفاظ على سلسلة الدراسة!
            </Text>
            <Text style={[styles.popupStreak, { fontSize: rs(48), marginTop: rs(8) }]}>
              {streakCurrent}
            </Text>
            <Text style={[styles.popupSub, { fontSize: rs(14) }]}>يوم متواصل</Text>
            <Text style={[styles.popupMsg, { fontSize: rs(14), marginTop: rs(8) }]}>
              {getStreakMessage(parseInt(streakCurrent ?? '0'))}
            </Text>
            <TouchableOpacity
              style={[styles.popupBtn, { marginTop: rs(20), paddingVertical: rs(14), borderRadius: rs(14), backgroundColor: Colors.secondary }]}
              onPress={() => setShowStreakPopup(false)}
            >
              <Text style={[styles.popupBtnText, { fontSize: rs(16), color: Colors.primary }]}>ممتاز</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* New Best Popup */}
      {showBestPopup && (
        <View style={styles.popupOverlay}>
          <View style={[styles.popupBox, { padding: rs(28), borderRadius: rs(24), margin: rs(24) }]}>
            <Ionicons name="trophy" size={rs(48)} color={Colors.secondary} />
            <Text style={[styles.popupTitle, { fontSize: rs(22), marginTop: rs(12) }]}>
              رقم قياسي جديد!
            </Text>
            <Text style={[styles.popupStreak, { fontSize: rs(48), marginTop: rs(8), color: Colors.secondary }]}>
              {streakBest}
            </Text>
            <Text style={[styles.popupSub, { fontSize: rs(14) }]}>أفضل سلسلة دراسة لديك</Text>
            <Text style={[styles.popupMsg, { fontSize: rs(14), marginTop: rs(8) }]}>
              استمر في التقدم
            </Text>
            <TouchableOpacity
              style={[styles.popupBtn, { marginTop: rs(20), paddingVertical: rs(14), borderRadius: rs(14), backgroundColor: Colors.secondary }]}
              onPress={() => { setShowBestPopup(false); setShowStreakPopup(true); }}
            >
              <Text style={[styles.popupBtnText, { fontSize: rs(16), color: Colors.primary }]}>رائع</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <CustomAlert ref={customAlertRef} />
    </View>
  );
}

function formatAnswer(text: string): string {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/([.!؟])\s*(\d+\s*[-–])/g, '$1\n$2')
    .trim();
}

function QuestionCard({
  question, index, expanded, onToggle, rs,
}: {
  question: QuestionResult;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  rs: (n: number) => number;
}) {
  const scorePct = question.degree > 0 ? (question.aiScore / question.degree) * 100 : 0;
  const scoreColor = scorePct >= 80 ? Colors.success : scorePct >= 50 ? Colors.warning : Colors.error;

  return (
    <PressableScale
      style={[styles.questionCard, { borderRadius: rs(14), marginBottom: rs(12) }]}
      onPress={onToggle}
    >
      <View style={[styles.qHeader, { padding: rs(14) }]}>
        <View style={styles.qHeaderLeft}>
          <View style={[styles.qNum, {
            width: rs(30), height: rs(30), borderRadius: rs(15),
            backgroundColor: scoreColor + '20',
          }]}>
            <Text style={[styles.qNumText, { fontSize: rs(13), color: scoreColor }]}>
              {index + 1}
            </Text>
          </View>

          {expanded && question.richContent && question.richContent.length > 0 ? (
            <View style={{ marginRight: rs(10), flex: 1 }}>
              <RichTextDisplay
                richContent={question.richContent}
                fallbackText={question.questionText}
                fontSize={rs(14)}
              />
            </View>
          ) : (
            <Text style={[styles.qText, { fontSize: rs(14), marginRight: rs(10), flex: 1 }]} numberOfLines={expanded ? undefined : 2}>
              {question.questionText}
            </Text>
          )}
        </View>
        <View style={styles.qHeaderRight}>
          <Text style={[styles.qScore, { fontSize: rs(15), color: scoreColor }]}>
            {question.aiScore.toFixed(1)}/{question.degree}
          </Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={rs(18)}
            color={Colors.text.secondary}
          />
        </View>
      </View>

      {expanded && (
        <View style={[styles.qBody, { padding: rs(14), paddingTop: 0 }]}>
          <View style={[styles.answerSection, { padding: rs(12), borderRadius: rs(10), marginBottom: rs(10) }]}>
            <Text style={[styles.answerSectionTitle, { fontSize: rs(13), marginBottom: rs(8) }]}>
              إجابتك
            </Text>
            {question.studentAnswer ? (
              <Text style={[styles.answerText, { fontSize: rs(14) }]}>
                {formatAnswer(question.studentAnswer)}
              </Text>
            ) : (
              <Text style={[styles.answerText, { fontSize: rs(14), color: Colors.text.disabled }]}>
                لم تكتب إجابة نصية
              </Text>
            )}
            {question.studentImages?.length > 0 && (
              <View style={{ marginTop: rs(10) }}>
                <Text style={[styles.answerSectionTitle, { fontSize: rs(12), marginBottom: rs(6) }]}>
                  الصور المرفقة
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {question.studentImages.map((img, i) => (
                    <Image
                      key={i}
                      source={{ uri: img }}
                      style={{ width: rs(120), height: rs(120), borderRadius: rs(8), marginLeft: rs(8) }}
                      resizeMode="contain"
                    />
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={[styles.modelSection, { padding: rs(12), borderRadius: rs(10), marginBottom: rs(10) }]}>
            <Text style={[styles.modelSectionTitle, { fontSize: rs(13), marginBottom: rs(8) }]}>
              الإجابة النموذجية
            </Text>
            <RichTextDisplay
              richContent={question.richModelAnswer}
              fallbackText={formatAnswer(question.modelAnswer)}
              fontSize={rs(14)}
            />
            {question.modelImages?.length > 0 && (
              <View style={{ marginTop: rs(10) }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {question.modelImages.map((img, i) => (
                    <Image
                      key={i}
                      source={{ uri: img }}
                      style={{ width: rs(120), height: rs(120), borderRadius: rs(8), marginLeft: rs(8) }}
                      resizeMode="contain"
                    />
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={[styles.feedbackSection, { padding: rs(12), borderRadius: rs(10) }]}>
            <Text style={[styles.feedbackTitle, { fontSize: rs(13), marginBottom: rs(8) }]}>
              تحليل الذكاء الاصطناعي
            </Text>
            <View>
              <Text selectable style={[styles.feedbackText, { fontSize: rs(14), writingDirection: 'rtl' }]}>
                {formatAnswer(question.aiFeedback)}
              </Text>
            </View>
          </View>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  loadingText: { color: Colors.text.primary, fontFamily: 'Tajawal_700Bold' },
  errorText: { color: Colors.error, fontFamily: 'Tajawal_500Medium' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: Colors.text.primary, fontFamily: 'Tajawal_800ExtraBold' },
  iconBox: { justifyContent: 'center', alignItems: 'center' },

  scoreCard: {
    backgroundColor: Colors.white,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.02,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    overflow: 'hidden',
  },
  scoreCardBorder: {
    position: 'absolute',
    top: 0,
    backgroundColor: Colors.secondary,
  },
  examTitle: { color: Colors.text.secondary, textAlign: 'center', fontFamily: 'Tajawal_500Medium' },
  circleScore: { justifyContent: 'center', alignItems: 'center' },
  scoreNum: { fontFamily: 'Tajawal_800ExtraBold' },
  scoreMax: { color: Colors.text.secondary, fontFamily: 'Tajawal_500Medium' },
  scorePct: { fontFamily: 'Tajawal_700Bold' },
  scoreLabel: { color: Colors.text.secondary, fontFamily: 'Tajawal_500Medium' },
  scoreDate: { color: Colors.text.disabled, fontFamily: 'Tajawal_500Medium' },

  statsRow: { flexDirection: 'row' },
  statsRowMobile: { flexDirection: 'column' },
  statCard: { flex: 1, backgroundColor: Colors.white, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, shadowColor: Colors.shadow, shadowOpacity: 0.02, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  statNum: { fontFamily: 'Tajawal_800ExtraBold' },
  statLabel: { color: Colors.text.secondary, marginTop: 4, textAlign: 'center', fontFamily: 'Tajawal_500Medium' },
  sectionTitle: { color: Colors.text.primary, fontFamily: 'Tajawal_700Bold' },
  questionCard: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, shadowColor: Colors.shadow, shadowOpacity: 0.02, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 2, overflow: 'hidden' },
  qHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  qHeaderLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
  qHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qNum: { justifyContent: 'center', alignItems: 'center' },
  qNumText: { fontFamily: 'Tajawal_700Bold' },
  qText: { color: Colors.text.primary, textAlign: 'right', fontFamily: 'Tajawal_500Medium' },
  qScore: { fontFamily: 'Tajawal_700Bold' },
  qBody: {},
  answerSection: { backgroundColor: '#F0FDF4' },
  answerSectionTitle: { color: Colors.success, fontFamily: 'Tajawal_700Bold' },
  answerText: { color: Colors.text.primary, textAlign: 'right', lineHeight: 30, writingDirection: 'rtl', flexWrap: 'wrap', fontFamily: 'Tajawal_500Medium' },
  modelSection: { backgroundColor: '#EFF6FF' },
  modelSectionTitle: { color: Colors.primary, fontFamily: 'Tajawal_700Bold' },
  modelText: { color: Colors.text.primary, textAlign: 'right', lineHeight: 30, writingDirection: 'rtl', flexWrap: 'wrap', fontFamily: 'Tajawal_500Medium' },
  feedbackSection: { backgroundColor: '#FFFBEB' },
  feedbackTitle: { color: Colors.warning, fontFamily: 'Tajawal_700Bold' },
  feedbackText: { color: Colors.text.primary, textAlign: 'right', lineHeight: 30, writingDirection: 'rtl', flexWrap: 'wrap', fontFamily: 'Tajawal_500Medium' },
  popupOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  popupBox: { backgroundColor: Colors.white, alignItems: 'center', width: '100%', elevation: 10, shadowColor: Colors.shadow, shadowOpacity: 0.1, shadowRadius: 24, shadowOffset: { width: 0, height: 8 } },
  popupTitle: { color: Colors.text.primary, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'center' },
  popupStreak: { color: Colors.primary, fontFamily: 'Tajawal_800ExtraBold' },
  popupSub: { color: Colors.text.secondary, fontFamily: 'Tajawal_500Medium' },
  popupMsg: { color: Colors.text.secondary, textAlign: 'center', fontFamily: 'Tajawal_500Medium' },
  popupBtn: { width: '100%', alignItems: 'center' },
  popupBtnText: { fontFamily: 'Tajawal_700Bold' },
});