import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, Animated, Image,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth.store';
import { getLastExam, getPerformance } from '../../services/exam.service';
import { getProfile } from '../../services/user.service';
import { useResponsive } from '../../hooks/useResponsive';
import { Colors } from '../../constants/colors';
import { LastExam, PerformanceSummary } from '../../types';
import { MotionView, PressableScale } from '../../components/motion';

function getStreakMessage(streak: number, completedToday: boolean): string {
  if (completedToday) return 'تم الحفاظ على السلسلة اليوم';
  if (streak === 0) return 'ابدأ سلسلتك اليوم!';
  if (streak >= 100) return 'أنت من أكثر الطلاب التزاماً';
  if (streak >= 30) return 'شهر كامل من الاستمرارية';
  if (streak >= 7) return 'أسبوع كامل من الالتزام';
  if (streak >= 3) return 'استمر، أنت تبني عادة دراسة حقيقية';
  return 'بقي امتحان واحد للحفاظ على السلسلة اليوم';
}

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'صباح النشاط،';
  if (hour >= 12 && hour < 18) return 'مساء النشاط،';
  return 'طاب مساؤك،';
}

function HomeSkeleton({ rs, hp, pagePadding }: {
  rs: (size: number) => number;
  hp: (size: number) => number;
  pagePadding: number;
}) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ paddingHorizontal: pagePadding, paddingBottom: hp(4) }}
    >
      <Animated.View style={[styles.header, { paddingTop: rs(25), paddingBottom: hp(2), opacity }]}>
        <View>
          <View style={{ width: rs(80), height: rs(14), backgroundColor: Colors.border, borderRadius: rs(4), marginBottom: rs(4) }} />
          <View style={{ width: rs(120), height: rs(24), backgroundColor: Colors.border, borderRadius: rs(4) }} />
        </View>
        <View style={{ width: rs(48), height: rs(48), backgroundColor: Colors.border, borderRadius: rs(24) }} />
      </Animated.View>

      <Animated.View style={[styles.streakCard, { marginBottom: rs(24), padding: rs(24), paddingBottom: rs(20), opacity }]}>
        <View style={styles.streakTop}>
          <View style={styles.streakLeft}>
            <View style={{ width: rs(44), height: rs(44), backgroundColor: Colors.border, borderRadius: rs(14) }} />
            <View style={{ marginRight: rs(14) }}>
              <View style={{ width: rs(60), height: rs(28), backgroundColor: Colors.border, borderRadius: rs(4), marginBottom: rs(6) }} />
              <View style={{ width: rs(80), height: rs(12), backgroundColor: Colors.border, borderRadius: rs(4) }} />
            </View>
          </View>
          <View style={{ width: rs(60), height: rs(30), backgroundColor: Colors.border, borderRadius: rs(30) }} />
        </View>
        <View style={{ width: '80%', height: rs(10), backgroundColor: Colors.border, borderRadius: rs(4), marginBottom: rs(14), marginTop: rs(4) }} />
        <View style={{ width: '100%', height: rs(4), backgroundColor: Colors.border, borderRadius: rs(4) }} />
      </Animated.View>

      <Animated.View style={[styles.card, { padding: rs(24), marginBottom: rs(20), opacity }]}>
        <View style={styles.cardHeader}>
          <View>
            <View style={{ width: rs(120), height: rs(16), backgroundColor: Colors.border, borderRadius: rs(4), marginBottom: rs(4) }} />
            <View style={{ width: rs(160), height: rs(12), backgroundColor: Colors.border, borderRadius: rs(4) }} />
          </View>
          <View style={{ width: rs(40), height: rs(40), backgroundColor: Colors.border, borderRadius: rs(12) }} />
        </View>
        <View style={{ width: '100%', height: rs(44), backgroundColor: Colors.border, borderRadius: rs(14), marginTop: rs(16) }} />
      </Animated.View>

      <Animated.View style={[styles.card, { padding: rs(24), marginBottom: rs(20), opacity }]}>
        <View style={[styles.cardHeader, { marginBottom: rs(14) }]}>
          <View style={{ width: rs(100), height: rs(16), backgroundColor: Colors.border, borderRadius: rs(4) }} />
          <View style={{ width: rs(36), height: rs(36), backgroundColor: Colors.border, borderRadius: rs(10) }} />
        </View>
        <View style={styles.examRow}>
          <View style={{ flex: 1 }}>
            <View style={{ width: '60%', height: rs(16), backgroundColor: Colors.border, borderRadius: rs(4), marginBottom: rs(6) }} />
            <View style={{ width: '80%', height: rs(12), backgroundColor: Colors.border, borderRadius: rs(4), marginBottom: rs(4) }} />
            <View style={{ width: '40%', height: rs(10), backgroundColor: Colors.border, borderRadius: rs(4) }} />
          </View>
          <View style={{ width: rs(70), height: rs(52), backgroundColor: Colors.border, borderRadius: rs(14) }} />
        </View>
        <View style={{ width: '100%', height: rs(40), backgroundColor: Colors.border, borderRadius: rs(14), marginTop: rs(16) }} />
      </Animated.View>

      <Animated.View style={[styles.card, { padding: rs(24), opacity }]}>
        <View style={[styles.cardHeader, { marginBottom: rs(16) }]}>
          <View style={{ width: rs(100), height: rs(16), backgroundColor: Colors.border, borderRadius: rs(4) }} />
          <View style={{ width: rs(36), height: rs(36), backgroundColor: Colors.border, borderRadius: rs(10) }} />
        </View>
        <View style={styles.perfGrid}>
          <View style={[styles.perfBox, { padding: rs(20), borderRadius: rs(16) }]}>
            <View style={[styles.perfBoxBorder, { height: rs(3), left: rs(20), right: rs(20), backgroundColor: Colors.border }]} />
            <View style={{ width: rs(40), height: rs(28), backgroundColor: Colors.border, borderRadius: rs(4), marginBottom: rs(4) }} />
            <View style={{ width: rs(80), height: rs(12), backgroundColor: Colors.border, borderRadius: rs(4) }} />
          </View>
          <View style={[styles.perfBox, { padding: rs(20), borderRadius: rs(16) }]}>
            <View style={[styles.perfBoxBorder, { height: rs(3), left: rs(20), right: rs(20), backgroundColor: Colors.border }]} />
            <View style={{ width: rs(40), height: rs(28), backgroundColor: Colors.border, borderRadius: rs(4), marginBottom: rs(4) }} />
            <View style={{ width: rs(80), height: rs(12), backgroundColor: Colors.border, borderRadius: rs(4) }} />
          </View>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

