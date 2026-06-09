import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, LayoutAnimation,
  Platform, UIManager,
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

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ExamType = 'WIZARI' | 'CHAPTER' | null;
type OpenField = 'subject' | 'type' | 'chapter' | 'year' | 'round' | 'topic' | null;

/* ─── Dropdown Field Component ───────────────────── */
type DropdownFieldProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string | null;
  placeholder: string;
  disabled?: boolean;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  rs: (size: number) => number;
};

function DropdownField({
  label, icon, value, placeholder,
  disabled, isOpen, onToggle, children, rs,
}: DropdownFieldProps) {
  return (
    <View style={[
      fieldStyles.container,
      { marginBottom: rs(12), borderRadius: rs(14) },
      disabled && fieldStyles.containerDisabled,
      isOpen && fieldStyles.containerOpen,
    ]}>
      <TouchableOpacity
        activeOpacity={disabled ? 1 : 0.7}
        onPress={() => {
          if (disabled) return;
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          onToggle();
        }}
        style={[fieldStyles.header, { padding: rs(14) }]}
      >
        <View style={fieldStyles.headerRight}>
          <View style={[
            fieldStyles.iconBox,
            { width: rs(36), height: rs(36), borderRadius: rs(10) },
            disabled && fieldStyles.iconBoxDisabled,
          ]}>
            <Ionicons
              name={icon}
              size={rs(18)}
              color={disabled ? Colors.text.disabled : Colors.primary}
            />
          </View>
          <View style={{ marginRight: rs(10), flex: 1 }}>
            <Text style={[
              fieldStyles.label,
              { fontSize: rs(11) },
              disabled && fieldStyles.textDisabled,
            ]}>{label}</Text>
            <Text
              numberOfLines={1}
              style={[
                fieldStyles.value,
                { fontSize: rs(15) },
                !value && fieldStyles.placeholder,
                disabled && fieldStyles.textDisabled,
              ]}
            >
              {value || placeholder}
            </Text>
          </View>
        </View>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={rs(18)}
          color={disabled ? Colors.text.disabled : Colors.text.secondary}
        />
      </TouchableOpacity>

      {isOpen && !disabled && (
        <View style={[fieldStyles.optionsContainer, { paddingHorizontal: rs(14), paddingBottom: rs(12) }]}>
          <View style={[fieldStyles.divider, { marginBottom: rs(10) }]} />
          {children}
        </View>
      )}
    </View>
  );
}

/* ─── Option Item ────────────────────────────────── */
type OptionItemProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  rs: (size: number) => number;
};

