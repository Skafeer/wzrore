import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../../hooks/useResponsive';
import { Colors } from '../../constants/colors';
import { getResult } from '../../services/exam.service';
import { ExamResult, QuestionResult } from '../../types';
import { useAuthStore } from '../../store/auth.store';

export default function ResultScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { rs, hp, wp, isTablet, contentWidth } = useResponsive();
  const user = useAuthStore((s) => s.user);
  const paddingH = isTablet ? (wp(100) - contentWidth) / 2 : wp(5);

  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  const hasPaid = !!user?.subscription;

  useEffect(() => {
    getResult(sessionId!).then(setResult).finally(() => setLoading(false));
  }, []);

  function onPrint() {
    if (!hasPaid) {
      Alert.alert(
        'ميزة مدفوعة',
        'طباعة النتيجة متاحة للمشتركين فقط',
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'اشترك الآن', onPress: () => router.push('/profile/subscription' as never) },
        ]
      );
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingHorizontal: paddingH, paddingBottom: hp(4) }}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: hp(6), paddingBottom: hp(2) }]}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/' as never)}>
          <Ionicons name="home-outline" size={rs(24)} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: rs(18) }]}>نتيجة الامتحان</Text>
        <TouchableOpacity onPress={onPrint}>
          <Ionicons name="print-outline" size={rs(24)} color={hasPaid ? Colors.primary : Colors.text.disabled} />
        </TouchableOpacity>
      </View>

      {/* Score Card */}
      <View style={[styles.scoreCard, { padding: rs(24), borderRadius: rs(20), marginBottom: rs(20) }]}>
        <Text style={[styles.examTitle, { fontSize: rs(16), marginBottom: rs(16) }]}>
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
          {scorePct >= 80 ? '🌟 ممتاز!' : scorePct >= 60 ? '👍 جيد' : scorePct >= 50 ? '⚠️ مقبول' : '📚 تحتاج مراجعة'}
        </Text>

        <Text style={[styles.scoreDate, { fontSize: rs(12), marginTop: rs(8) }]}>
          {new Date(result.submittedAt).toLocaleDateString('ar-IQ')}
        </Text>
      </View>

      {/* Stats */}
      <View style={[styles.statsRow, { marginBottom: rs(20), gap: rs(12) }]}>
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
      </View>

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
          hp={hp}
        />
      ))}
    </ScrollView>
  );
}

function formatAnswer(text: string): string {
  if (!text) return '';
  // تحويل الأرقام المتتالية إلى أسطر منفصلة
  return text
    .replace(/\.\s*(\d+)\s*-\s*/g, '.\n$1- ')
    .replace(/^(\d+)\s*-\s*/gm, '$1- ')
    .trim();
}

function QuestionCard({
  question, index, expanded, onToggle, rs, hp,
}: {
  question: QuestionResult;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  rs: (n: number) => number;
  hp: (n: number) => number;
}) {
  const scorePct = question.degree > 0 ? (question.aiScore / question.degree) * 100 : 0;
  const scoreColor = scorePct >= 80 ? Colors.success : scorePct >= 50 ? Colors.warning : Colors.error;

  return (
    <TouchableOpacity
      style={[styles.questionCard, { borderRadius: rs(14), marginBottom: rs(12) }]}
      onPress={onToggle}
      activeOpacity={0.9}
    >
      {/* Question Header */}
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
          <Text style={[styles.qText, { fontSize: rs(14), marginRight: rs(10), flex: 1 }]} numberOfLines={expanded ? undefined : 2}>
            {question.questionText}
          </Text>
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

      {/* Expanded Content */}
      {expanded && (
        <View style={[styles.qBody, { padding: rs(14), paddingTop: 0 }]}>

          {/* Student Answer */}
          <View style={[styles.answerSection, { padding: rs(12), borderRadius: rs(10), marginBottom: rs(10) }]}>
            <Text style={[styles.answerSectionTitle, { fontSize: rs(13), marginBottom: rs(8) }]}>
              ✍️ إجابتك
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
            {/* Student Images */}
            {question.studentImages?.length > 0 && (
              <View style={{ marginTop: rs(10) }}>
                <Text style={[styles.answerSectionTitle, { fontSize: rs(12), marginBottom: rs(6) }]}>
                  📷 الصور المرفقة
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

          {/* Model Answer */}
          <View style={[styles.modelSection, { padding: rs(12), borderRadius: rs(10), marginBottom: rs(10) }]}>
            <Text style={[styles.modelSectionTitle, { fontSize: rs(13), marginBottom: rs(8) }]}>
              ✅ الإجابة النموذجية
            </Text>
            <Text style={[styles.modelText, { fontSize: rs(14) }]}>
              {formatAnswer(question.modelAnswer)}
            </Text>
            {/* Model Images */}
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

          {/* AI Feedback */}
          <View style={[styles.feedbackSection, { padding: rs(12), borderRadius: rs(10) }]}>
            <Text style={[styles.feedbackTitle, { fontSize: rs(13), marginBottom: rs(8) }]}>
              🤖 تحليل الذكاء الاصطناعي
            </Text>
            <Text style={[styles.feedbackText, { fontSize: rs(14) }]}>
              {question.aiFeedback}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  loadingText: { color: Colors.text.primary, fontWeight: '600' },
  errorText: { color: Colors.error },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: Colors.text.primary, fontWeight: 'bold' },
  scoreCard: { backgroundColor: Colors.white, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 },
  examTitle: { color: Colors.text.secondary, textAlign: 'center' },
  circleScore: { justifyContent: 'center', alignItems: 'center' },
  scoreNum: { fontWeight: 'bold' },
  scoreMax: { color: Colors.text.secondary },
  scorePct: { fontWeight: 'bold' },
  scoreLabel: { color: Colors.text.secondary },
  scoreDate: { color: Colors.text.disabled },
  statsRow: { flexDirection: 'row' },
  statCard: { flex: 1, backgroundColor: Colors.white, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6 },
  statNum: { fontWeight: 'bold' },
  statLabel: { color: Colors.text.secondary, marginTop: 4, textAlign: 'center' },
  sectionTitle: { color: Colors.text.primary, fontWeight: 'bold' },
  questionCard: { backgroundColor: Colors.white, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, overflow: 'hidden' },
  qHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  qHeaderLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
  qHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qNum: { justifyContent: 'center', alignItems: 'center' },
  qNumText: { fontWeight: 'bold' },
  qText: { color: Colors.text.primary, textAlign: 'right' },
  qScore: { fontWeight: 'bold' },
  qBody: {},
  answerSection: { backgroundColor: '#F0FDF4' },
  answerSectionTitle: { color: Colors.success, fontWeight: '600' },
  answerText: { color: Colors.text.primary, textAlign: 'right', lineHeight: 24 },
  modelSection: { backgroundColor: '#EFF6FF' },
  modelSectionTitle: { color: Colors.primary, fontWeight: '600' },
  modelText: { color: Colors.text.primary, textAlign: 'right', lineHeight: 24 },
  feedbackSection: { backgroundColor: '#FFFBEB' },
  feedbackTitle: { color: Colors.warning, fontWeight: '600' },
  feedbackText: { color: Colors.text.primary, textAlign: 'right', lineHeight: 24 },
});