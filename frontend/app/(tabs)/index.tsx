import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth.store';
import { getLastExam, getPerformance } from '../../services/exam.service';
import { useResponsive } from '../../hooks/useResponsive';
import { Colors } from '../../constants/colors';
import { LastExam, PerformanceSummary } from '../../types';

export default function HomeScreen() {
  const { rs, hp, isTablet, contentWidth, wp } = useResponsive();
  const user = useAuthStore((s) => s.user);

  const [lastExam, setLastExam] = useState<LastExam | null>(null);
  const [performance, setPerformance] = useState<PerformanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    try {
      const [last, perf] = await Promise.all([getLastExam(), getPerformance()]);
      setLastExam(last);
      setPerformance(perf);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const paddingH = isTablet ? (wp(100) - contentWidth) / 2 : wp(5);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingHorizontal: paddingH, paddingBottom: hp(4) }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: hp(6), paddingBottom: hp(2) }]}>
        <View>
          <Text style={[styles.welcome, { fontSize: rs(14) }]}>مرحباً 👋</Text>
          <Text style={[styles.name, { fontSize: rs(22) }]}>{user?.name}</Text>
          <Text style={[styles.motivate, { fontSize: rs(13) }]}>مستعد تختبر نفسك اليوم؟</Text>
        </View>
        <View style={[styles.avatarBox, { width: rs(48), height: rs(48) }]}>
          <Ionicons name="person" size={rs(24)} color={Colors.primary} />
        </View>
      </View>

      {/* Study Streak */}
      <View style={[styles.streakCard, { padding: rs(16), marginBottom: rs(16) }]}>
        <View style={styles.streakRow}>
          <Text style={[styles.streakEmoji, { fontSize: rs(28) }]}>🔥</Text>
          <View style={{ marginRight: rs(12) }}>
            <Text style={[styles.streakNum, { fontSize: rs(28) }]}>{user?.studyStreak ?? 0}</Text>
            <Text style={[styles.streakLabel, { fontSize: rs(12) }]}>يوم متواصل</Text>
          </View>
        </View>
        <Text style={[styles.streakMsg, { fontSize: rs(13) }]}>
          {(user?.studyStreak ?? 0) > 0
            ? `رائع! حافظ على سلسلتك 💪`
            : 'ابدأ سلسلتك اليوم!'}
        </Text>
      </View>

      {/* Start Exam Card */}
      <TouchableOpacity
        style={[styles.startCard, { padding: rs(20), marginBottom: rs(16) }]}
        onPress={() => router.push('/(tabs)/exams')}
      >
        <View style={styles.startRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.startTitle, { fontSize: rs(18) }]}>ابدأ اختبار جديد</Text>
            <Text style={[styles.startDesc, { fontSize: rs(13) }]}>اختر المادة وابدأ الامتحان الآن</Text>
          </View>
          <View style={[styles.startIcon, { width: rs(48), height: rs(48), borderRadius: rs(24) }]}>
            <Ionicons name="play" size={rs(22)} color={Colors.primary} />
          </View>
        </View>
        <View style={[styles.startBtn, { paddingVertical: rs(10), marginTop: rs(14), borderRadius: rs(10) }]}>
          <Text style={[styles.startBtnText, { fontSize: rs(15) }]}>ابدأ الآن</Text>
        </View>
      </TouchableOpacity>

      {/* Last Exam */}
      {lastExam && (
        <View style={[styles.card, { padding: rs(16), marginBottom: rs(16) }]}>
          <Text style={[styles.cardTitle, { fontSize: rs(15), marginBottom: rs(12) }]}>آخر اختبار</Text>
          <View style={styles.lastExamRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.lastExamSubject, { fontSize: rs(16) }]}>{lastExam.subject}</Text>
              <Text style={[styles.lastExamTitle, { fontSize: rs(13) }]}>{lastExam.examTitle}</Text>
              <Text style={[styles.lastExamDate, { fontSize: rs(12) }]}>
                {new Date(lastExam.submittedAt).toLocaleDateString('ar-IQ')}
              </Text>
            </View>
            <View style={[styles.scoreBadge, { padding: rs(10), borderRadius: rs(12) }]}>
              <Text style={[styles.scoreText, { fontSize: rs(20) }]}>
                {lastExam.totalScore?.toFixed(0)}
              </Text>
              <Text style={[styles.scoreMax, { fontSize: rs(12) }]}>/ {lastExam.maxScore}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.viewBtn, { marginTop: rs(12), paddingVertical: rs(8), borderRadius: rs(8) }]}
            onPress={() => router.push(`/result/${lastExam.sessionId}` as never)}
          >
            <Text style={[styles.viewBtnText, { fontSize: rs(13) }]}>عرض النتيجة</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Performance */}
      {performance && (
        <View style={[styles.card, { padding: rs(16) }]}>
          <Text style={[styles.cardTitle, { fontSize: rs(15), marginBottom: rs(12) }]}>ملخص الأداء</Text>
          <View style={styles.perfRow}>
            <View style={[styles.perfItem, { padding: rs(16), borderRadius: rs(12) }]}>
              <Text style={[styles.perfNum, { fontSize: rs(28) }]}>{performance.totalExams}</Text>
              <Text style={[styles.perfLabel, { fontSize: rs(12) }]}>امتحان مكتمل</Text>
            </View>
            <View style={[styles.perfItem, { padding: rs(16), borderRadius: rs(12) }]}>
              <Text style={[styles.perfNum, { fontSize: rs(28) }]}>{performance.avgScore}%</Text>
              <Text style={[styles.perfLabel, { fontSize: rs(12) }]}>متوسط الدرجات</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcome: { color: Colors.text.secondary },
  name: { color: Colors.text.primary, fontWeight: 'bold' },
  motivate: { color: Colors.text.secondary, marginTop: 2 },
  avatarBox: { backgroundColor: Colors.border, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  streakCard: { backgroundColor: Colors.primary, borderRadius: 16 },
  streakRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  streakEmoji: {},
  streakNum: { color: Colors.secondary, fontWeight: 'bold' },
  streakLabel: { color: Colors.white, opacity: 0.8 },
  streakMsg: { color: Colors.white },
  startCard: { backgroundColor: Colors.white, borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 },
  startRow: { flexDirection: 'row', alignItems: 'center' },
  startTitle: { color: Colors.text.primary, fontWeight: 'bold' },
  startDesc: { color: Colors.text.secondary, marginTop: 4 },
  startIcon: { backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  startBtn: { backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  startBtnText: { color: Colors.white, fontWeight: 'bold' },
  card: { backgroundColor: Colors.white, borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6 },
  cardTitle: { color: Colors.text.primary, fontWeight: 'bold' },
  lastExamRow: { flexDirection: 'row', alignItems: 'center' },
  lastExamSubject: { color: Colors.text.primary, fontWeight: 'bold' },
  lastExamTitle: { color: Colors.text.secondary, marginTop: 2 },
  lastExamDate: { color: Colors.text.disabled, marginTop: 4 },
  scoreBadge: { backgroundColor: Colors.background, alignItems: 'center' },
  scoreText: { color: Colors.primary, fontWeight: 'bold' },
  scoreMax: { color: Colors.text.secondary },
  viewBtn: { backgroundColor: Colors.background, alignItems: 'center' },
  viewBtnText: { color: Colors.primary, fontWeight: '600' },
  perfRow: { flexDirection: 'row', gap: 12 },
  perfItem: { flex: 1, backgroundColor: Colors.background, alignItems: 'center' },
  perfNum: { color: Colors.primary, fontWeight: 'bold' },
  perfLabel: { color: Colors.text.secondary, marginTop: 4, textAlign: 'center' },
});