function OptionItem({ label, selected, onPress, rs }: OptionItemProps) {
  return (
    <TouchableOpacity
      style={[
        fieldStyles.option,
        { paddingVertical: rs(11), paddingHorizontal: rs(14), borderRadius: rs(10), marginBottom: rs(4) },
        selected && fieldStyles.optionSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[
        fieldStyles.optionText,
        { fontSize: rs(14) },
        selected && fieldStyles.optionTextSelected,
      ]}>{label}</Text>
      {selected && (
        <Ionicons name="checkmark-circle" size={rs(18)} color={Colors.primary} />
      )}
    </TouchableOpacity>
  );
}

/* ─── Main Screen ────────────────────────────────── */
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
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingRounds, setLoadingRounds] = useState(false);
  const [loadingExams, setLoadingExams] = useState(false);

  const [openField, setOpenField] = useState<OpenField>(null);

  const toggleField = useCallback((field: OpenField) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenField(prev => prev === field ? null : field);
  }, []);

  /* ─── Data Loading ─────────────────────────────── */
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
      setLoadingChapters(true);
      getChapters(selectedSubject.id).then(setChapters).finally(() => setLoadingChapters(false));
    } else if (examType === 'WIZARI') {
      setLoadingYears(true);
      getAvailableYears(selectedSubject.id).then(setYears).finally(() => setLoadingYears(false));
    }
  }, [selectedSubject, examType]);

  useEffect(() => {
    if (!selectedChapter) return;
    setTopics([]); setSelectedTopic(null); setExams([]);
    setLoadingTopics(true);
    getTopics(selectedChapter.id).then(setTopics).finally(() => setLoadingTopics(false));
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
    setLoadingRounds(true);
    getAvailableRounds(selectedSubject.id, selectedYear).then(setRounds).finally(() => setLoadingRounds(false));
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
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedSubject(null); setExamType(null);
    setSelectedChapter(null); setSelectedTopic(null);
    setSelectedYear(null); setSelectedRound(null);
    setExams([]); setOpenField(null);
  }

  /* ─── Helpers ──────────────────────────────────── */
  const isRoundDisabled = !selectedYear;

  const getTypeLabel = (t: ExamType) => {
    if (t === 'WIZARI') return 'وزاري شامل';
    if (t === 'CHAPTER') return 'فصل محدد';
    return null;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingHorizontal: pagePadding, paddingBottom: hp(4) }}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: hp(6), paddingBottom: hp(2) }]}>
        <Text style={[styles.title, { fontSize: rs(22) }]}>الامتحانات</Text>
        {(selectedSubject || examType) && (
          <TouchableOpacity
            onPress={resetAll}
            style={[styles.resetBtn, { paddingHorizontal: rs(12), paddingVertical: rs(6), borderRadius: rs(8) }]}
          >
            <Ionicons name="refresh" size={rs(16)} color={Colors.primary} />
            <Text style={[styles.resetText, { fontSize: rs(12), marginRight: rs(4) }]}>إعادة تعيين</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── 1. Subject Field ─────────────────────── */}
      <DropdownField
        label="المادة"
        icon="book-outline"
        value={selectedSubject?.name || null}
        placeholder="اختر المادة"
        isOpen={openField === 'subject'}
        onToggle={() => toggleField('subject')}
        rs={rs}
      >
        {loadingSubjects ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: rs(8) }} />
        ) : (
          subjects.map(s => (
            <OptionItem
              key={s.id}
              label={s.name}
              selected={selectedSubject?.id === s.id}
              onPress={() => {
                setSelectedSubject(s);
                setExamType(null);
                setOpenField('type');
              }}
              rs={rs}
            />
          ))
        )}
      </DropdownField>

      {/* ── 2. Type Field ────────────────────────── */}
      <DropdownField
        label="النوع"
        icon="layers-outline"
        value={getTypeLabel(examType)}
        placeholder="اختر نوع الامتحان"
        disabled={!selectedSubject}
        isOpen={openField === 'type'}
        onToggle={() => toggleField('type')}
        rs={rs}
      >
        <OptionItem
          label="وزاري شامل"
          selected={examType === 'WIZARI'}
          onPress={() => {
            setExamType('WIZARI');
            setOpenField('year');
          }}
          rs={rs}
        />
        <OptionItem
          label="فصل محدد"
          selected={examType === 'CHAPTER'}
          onPress={() => {
            setExamType('CHAPTER');
            setOpenField('chapter');
          }}
          rs={rs}
        />
      </DropdownField>

      {/* ── 3. Chapter Field (فصل محدد only) ─────── */}
      {examType === 'CHAPTER' && (
        <DropdownField
          label="الفصل"
          icon="albums-outline"
          value={selectedChapter?.name || null}
          placeholder="اختر الفصل"
          isOpen={openField === 'chapter'}
          onToggle={() => toggleField('chapter')}
          rs={rs}
        >
          {loadingChapters ? (
            <ActivityIndicator color={Colors.primary} style={{ marginVertical: rs(8) }} />
          ) : chapters.length === 0 ? (
            <Text style={[fieldStyles.emptyText, { fontSize: rs(13), padding: rs(8) }]}>
              لا توجد فصول متوفرة
            </Text>
          ) : (
            chapters.map(c => (
              <OptionItem
                key={c.id}
                label={c.name}
                selected={selectedChapter?.id === c.id}
                onPress={() => {
                  setSelectedChapter(c);
                  setOpenField('topic');
                }}
                rs={rs}
              />
            ))
          )}
        </DropdownField>
      )}

      {/* ── 4. Topic Field (فصل محدد + chapter selected) */}
      {examType === 'CHAPTER' && selectedChapter && (
        <DropdownField
          label="الموضوع"
          icon="document-text-outline"
          value={selectedTopic?.name || 'الكل'}
          placeholder="اختر الموضوع"
          isOpen={openField === 'topic'}
          onToggle={() => toggleField('topic')}
          rs={rs}
        >
          {loadingTopics ? (
            <ActivityIndicator color={Colors.primary} style={{ marginVertical: rs(8) }} />
          ) : (
            <>
              <OptionItem
                label="الكل"
                selected={!selectedTopic}
                onPress={() => {
                  setSelectedTopic(null);
                  setOpenField(null);
                }}
                rs={rs}
              />
              {topics.map(t => (
                <OptionItem
                  key={t.id}
                  label={t.name}
                  selected={selectedTopic?.id === t.id}
                  onPress={() => {
                    setSelectedTopic(t);
                    setOpenField(null);
                  }}
                  rs={rs}
                />
              ))}
            </>
          )}
        </DropdownField>
      )}

      {/* ── 5. Year Field (وزاري شامل only) ──────── */}
      {examType === 'WIZARI' && (
        <DropdownField
          label="السنة"
          icon="calendar-outline"
          value={selectedYear ? `${selectedYear}` : null}
          placeholder="اختر السنة"
          isOpen={openField === 'year'}
          onToggle={() => toggleField('year')}
          rs={rs}
        >
          {loadingYears ? (
            <ActivityIndicator color={Colors.primary} style={{ marginVertical: rs(8) }} />
          ) : years.length === 0 ? (
            <Text style={[fieldStyles.emptyText, { fontSize: rs(13), padding: rs(8) }]}>
              لا توجد سنوات متوفرة
            </Text>
          ) : (
            years.map(y => (
              <OptionItem
                key={y}
                label={`${y}`}
                selected={selectedYear === y}
                onPress={() => {
                  setSelectedYear(y);
                  setOpenField('round');
                }}
                rs={rs}
              />
            ))
          )}
        </DropdownField>
      )}

      {/* ── 6. Round Field (وزاري شامل only) ──────── */}
      {examType === 'WIZARI' && (
        <DropdownField
          label="الدور"
          icon="repeat-outline"
          value={selectedRound ? `الدور ${selectedRound}` : null}
          placeholder={isRoundDisabled ? 'اختر السنة أولاً' : 'اختر الدور'}
          disabled={isRoundDisabled}
          isOpen={openField === 'round'}
          onToggle={() => toggleField('round')}
          rs={rs}
        >
          {loadingRounds ? (
            <ActivityIndicator color={Colors.primary} style={{ marginVertical: rs(8) }} />
          ) : rounds.length === 0 ? (
            <Text style={[fieldStyles.emptyText, { fontSize: rs(13), padding: rs(8) }]}>
              لا توجد أدوار متوفرة
            </Text>
          ) : (
            rounds.map(r => (
              <OptionItem
                key={r}
                label={`الدور ${r}`}
                selected={selectedRound === r}
                onPress={() => {
                  setSelectedRound(r);
                  setOpenField(null);
                }}
                rs={rs}
              />
            ))
          )}
        </DropdownField>
      )}



      {/* ── Exams List ───────────────────────────── */}
      {loadingExams && <ActivityIndicator color={Colors.primary} style={{ marginTop: rs(20) }} />}

      {exams.length > 0 && (
        <>
          <View style={[styles.examsHeader, { marginTop: rs(8), marginBottom: rs(12) }]}>
            <View style={[styles.examsHeaderLine, { backgroundColor: Colors.primary }]} />
            <Text style={[styles.examsHeaderText, { fontSize: rs(14), marginHorizontal: rs(10) }]}>
              الامتحانات المتوفرة ({exams.length})
            </Text>
            <View style={[styles.examsHeaderLine, { backgroundColor: Colors.primary }]} />
          </View>
          {exams.map((exam, index) => (
            <MotionView key={exam.id} delay={index * 45}>
              <PressableScale
                style={[styles.examCard, { padding: rs(16), marginBottom: rs(10), borderRadius: rs(14) }]}
                onPress={() => router.push(`/exam/${exam.id}` as never)}
              >
                <View style={styles.examRow}>
                  <View style={[styles.examIconBox, { width: rs(40), height: rs(40), borderRadius: rs(12), marginLeft: rs(12) }]}>
                    <Ionicons name="document-text" size={rs(18)} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.examTitle, { fontSize: rs(15) }]}>{exam.title}</Text>
                    <View style={[styles.examMetaRow, { marginTop: rs(4) }]}>
                      <View style={styles.examMetaItem}>
                        <Ionicons name="help-circle-outline" size={rs(13)} color={Colors.text.secondary} />
                        <Text style={[styles.examMeta, { fontSize: rs(12), marginRight: rs(3) }]}>
                          {exam._count.questions} سؤال
                        </Text>
                      </View>
                      <View style={styles.examMetaItem}>
                        <Ionicons name="time-outline" size={rs(13)} color={Colors.text.secondary} />
                        <Text style={[styles.examMeta, { fontSize: rs(12), marginRight: rs(3) }]}>
                          {exam.duration} دقيقة
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={[styles.startExamBtn, { paddingHorizontal: rs(12), paddingVertical: rs(8), borderRadius: rs(8) }]}>
                    <Text style={[styles.startExamBtnText, { fontSize: rs(12) }]}>ابدأ</Text>
                  </View>
                </View>
              </PressableScale>
            </MotionView>
          ))}
        </>
      )}

      {!loadingExams && exams.length === 0 && examType && (
        examType === 'WIZARI' ? selectedRound : selectedChapter
      ) ? (
        <View style={[styles.empty, { marginTop: rs(24) }]}>
          <Ionicons name="search-outline" size={rs(40)} color={Colors.text.disabled} />
          <Text style={[styles.emptyText, { fontSize: rs(14), marginTop: rs(8) }]}>لا توجد امتحانات متوفرة</Text>
          <Text style={[styles.emptySubText, { fontSize: rs(12), marginTop: rs(4) }]}>
            جرب تغيير خيارات البحث
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

/* ─── Field Styles ───────────────────────────────── */
const fieldStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  containerDisabled: {
    backgroundColor: Colors.surfaceMuted,
    borderColor: Colors.disabled,
    elevation: 0,
    shadowOpacity: 0,
  },
  containerOpen: {
    borderColor: Colors.primary,
    elevation: 3,
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    backgroundColor: Colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBoxDisabled: {
    backgroundColor: Colors.disabled,
  },
  label: {
    color: Colors.text.secondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  value: {
    color: Colors.text.primary,
    fontWeight: '600',
  },
  placeholder: {
    color: Colors.text.disabled,
    fontWeight: '400',
  },
  textDisabled: {
    color: Colors.text.disabled,
  },
  optionsContainer: {},
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionSelected: {
    backgroundColor: Colors.primarySoft,
  },
  optionText: {
    color: Colors.text.primary,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyText: {
    color: Colors.text.disabled,
    textAlign: 'center',
  },
});

/* ─── Page Styles ────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: Colors.text.primary, fontWeight: 'bold' },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primarySoft,
  },
  resetText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  examsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  examsHeaderLine: {
    flex: 1,
    height: 1,
    opacity: 0.2,
  },
  examsHeaderText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  examCard: {
    backgroundColor: Colors.white,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  examRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  examIconBox: {
    backgroundColor: Colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  examTitle: {
    color: Colors.text.primary,
    fontWeight: '600',
  },
  examMetaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  examMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  examMeta: {
    color: Colors.text.secondary,
  },
  startExamBtn: {
    backgroundColor: Colors.primary,
  },
  startExamBtnText: {
    color: Colors.white,
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  emptySubText: {
    color: Colors.text.disabled,
  },
});
