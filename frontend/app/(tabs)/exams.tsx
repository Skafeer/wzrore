import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, LayoutAnimation,
  Platform, UIManager, Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../../hooks/useResponsive';
import { Colors } from '../../constants/colors';
import {
  getSubjects, getChapters, getTopics, getExams,
} from '../../services/exam.service';
import { Subject, Chapter, Topic, Exam } from '../../types';
import { MotionView, PressableScale } from '../../components/motion';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type OpenField = 'subject' | 'chapter' | 'topic' | null;

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
      { marginBottom: rs(12), borderRadius: rs(20) },
      disabled && fieldStyles.containerDisabled,
      isOpen && fieldStyles.containerOpen,
    ]}>
      <TouchableOpacity
        activeOpacity={disabled ? 1 : 0.85}
        onPress={() => {
          if (disabled) return;
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          onToggle();
        }}
        style={[fieldStyles.header, { padding: rs(16) }]}>
        <View style={fieldStyles.headerRight}>
          <View style={[
            fieldStyles.iconBox,
            { width: rs(42), height: rs(42), borderRadius: rs(12) },
            disabled && fieldStyles.iconBoxDisabled,
          ]}>
            <Ionicons name={icon} size={rs(20)} color={disabled ? Colors.text.disabled : Colors.primary} />
          </View>
          <View style={{ marginRight: rs(12), flex: 1 }}>
            <Text style={[
              fieldStyles.label,
              { fontSize: rs(12) },
              disabled && fieldStyles.textDisabled,
            ]}>{label}</Text>
            <Text
              numberOfLines={1}
              style={[
                fieldStyles.value,
                { fontSize: rs(16) },
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
          size={rs(20)}
          color={disabled ? Colors.text.disabled : Colors.text.secondary}
        />
      </TouchableOpacity>

      {isOpen && !disabled && (
        <View style={[fieldStyles.optionsContainer, { paddingHorizontal: rs(14), paddingBottom: rs(14) }]}>
          <View style={[fieldStyles.divider, { marginBottom: rs(10) }]} />
          {children}
        </View>
      )}
    </View>
  );
}

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
        { paddingVertical: rs(12), paddingHorizontal: rs(14), borderRadius: rs(12), marginBottom: rs(4) },
        selected && fieldStyles.optionSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={[
        fieldStyles.optionText,
        { fontSize: rs(14) },
        selected && fieldStyles.optionTextSelected,
      ]}>{label}</Text>
      {selected && <Ionicons name="checkmark-circle" size={rs(20)} color={Colors.primary} />}
    </TouchableOpacity>
  );
}

function ExamSkeleton({ count = 3, rs }: { count?: number; rs: (size: number) => number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Animated.View
          key={index}
          style={[
            skeletonStyles.card,
            { padding: rs(16), marginBottom: rs(10), borderRadius: rs(20), opacity },
          ]}
        >
          <View style={skeletonStyles.row}>
            <View style={[skeletonStyles.icon, { width: rs(40), height: rs(40), borderRadius: rs(12), marginLeft: rs(12) }]} />
            <View style={{ flex: 1, marginRight: rs(4) }}>
              <View style={[skeletonStyles.textBlock, { width: '60%', height: rs(14), marginBottom: rs(6) }]} />
              <View style={{ flexDirection: 'row', gap: rs(8) }}>
                <View style={[skeletonStyles.textBlock, { width: '35%', height: rs(11) }]} />
                <View style={[skeletonStyles.textBlock, { width: '30%', height: rs(11) }]} />
              </View>
            </View>
            <View style={[skeletonStyles.btnBlock, { width: rs(50), height: rs(28), borderRadius: rs(12) }]} />
          </View>
        </Animated.View>
      ))}
    </>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    backgroundColor: Colors.border,
  },
  textBlock: {
    backgroundColor: Colors.border,
    borderRadius: 4,
  },
  btnBlock: {
    backgroundColor: Colors.border,
  },
});