export default function HomeScreen() {
  const { rs, hp, pagePadding } = useResponsive();
  const { user, updateUser } = useAuthStore();

  const [lastExam, setLastExam] = useState<LastExam | null>(null);
  const [performance, setPerformance] = useState<PerformanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasFetched = useRef(false);

  const completedToday = user?.lastStudyDate
    ? new Date(user.lastStudyDate).toDateString() === new Date().toDateString()
    : false;

  const streakProgress = Math.min(((user?.studyStreak ?? 0) % 7) / 7 * 100, 100);

  async function loadData() {
    try {
      const [last, perf, profile] = await Promise.all([
        getLastExam(),
        getPerformance(),
        getProfile(),
      ]);
      setLastExam(last);
      setPerformance(perf);
      updateUser(profile);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
    hasFetched.current = true;
  }, []);

  useFocusEffect(useCallback(() => {
    if (hasFetched.current) loadData();
  }, []));

  if (loading) {
    return <HomeSkeleton rs={rs} hp={hp} pagePadding={pagePadding} />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingHorizontal: pagePadding, paddingBottom: hp(4) }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
    >
      {/* Header */}
      <MotionView delay={0} style={[styles.header, { paddingTop: rs(25), paddingBottom: hp(2) }]}>
        <View>
          <Text style={[styles.greetingText, { fontSize: rs(14) }]}>{getTimeBasedGreeting()}</Text>
          <Text style={[styles.userName, { fontSize: rs(22) }]}>{user?.name}</Text>
        </View>
        {user?.avatar ? (
          <Image
            source={{ uri: user.avatar }}
            style={{ width: rs(48), height: rs(48), borderRadius: rs(24) }}
          />
        ) : (
          <View style={[styles.avatarIcon, { width: rs(48), height: rs(48) }]}>
            <Ionicons name="person" size={rs(22)} color={Colors.primary} />
          </View>
        )}
      </MotionView>

      {/* Streak Card */}
      <MotionView delay={80} style={[styles.streakCard, { marginBottom: rs(24) }]}>
        <View style={styles.streakTop}>
          <View style={styles.streakLeft}>
            <View style={[styles.streakIcon, { width: rs(44), height: rs(44), borderRadius: rs(14) }]}>
              <Ionicons name="flame" size={rs(20)} color={Colors.secondary} />
            </View>
            <View style={styles.streakData}>
              <Text style={[styles.streakNum, { fontSize: rs(28) }]}>{user?.studyStreak ?? 0}</Text>
              <Text style={[styles.streakLabel, { fontSize: rs(13) }]}>يوم متواصل</Text>
            </View>
          </View>
          <View style={[styles.bestBadge, { paddingVertical: rs(6), paddingHorizontal: rs(14), borderRadius: rs(30) }]}>
            <Ionicons name="trophy" size={rs(14)} color={Colors.secondary} />
            <Text style={[styles.bestBadgeSpan, { fontSize: rs(14) }]}>{user?.bestStreak ?? 0}</Text>
            <Text style={[styles.bestBadgeSmall, { fontSize: rs(10) }]}>أفضل</Text>
          </View>
        </View>

        <Text style={[styles.streakMsg, { fontSize: rs(11), marginBottom: rs(14) }]}>
          {getStreakMessage(user?.studyStreak ?? 0, completedToday)}
        </Text>

        <View style={[styles.streakProgress, { height: rs(4), borderRadius: rs(4) }]}>
          <View style={[styles.streakProgressFill, {
            width: `${streakProgress}%`,
            borderRadius: rs(4),
          }]} />
        </View>
      </MotionView>

      {/* Start Exam */}
      <MotionView delay={120}>
        <PressableScale
          style={[styles.card, { padding: rs(24), marginBottom: rs(20) }]}
          onPress={() => router.push('/(tabs)/exams')}
        >
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTextH3, { fontSize: rs(17) }]}>ابدأ امتحان جديد</Text>
              <Text style={[styles.cardTextP, { fontSize: rs(13) }]}>اختر المادة وابدأ الامتحان</Text>
            </View>
            <View style={[styles.cardIcon, { width: rs(40), height: rs(40), borderRadius: rs(12) }]}>
              <Ionicons name="play-circle" size={rs(18)} color={Colors.primary} />
            </View>
          </View>
          <PressableScale
            style={[styles.ctaBtn, { paddingVertical: rs(14), borderRadius: rs(14), marginTop: rs(16) }]}
            onPress={() => router.push('/(tabs)/exams')}
          >
            <Text style={[styles.ctaBtnText, { fontSize: rs(16) }]}>ابدأ الآن</Text>
          </PressableScale>
        </PressableScale>
      </MotionView>

      {/* Last Exam */}
      {lastExam && (
        <MotionView delay={160} style={[styles.card, { padding: rs(24), marginBottom: rs(20) }]}>
          <View style={[styles.cardHeader, { marginBottom: rs(14) }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTextH3, { fontSize: rs(16) }]}>آخر امتحان</Text>
            </View>
            <View style={[styles.cardIcon, { width: rs(40), height: rs(40), borderRadius: rs(12) }]}>
              <Ionicons name="time-outline" size={rs(18)} color={Colors.primary} />
            </View>
          </View>

          <View style={styles.examRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.examSubject, { fontSize: rs(17) }]}>{lastExam.subject}</Text>
              <Text style={[styles.examTitle, { fontSize: rs(13) }]}>{lastExam.examTitle}</Text>
              <View style={[styles.examDate, { marginTop: rs(6), gap: rs(4) }]}>
                <Ionicons name="calendar-outline" size={rs(11)} color={Colors.text.disabled} />
                <Text style={[styles.examDateText, { fontSize: rs(11) }]}>
                  {new Date(lastExam.submittedAt).toLocaleDateString('ar-IQ')}
                </Text>
              </View>
            </View>
            <View style={[styles.scoreBox, { paddingVertical: rs(12), paddingHorizontal: rs(18), borderRadius: rs(14), minWidth: rs(70) }]}>
              <Text style={[styles.scoreNum, { fontSize: rs(22) }]}>
                {lastExam.totalScore?.toFixed(0)}
              </Text>
              <Text style={[styles.scoreMax, { fontSize: rs(10) }]}>من {lastExam.maxScore}</Text>
            </View>
          </View>

          <PressableScale
            style={[styles.secondaryBtn, { paddingVertical: rs(12), borderRadius: rs(14), marginTop: rs(16) }]}
            onPress={() => router.push(`/result/${lastExam.sessionId}` as never)}
          >
            <Text style={[styles.secondaryBtnText, { fontSize: rs(14) }]}>عرض النتيجة الكاملة</Text>
          </PressableScale>
        </MotionView>
      )}

      {/* Performance */}
      {performance && (
        <MotionView delay={200} style={[styles.card, { padding: rs(24), marginBottom: 0 }]}>
          <View style={[styles.cardHeader, { marginBottom: rs(16) }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTextH3, { fontSize: rs(16) }]}>ملخص الأداء</Text>
            </View>
            <View style={[styles.cardIcon, { width: rs(40), height: rs(40), borderRadius: rs(12) }]}>
              <Ionicons name="bar-chart" size={rs(18)} color={Colors.primary} />
            </View>
          </View>

          <View style={styles.perfGrid}>
            <View style={[styles.perfBox, { padding: rs(20), borderRadius: rs(16) }]}>
              <View style={[styles.perfBoxBorder, { height: rs(3), left: rs(20), right: rs(20), borderTopLeftRadius: rs(4), borderTopRightRadius: rs(4) }]} />
              <Text style={[styles.perfNumber, { fontSize: rs(28) }]}>{performance.totalExams}</Text>
              <Text style={[styles.perfLabel, { fontSize: rs(12) }]}>امتحان مكتمل</Text>
            </View>
            <View style={[styles.perfBox, { padding: rs(20), borderRadius: rs(16) }]}>
              <View style={[styles.perfBoxBorder, { height: rs(3), left: rs(20), right: rs(20), borderTopLeftRadius: rs(4), borderTopRightRadius: rs(4) }]} />
              <Text style={[styles.perfNumber, { fontSize: rs(28) }]}>{performance.avgScore}%</Text>
              <Text style={[styles.perfLabel, { fontSize: rs(12) }]}>متوسط الدرجات</Text>
            </View>
          </View>
        </MotionView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greetingText: { color: Colors.text.secondary, fontFamily: 'Tajawal_500Medium' },
  userName: { color: Colors.text.primary, fontFamily: 'Tajawal_800ExtraBold', marginTop: 2 },
  avatarIcon: { backgroundColor: '#F1F5F9', borderRadius: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  streakCard: { backgroundColor: Colors.primary, borderRadius: 20, padding: 24, paddingBottom: 20, shadowColor: Colors.primary, shadowOpacity: 0.15, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  streakTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  streakLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  streakIcon: { backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  streakData: { flexDirection: 'column' },
  streakNum: { color: Colors.secondary, fontFamily: 'Tajawal_800ExtraBold', lineHeight: 30 },
  streakLabel: { color: 'rgba(255,255,255,0.85)', fontFamily: 'Tajawal_500Medium' },
  streakMsg: { color: 'rgba(255,255,255,0.6)', fontFamily: 'Tajawal_500Medium', marginBottom: 14 },
  bestBadge: { backgroundColor: 'rgba(255,255,255,0.1)', flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  bestBadgeSpan: { color: Colors.secondary, fontFamily: 'Tajawal_700Bold', marginHorizontal: 4 },
  bestBadgeSmall: { color: 'rgba(255,255,255,0.7)', fontFamily: 'Tajawal_500Medium' },
  streakProgress: { backgroundColor: 'rgba(255,255,255,0.15)', width: '100%', overflow: 'hidden' },
  streakProgressFill: { height: '100%', backgroundColor: Colors.secondary },
  card: { backgroundColor: Colors.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: Colors.border, shadowColor: Colors.shadow, shadowOpacity: 0.02, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  cardIcon: { backgroundColor: Colors.primarySoft, justifyContent: 'center', alignItems: 'center' },
  cardTextH3: { color: Colors.text.primary, fontFamily: 'Tajawal_700Bold' },
  cardTextP: { color: Colors.text.secondary, fontFamily: 'Tajawal_500Medium' },
  ctaBtn: { width: '100%', backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: '#0F3B8C', shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  ctaBtnText: { color: Colors.text.white, fontFamily: 'Tajawal_700Bold' },
  examRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'stretch', gap: 12 },
  examSubject: { color: Colors.text.primary, fontFamily: 'Tajawal_700Bold' },
  examTitle: { color: Colors.text.secondary, fontFamily: 'Tajawal_500Medium', marginTop: 2 },
  examDate: { flexDirection: 'row', alignItems: 'center' },
  examDateText: { color: Colors.text.disabled, fontFamily: 'Tajawal_500Medium' },
  scoreBox: { backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 14, minWidth: 70, shadowColor: Colors.primary, shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  scoreNum: { color: Colors.secondary, fontFamily: 'Tajawal_800ExtraBold', lineHeight: 22 },
  scoreMax: { color: Colors.white, opacity: 0.7, fontFamily: 'Tajawal_500Medium' },
  secondaryBtn: { width: '100%', backgroundColor: Colors.secondary, justifyContent: 'center', alignItems: 'center', shadowColor: Colors.secondary, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  secondaryBtnText: { color: Colors.primary, fontFamily: 'Tajawal_700Bold' },
  perfGrid: { flexDirection: 'row', gap: 12 },
  perfBox: { flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', position: 'relative' },
  perfBoxBorder: { position: 'absolute', top: -1, backgroundColor: Colors.secondary },
  perfNumber: { color: Colors.primary, fontFamily: 'Tajawal_800ExtraBold', textAlign: 'center' },
  perfLabel: { color: Colors.text.secondary, fontFamily: 'Tajawal_500Medium', marginTop: 4, textAlign: 'center' },
});