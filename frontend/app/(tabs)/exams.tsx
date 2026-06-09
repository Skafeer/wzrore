import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../../hooks/useResponsive';
import { Colors } from '../../constants/colors';
import {
  getSubjects, getChapters, getTopics,
  getAvailableYears, getAvailableRounds, getExams,
} from '../../services/exam.service';
import { Subject, Chapter, Topic, Exam } from '../../types';
import { MotionView, PressableScale } from '../../components/motion';

type ExamType = 'WIZARI' | 'CHAPTER' | null;

export default function ExamsScreen() {
  const { rs, hp, pagePadding } = useResponsive();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [rounds, setRounds] = useState<number[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);

  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [examType, setExamType] = useState<ExamType>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);

  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingExams, setLoadingExams] = useState(false);

  useEffect(() => {
    getSubjects().then(setSubjects).finally(() => setLoadingSubjects(false));
  }, []);

  useEffect(() => {
    if (!selectedSubject) return;
    setChapters([]); setTopics([]); setYears([]); setRounds([]);
    setSelectedChapter(null); setSelectedTopic(null);
    setSelectedYear(null); setSelectedRound(null);
    setExams([]);

    if (examType === 'CHAPTER') {
      getChapters(selectedSubject.id).then(setChapters);
    } else if (examType === 'WIZARI') {
      getAvailableYears(selectedSubject.id).then(setYears);
    }
  }, [selectedSubject, examType]);

  useEffect(() => {
    if (!selectedChapter) return;
    setTopics([]); setSelectedTopic(null); setExams([]);
    getTopics(selectedChapter.id).then(setTopics);
  }, [selectedChapter]);

  useEffect(() => {
    if (!selectedSubject || !examType) return;

    if (examType === 'CHAPTER' && selectedChapter) {
      loadExams();
    } else if (examType === 'WIZARI' && selectedYear && selectedRound) {
      loadExams();
    }
  }, [selectedChapter, selectedTopic, selectedYear, selectedRound]);

  useEffect(() => {
    if (!selectedSubject || examType !== 'WIZARI' || !selectedYear) return;
    setRounds([]); setSelectedRound(null); setExams([]);
    getAvailableRounds(selectedSubject.id, selectedYear).then(setRounds);
  }, [selectedYear]);

  async function loadExams() {
    if (!selectedSubject || !examType) return;
    setLoadingExams(true);
    try {
      const data = await getExams({
        subjectId: selectedSubject.id,
        type: examType,
        chapterId: selectedChapter?.id,
        topicId: selectedTopic?.id,
        year: selectedYear ?? undefined,
        round: selectedRound ?? undefined,
      });
      setExams(data);
    } finally {
      setLoadingExams(false);
    }
  }

  function resetAll() {
    setSelectedSubject(null); setExamType(null);
    setSelectedChapter(null); setSelectedTopic(null);
    setSelectedYear(null); setSelectedRound(null);
    setExams([]);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingHorizontal: pagePadding, paddingBottom: hp(4) }}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: hp(6), paddingBottom: hp(2) }]}>
        <Text style={[styles.title, { fontSize: rs(22) }]}>الامتحانات</Text>
        {(selectedSubject || examType) && (
          <TouchableOpacity onPress={resetAll}>
            <Ionicons name="refresh" size={rs(22)} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Subject */}
      <Text style={[styles.label, { fontSize: rs(14) }]}>المادة</Text>
      {loadingSubjects
        ? <ActivityIndicator color={Colors.primary} style={{ marginBottom: rs(16) }} />
        : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: rs(16) }}>
            {subjects.map(s => (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.chip,
                  { paddingHorizontal: rs(16), paddingVertical: rs(10), marginLeft: rs(8), borderRadius: rs(20) },
                  selectedSubject?.id === s.id && styles.chipActive,
                ]}
                onPress={() => { setSelectedSubject(s); setExamType(null); }}
              >
                <Text style={[
                  styles.chipText, { fontSize: rs(14) },
                  selectedSubject?.id === s.id && styles.chipTextActive,
                ]}>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )
      }

      {/* Type */}
      {selectedSubject && (
        <>
          <Text style={[styles.label, { fontSize: rs(14) }]}>النوع</Text>
          <View style={[styles.typeRow, { marginBottom: rs(16) }]}>
            {(['WIZARI', 'CHAPTER'] as ExamType[]).map(t => (
              <TouchableOpacity
                key={t!}
                style={[
                  styles.typeBtn,
                  { paddingVertical: rs(12), borderRadius: rs(12) },
                  examType === t && styles.typeBtnActive,
                ]}
                onPress={() => setExamType(t)}
              >
                <Text style={[
                  styles.typeBtnText, { fontSize: rs(14) },
                  examType === t && styles.typeBtnTextActive,
                ]}>
                  {t === 'WIZARI' ? 'وزاري شامل' : 'فصل محدد'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Chapter (CHAPTER type) */}
      {examType === 'CHAPTER' && chapters.length > 0 && (
        <>
          <Text style={[styles.label, { fontSize: rs(14) }]}>الفصل</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: rs(16) }}>
            {chapters.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[
                  styles.chip,
                  { paddingHorizontal: rs(16), paddingVertical: rs(10), marginLeft: rs(8), borderRadius: rs(20) },
                  selectedChapter?.id === c.id && styles.chipActive,
                ]}
                onPress={() => setSelectedChapter(c)}
              >
                <Text style={[
                  styles.chipText, { fontSize: rs(14) },
                  selectedChapter?.id === c.id && styles.chipTextActive,
                ]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      {/* Topic */}
      {examType === 'CHAPTER' && selectedChapter && topics.length > 0 && (
        <>
          <Text style={[styles.label, { fontSize: rs(14) }]}>الموضوع</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: rs(16) }}>
            <TouchableOpacity
              style={[
                styles.chip,
                { paddingHorizontal: rs(16), paddingVertical: rs(10), marginLeft: rs(8), borderRadius: rs(20) },
                !selectedTopic && styles.chipActive,
              ]}
              onPress={() => setSelectedTopic(null)}
            >
              <Text style={[styles.chipText, { fontSize: rs(14) }, !selectedTopic && styles.chipTextActive]}>
                الكل
              </Text>
            </TouchableOpacity>
            {topics.map(t => (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.chip,
                  { paddingHorizontal: rs(16), paddingVertical: rs(10), marginLeft: rs(8), borderRadius: rs(20) },
                  selectedTopic?.id === t.id && styles.chipActive,
                ]}
                onPress={() => setSelectedTopic(t)}
              >
                <Text style={[
                  styles.chipText, { fontSize: rs(14) },
                  selectedTopic?.id === t.id && styles.chipTextActive,
                ]}>{t.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      {/* Year (WIZARI type) */}
      {examType === 'WIZARI' && years.length > 0 && (
        <>
          <Text style={[styles.label, { fontSize: rs(14) }]}>السنة</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: rs(16) }}>
            {years.map(y => (
              <TouchableOpacity
                key={y}
                style={[
                  styles.chip,
                  { paddingHorizontal: rs(16), paddingVertical: rs(10), marginLeft: rs(8), borderRadius: rs(20) },
                  selectedYear === y && styles.chipActive,
                ]}
                onPress={() => setSelectedYear(y)}
              >
                <Text style={[
                  styles.chipText, { fontSize: rs(14) },
                  selectedYear === y && styles.chipTextActive,
                ]}>{y}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      {/* Round */}
      {examType === 'WIZARI' && selectedYear && rounds.length > 0 && (
        <>
          <Text style={[styles.label, { fontSize: rs(14) }]}>الدور</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: rs(16) }}>
            {rounds.map(r => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.chip,
                  { paddingHorizontal: rs(16), paddingVertical: rs(10), marginLeft: rs(8), borderRadius: rs(20) },
                  selectedRound === r && styles.chipActive,
                ]}
                onPress={() => setSelectedRound(r)}
              >
                <Text style={[
                  styles.chipText, { fontSize: rs(14) },
                  selectedRound === r && styles.chipTextActive,
                ]}>الدور {r}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      {/* Exams List */}
      {loadingExams && <ActivityIndicator color={Colors.primary} style={{ marginTop: rs(20) }} />}

      {exams.length > 0 && (
        <>
          <Text style={[styles.label, { fontSize: rs(14) }]}>الامتحانات المتوفرة</Text>
          {exams.map((exam, index) => (
            <MotionView key={exam.id} delay={index * 45}>
              <PressableScale
              style={[styles.examCard, { padding: rs(16), marginBottom: rs(12), borderRadius: rs(14) }]}
              onPress={() => router.push(`/exam/${exam.id}` as never)}
            >
              <View style={styles.examRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.examTitle, { fontSize: rs(15) }]}>{exam.title}</Text>
                  <Text style={[styles.examMeta, { fontSize: rs(12) }]}>
                    {exam._count.questions} سؤال • {exam.duration} دقيقة
                  </Text>
                </View>
                <Ionicons name="chevron-back" size={rs(20)} color={Colors.text.secondary} />
              </View>
              </PressableScale>
            </MotionView>
          ))}
        </>
      )}

      {!loadingExams && exams.length === 0 && examType && (
        examType === 'WIZARI' ? selectedRound : selectedChapter
      ) ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { fontSize: rs(14) }]}>لا توجد امتحانات متوفرة</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: Colors.text.primary, fontWeight: 'bold' },
  label: { color: Colors.text.secondary, fontWeight: '600', marginBottom: 8 },
  chip: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, minHeight: 40, justifyContent: 'center' },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { color: Colors.text.primary, fontWeight: '500' },
  chipTextActive: { color: Colors.white },
  typeRow: { flexDirection: 'row', gap: 12 },
  typeBtn: { flex: 1, backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', minHeight: 46, justifyContent: 'center' },
  typeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeBtnText: { color: Colors.text.primary, fontWeight: '600' },
  typeBtnTextActive: { color: Colors.white },
  examCard: { backgroundColor: Colors.white, elevation: 2, shadowColor: Colors.shadow, shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  examRow: { flexDirection: 'row', alignItems: 'center' },
  examTitle: { color: Colors.text.primary, fontWeight: '600' },
  examMeta: { color: Colors.text.secondary, marginTop: 4 },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: Colors.text.secondary },
});