export default function ExamsScreen() {
  const { rs, hp, pagePadding } = useResponsive();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);

  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [loadingExams, setLoadingExams] = useState(false);

  const [openField, setOpenField] = useState<OpenField>(null);

  const toggleField = useCallback((field: OpenField) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenField(prev => prev === field ? null : field);
  }, []);

  useEffect(() => {
    getSubjects().then(setSubjects).finally(() => setLoadingSubjects(false));
  }, []);

  useEffect(() => {
    if (!selectedSubject) {
      setChapters([]); setTopics([]); setExams([]);
      setSelectedChapter(null); setSelectedTopic(null);
      return;
    }
    setChapters([]); setTopics([]); setExams([]);
    setSelectedChapter(null); setSelectedTopic(null);
    setLoadingChapters(true);
    getChapters(selectedSubject.id).then(setChapters).finally(() => setLoadingChapters(false));
  }, [selectedSubject]);

  useEffect(() => {
    if (!selectedChapter) {
      setTopics([]); setExams([]);
      setSelectedTopic(null);
      return;
    }
    setTopics([]); setExams([]);
    setSelectedTopic(null);
    setLoadingTopics(true);
    getTopics(selectedChapter.id).then(setTopics).finally(() => setLoadingTopics(false));
  }, [selectedChapter]);

  useEffect(() => {
    loadExams();
  }, [selectedSubject, selectedChapter, selectedTopic]);

  async function loadExams() {
    if (!selectedSubject || !selectedChapter || !selectedTopic) {
      setExams([]);
      return;
    }
    setLoadingExams(true);
    try {
      const data = await getExams({
        subjectId: selectedSubject.id,
        type: 'CHAPTER',
        chapterId: selectedChapter.id,
        topicId: selectedTopic.id,
      });
      setExams(data);
    } finally {
      setLoadingExams(false);
    }
  }

  function resetAll() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedSubject(null); setSelectedChapter(null); setSelectedTopic(null);
    setExams([]); setOpenField(null);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingHorizontal: pagePadding, paddingBottom: hp(4) }}
    >
      <MotionView delay={0} style={[styles.header, { paddingTop: rs(25), paddingBottom: hp(2) }]}>
        <Text style={[styles.title, { fontSize: rs(22) }]}>الامتحانات</Text>
        {(selectedSubject || selectedChapter || selectedTopic) && (
          <PressableScale
            style={[styles.resetBtn, { paddingHorizontal: rs(12), paddingVertical: rs(6), borderRadius: rs(10), flexDirection: 'row', alignItems: 'center', gap: rs(4) }]}
            onPress={resetAll}
          >
            <Ionicons name="refresh" size={rs(14)} color={Colors.primary} />
            <Text style={[styles.resetText, { fontSize: rs(12) }]}>إعادة تعيين</Text>
          </PressableScale>
        )}
      </MotionView>

      <MotionView delay={80}>
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
                  setOpenField('chapter');
                }}
                rs={rs}
              />
            ))
          )}
        </DropdownField>
      </MotionView>

      <MotionView delay={110}>
        <DropdownField
          label="الفصل"
          icon="albums-outline"
          value={selectedChapter?.name || null}
          placeholder="اختر الفصل"
          disabled={!selectedSubject}
          isOpen={openField === 'chapter'}
          onToggle={() => toggleField('chapter')}
          rs={rs}
        >
          {loadingChapters ? (
            <ActivityIndicator color={Colors.primary} style={{ marginVertical: rs(8) }} />
          ) : chapters.length === 0 ? (
            <Text style={[fieldStyles.emptyText, { fontSize: rs(13), padding: rs(8) }]}>لا توجد فصول متوفرة</Text>
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
      </MotionView>

      <MotionView delay={140}>
        <DropdownField
          label="الموضوع"
          icon="document-text-outline"
          value={selectedTopic?.name || null}
          placeholder="اختر الموضوع"
          disabled={!selectedChapter}
          isOpen={openField === 'topic'}
          onToggle={() => toggleField('topic')}
          rs={rs}
        >
          {loadingTopics ? (
            <ActivityIndicator color={Colors.primary} style={{ marginVertical: rs(8) }} />
          ) : topics.length === 0 ? (
            <Text style={[fieldStyles.emptyText, { fontSize: rs(13), padding: rs(8) }]}>لا توجد مواضيع متوفرة</Text>
          ) : (
            topics.map(t => (
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
            ))
          )}
        </DropdownField>
      </MotionView>

      {loadingExams && <ExamSkeleton count={3} rs={rs} />}

      {exams.length > 0 && (
        <MotionView delay={180}>
          <View style={[styles.examsHeader, { marginTop: rs(12), marginBottom: rs(12) }]}>
            <View style={[styles.examsHeaderLine, { backgroundColor: Colors.primary }]} />
            <Text style={[styles.examsHeaderText, { fontSize: rs(14), marginHorizontal: rs(10) }]}>
              الامتحانات المتوفرة ({exams.length})
            </Text>
            <View style={[styles.examsHeaderLine, { backgroundColor: Colors.primary }]} />
          </View>
          {exams.map((exam, index) => (
            <PressableScale
              key={exam.id}
              style={[styles.examCard, { padding: rs(16), marginBottom: rs(10), borderRadius: rs(20) }]}
              onPress={() => router.push(`/exam/${exam.id}` as never)}
            >
              <View style={styles.examRow}>
                <View style={[styles.examIconBox, { width: rs(40), height: rs(40), borderRadius: rs(12), marginLeft: rs(12), backgroundColor: Colors.primarySoft, justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="document-text" size={rs(18)} color={Colors.primary} />
                </View>
                <View style={{ flex: 1, marginRight: rs(4) }}>
                  <Text style={[styles.examTitle, { fontSize: rs(15) }]}>{exam.title}</Text>
                  <View style={[styles.examMetaRow, { marginTop: rs(6) }]}>
                    <View style={styles.examMetaItem}>
                      <Ionicons name="help-circle-outline" size={rs(13)} color={Colors.text.secondary} />
                      <Text style={[styles.examMeta, { fontSize: rs(12), marginRight: rs(4) }]}>{exam._count.questions} سؤال</Text>
                    </View>
                    <View style={[styles.examMetaItem, { marginRight: rs(10) }]}>
                      <Ionicons name="time-outline" size={rs(13)} color={Colors.text.secondary} />
                      <Text style={[styles.examMeta, { fontSize: rs(12), marginRight: rs(4) }]}>{exam.duration} دقيقة</Text>
                    </View>
                  </View>
                </View>
                <PressableScale 
                  style={[styles.startExamBtn, { paddingHorizontal: rs(16), paddingVertical: rs(8), borderRadius: rs(12) }]}
                  onPress={() => router.push(`/exam/${exam.id}` as never)}
                >
                  <Text style={[styles.startExamBtnText, { fontSize: rs(13) }]}>ابدأ</Text>
                </PressableScale>
              </View>
            </PressableScale>
          ))}
        </MotionView>
      )}

      {!loadingExams && exams.length === 0 && selectedTopic && (
        <MotionView delay={180} style={[styles.empty, { marginTop: rs(24) }]}>
          <Ionicons name="search-outline" size={rs(56)} color={Colors.text.disabled} />
          <Text style={[styles.emptyTitle, { fontSize: rs(16), marginTop: rs(12), color: Colors.text.primary }]}>لا توجد امتحانات متوفرة</Text>
          <Text style={[styles.emptySubText, { fontSize: rs(13), marginTop: rs(4) }]}>جرب اختيار فصل أو موضوع آخر</Text>
        </MotionView>
      )}
    </ScrollView>
  );
}

const fieldStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOpacity: 0.02,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  containerDisabled: {
    backgroundColor: Colors.surfaceMuted,
    borderColor: Colors.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  containerOpen: {
    borderColor: Colors.primary,
    shadowOpacity: 0.04,
    shadowRadius: 20,
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
    fontFamily: 'Tajawal_500Medium',
    marginBottom: 2,
  },
  value: {
    color: Colors.text.primary,
    fontFamily: 'Tajawal_700Bold',
  },
  placeholder: {
    color: Colors.text.disabled,
    fontFamily: 'Tajawal_500Medium',
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
    fontFamily: 'Tajawal_500Medium',
  },
  optionTextSelected: {
    color: Colors.primary,
    fontFamily: 'Tajawal_700Bold',
  },
  emptyText: {
    color: Colors.text.disabled,
    textAlign: 'center',
    fontFamily: 'Tajawal_500Medium',
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: Colors.text.primary, fontFamily: 'Tajawal_800ExtraBold' },
  resetBtn: {
    backgroundColor: Colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.secondary,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  resetText: { color: Colors.primary, fontFamily: 'Tajawal_700Bold' },
  examsHeader: { flexDirection: 'row', alignItems: 'center' },
  examsHeaderLine: { flex: 1, height: 1, opacity: 0.2 },
  examsHeaderText: { color: Colors.primary, fontFamily: 'Tajawal_700Bold' },
  examCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.02,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  examRow: { flexDirection: 'row', alignItems: 'center' },
  examIconBox: { justifyContent: 'center', alignItems: 'center' },
  examTitle: { color: Colors.text.primary, fontFamily: 'Tajawal_700Bold' },
  examMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  examMetaItem: { flexDirection: 'row', alignItems: 'center' },
  examMeta: { color: Colors.text.secondary, fontFamily: 'Tajawal_500Medium' },
  startExamBtn: {
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.secondary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  startExamBtnText: { color: Colors.primary, fontFamily: 'Tajawal_700Bold' },
  empty: { alignItems: 'center' },
  emptyTitle: { color: Colors.text.primary, fontFamily: 'Tajawal_700Bold' },
  emptySubText: { color: Colors.text.disabled, fontFamily: 'Tajawal_500Medium' },
});