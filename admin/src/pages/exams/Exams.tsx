import { useEffect, useState } from 'react';
import {
  getExams, createExam, updateExam, deleteExam,
  getQuestions, createQuestion, updateQuestion, deleteQuestion,
} from '../../services/exam.service';
import { getSubjects, getChapters, getTopics } from '../../services/subject.service';
import type { Exam, Question, Subject, Chapter, Topic, RichBlock } from '../../types';
import { Plus, Pencil, Trash2, ChevronLeft, FileText, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import RichEditor, { richBlocksToText } from '../../components/RichEditor';
import 'katex/dist/katex.min.css';

type View = 'exams' | 'questions';

export default function ExamsPage() {
  const [view, setView] = useState<View>('exams');
  const [exams, setExams] = useState<Exam[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExamModal, setShowExamModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editExam, setEditExam] = useState<Exam | null>(null);
  const [editQuestion, setEditQuestion] = useState<Question | null>(null);

  // Exam Form
  const [examForm, setExamForm] = useState({
    title: '', subjectId: '', type: 'WIZARI',
    chapterId: '', topicId: '', year: '', round: '', duration: '60',
  });

  // Question Form
  const [questionForm, setQuestionForm] = useState({
    text: '', modelAnswer: '', degree: '10', aiNotes: '', order: '0',
  });

  // ═══ جديد: حالة محرر LaTeX ═══
  const [useRichText, setUseRichText] = useState(false);
  const [richContent, setRichContent] = useState<RichBlock[]>([]);
  const [richModelAnswer, setRichModelAnswer] = useState<RichBlock[]>([]);

  useEffect(() => {
    loadExams();
    getSubjects().then(setSubjects);
  }, []);

  useEffect(() => {
    if (examForm.subjectId) {
      getChapters(examForm.subjectId).then(setChapters);
    }
  }, [examForm.subjectId]);

  useEffect(() => {
    if (examForm.chapterId) {
      getTopics(examForm.chapterId).then(setTopics);
    }
  }, [examForm.chapterId]);

  async function loadExams() {
    setLoading(true);
    try {
      const data = await getExams();
      setExams(data);
    } finally {
      setLoading(false);
    }
  }

  async function loadQuestions(exam: Exam) {
    setLoading(true);
    setSelectedExam(exam);
    try {
      const data = await getQuestions(exam.id);
      setQuestions(data);
      setView('questions');
    } finally {
      setLoading(false);
    }
  }

  function openAddExam() {
    setEditExam(null);
    setExamForm({ title: '', subjectId: '', type: 'WIZARI', chapterId: '', topicId: '', year: '', round: '', duration: '60' });
    setShowExamModal(true);
  }

  function openEditExam(exam: Exam) {
    setEditExam(exam);
    setExamForm({
      title: exam.title,
      subjectId: exam.subjectId,
      type: exam.type,
      chapterId: exam.chapterId ?? '',
      topicId: exam.topicId ?? '',
      year: exam.year?.toString() ?? '',
      round: exam.round?.toString() ?? '',
      duration: exam.duration.toString(),
    });
    setShowExamModal(true);
  }

  async function handleSaveExam() {
    if (!examForm.title || !examForm.subjectId || !examForm.duration) {
      toast.error('الحقول المطلوبة ناقصة');
      return;
    }
    try {
      if (editExam) {
        await updateExam(editExam.id, {
          title: examForm.title,
          duration: parseInt(examForm.duration),
        });
        toast.success('تم تحديث الامتحان');
      } else {
        await createExam({
          title: examForm.title,
          subjectId: examForm.subjectId,
          type: examForm.type as 'WIZARI' | 'CHAPTER',
          chapterId: examForm.chapterId || undefined,
          topicId: examForm.topicId || undefined,
          year: examForm.year ? parseInt(examForm.year) : undefined,
          round: examForm.round ? parseInt(examForm.round) : undefined,
          duration: parseInt(examForm.duration),
        });
        toast.success('تم إضافة الامتحان');
      }
      await loadExams();
      setShowExamModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'حدث خطأ');
    }
  }

  async function handleDeleteExam(id: string) {
    if (!confirm('هل أنت متأكد من حذف الامتحان؟')) return;
    try {
      await deleteExam(id);
      await loadExams();
      toast.success('تم حذف الامتحان');
    } catch {
      toast.error('حدث خطأ');
    }
  }

  function openAddQuestion() {
    setEditQuestion(null);
    setQuestionForm({ text: '', modelAnswer: '', degree: '10', aiNotes: '', order: '0' });
    // ═══ جديد: تصفير محرر LaTeX ═══
    setUseRichText(false);
    setRichContent([]);
    setRichModelAnswer([]);
    setShowQuestionModal(true);
  }

  function openEditQuestion(q: Question) {
    setEditQuestion(q);
    setQuestionForm({
      text: q.text,
      modelAnswer: q.modelAnswer,
      degree: q.degree.toString(),
      aiNotes: q.aiNotes ?? '',
      order: q.order.toString(),
    });
    // ═══ جديد: تحميل محتوى LaTeX إن وجد ═══
    if (q.richContent && q.richContent.length > 0) {
      setUseRichText(true);
      setRichContent(q.richContent);
      setRichModelAnswer(q.richModelAnswer ?? []);
    } else {
      setUseRichText(false);
      setRichContent([]);
      setRichModelAnswer([]);
    }
    setShowQuestionModal(true);
  }

  async function handleSaveQuestion() {
    // ═══ جديد: التحقق حسب نمط المحتوى ═══
    const finalText = useRichText ? richBlocksToText(richContent) : questionForm.text;
    const finalModelAnswer = useRichText ? richBlocksToText(richModelAnswer) : questionForm.modelAnswer;

    if (!finalText || !finalModelAnswer || !questionForm.degree) {
      toast.error('السؤال والإجابة النموذجية والدرجة مطلوبة');
      return;
    }
    try {
      const payload = {
  text: finalText,
  modelAnswer: finalModelAnswer,
  degree: parseFloat(questionForm.degree),
  aiNotes: questionForm.aiNotes || undefined,
  order: parseInt(questionForm.order),
  richContent: useRichText && richContent.length > 0 ? richContent : undefined,
  richModelAnswer: useRichText && richModelAnswer.length > 0 ? richModelAnswer : undefined,
};

      if (editQuestion) {
        await updateQuestion(editQuestion.id, payload);
        toast.success('تم تحديث السؤال');
      } else {
        await createQuestion(selectedExam!.id, payload);
        toast.success('تم إضافة السؤال');
      }
      await loadQuestions(selectedExam!);
      setShowQuestionModal(false);
    } catch {
      toast.error('حدث خطأ');
    }
  }

  async function handleDeleteQuestion(id: string) {
    if (!confirm('هل أنت متأكد من حذف السؤال؟')) return;
    try {
      await deleteQuestion(id);
      await loadQuestions(selectedExam!);
      toast.success('تم حذف السؤال');
    } catch {
      toast.error('حدث خطأ');
    }
  }

  return (
    <div className="p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {view === 'questions' && (
            <button onClick={() => setView('exams')} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {view === 'exams' ? 'الامتحانات' : `أسئلة: ${selectedExam?.title}`}
            </h1>
            {view === 'questions' && (
              <p className="text-sm text-gray-500">{questions.length} سؤال</p>
            )}
          </div>
        </div>
        <button
          onClick={view === 'exams' ? openAddExam : openAddQuestion}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus size={18} />
          {view === 'exams' ? 'إضافة امتحان' : 'إضافة سؤال'}
        </button>
      </div>

      {/* Exams Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : view === 'exams' ? (
        exams.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <FileText size={48} className="mx-auto mb-3 opacity-30" />
            <p>لا توجد امتحانات بعد</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-right px-6 py-4 font-medium text-gray-600">العنوان</th>
                  <th className="text-right px-6 py-4 font-medium text-gray-600">المادة</th>
                  <th className="text-right px-6 py-4 font-medium text-gray-600">النوع</th>
                  <th className="text-right px-6 py-4 font-medium text-gray-600">الأسئلة</th>
                  <th className="text-right px-6 py-4 font-medium text-gray-600">المدة</th>
                  <th className="text-right px-6 py-4 font-medium text-gray-600">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {exams.map(exam => (
                  <tr key={exam.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{exam.title}</td>
                    <td className="px-6 py-4 text-gray-600">{exam.subject?.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        exam.type === 'WIZARI'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {exam.type === 'WIZARI' ? 'وزاري' : 'فصل'}
                        {exam.year && ` ${exam.year}`}
                        {exam.round && ` د${exam.round}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{exam._count?.questions ?? 0}</td>
                    <td className="px-6 py-4 text-gray-600">{exam.duration} د</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => loadQuestions(exam)}
                          className="p-2 hover:bg-green-50 text-green-600 rounded-lg"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => openEditExam(exam)}
                          className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteExam(exam.id)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        // Questions View
        questions.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <FileText size={48} className="mx-auto mb-3 opacity-30" />
            <p>لا توجد أسئلة بعد</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, index) => (
              <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {q.degree} درجة
                      </span>
                      {/* ═══ جديد: شارة LaTeX ═══ */}
                      {q.richContent && q.richContent.length > 0 && (
                        <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                          LaTeX
                        </span>
                      )}
                    </div>
                    <p className="text-gray-900 font-medium mb-2 text-right">{q.text}</p>
                    <div className="bg-green-50 rounded-xl p-3">
                      <p className="text-xs text-green-600 font-medium mb-1">الإجابة النموذجية:</p>
                      <p className="text-sm text-gray-700 text-right">{q.modelAnswer}</p>
                    </div>
                    {q.aiNotes && (
                      <div className="bg-yellow-50 rounded-xl p-3 mt-2">
                        <p className="text-xs text-yellow-600 font-medium mb-1">ملاحظات للذكاء الاصطناعي:</p>
                        <p className="text-sm text-gray-700 text-right">{q.aiNotes}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => openEditQuestion(q)}
                      className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-2 hover:bg-red-50 text-red-600 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Exam Modal */}
      {showExamModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {editExam ? 'تعديل امتحان' : 'إضافة امتحان'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">العنوان</label>
                <input
                  type="text"
                  value={examForm.title}
                  onChange={e => setExamForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="عنوان الامتحان"
                />
              </div>

              {!editExam && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">المادة</label>
                    <select
                      value={examForm.subjectId}
                      onChange={e => setExamForm(p => ({ ...p, subjectId: e.target.value, chapterId: '', topicId: '' }))}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">اختر المادة</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">النوع</label>
                    <select
                      value={examForm.type}
                      onChange={e => setExamForm(p => ({ ...p, type: e.target.value, chapterId: '', topicId: '', year: '', round: '' }))}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="WIZARI">وزاري شامل</option>
                      <option value="CHAPTER">فصل محدد</option>
                    </select>
                  </div>

                  {examForm.type === 'WIZARI' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">السنة</label>
                        <input
                          type="number"
                          value={examForm.year}
                          onChange={e => setExamForm(p => ({ ...p, year: e.target.value }))}
                          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="2025"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">الدور</label>
                        <select
                          value={examForm.round}
                          onChange={e => setExamForm(p => ({ ...p, round: e.target.value }))}
                          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">اختر الدور</option>
                          <option value="1">الدور الأول</option>
                          <option value="2">الدور الثاني</option>
                          <option value="3">الدور الثالث</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {examForm.type === 'CHAPTER' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">الفصل</label>
                        <select
                          value={examForm.chapterId}
                          onChange={e => setExamForm(p => ({ ...p, chapterId: e.target.value, topicId: '' }))}
                          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">اختر الفصل</option>
                          {chapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      {topics.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">الموضوع (اختياري)</label>
                          <select
                            value={examForm.topicId}
                            onChange={e => setExamForm(p => ({ ...p, topicId: e.target.value }))}
                            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">بدون موضوع</option>
                            {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">مدة الامتحان (دقيقة)</label>
                <input
                  type="number"
                  value={examForm.duration}
                  onChange={e => setExamForm(p => ({ ...p, duration: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSaveExam} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700">
                حفظ
              </button>
              <button onClick={() => setShowExamModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {editQuestion ? 'تعديل سؤال' : 'إضافة سؤال'}
            </h2>
            <div className="space-y-4">

              {/* ═══ جديد: Toggle نمط المحتوى ═══ */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="text-sm font-medium text-gray-700 flex-1">نمط المحتوى</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setUseRichText(false)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      !useRichText ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    نص عادي
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseRichText(true)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      useRichText ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    نص + معادلات
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نص السؤال</label>
                {/* ═══ جديد: RichEditor أو textarea حسب النمط ═══ */}
                {useRichText ? (
                  <RichEditor
                    value={richContent}
                    onChange={setRichContent}
                    placeholder="أضف نصاً أو معادلة للسؤال..."
                  />
                ) : (
                  <textarea
                    value={questionForm.text}
                    onChange={e => setQuestionForm(p => ({ ...p, text: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="اكتب السؤال هنا..."
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الإجابة النموذجية</label>
                {useRichText ? (
                  <RichEditor
                    value={richModelAnswer}
                    onChange={setRichModelAnswer}
                    placeholder="أضف نصاً أو معادلة للإجابة..."
                  />
                ) : (
                  <textarea
                    value={questionForm.modelAnswer}
                    onChange={e => setQuestionForm(p => ({ ...p, modelAnswer: e.target.value }))}
                    rows={4}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="اكتب الإجابة النموذجية..."
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الدرجة</label>
                <input
                  type="number"
                  value={questionForm.degree}
                  onChange={e => setQuestionForm(p => ({ ...p, degree: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ملاحظات للذكاء الاصطناعي
                  <span className="text-gray-400 text-xs mr-1">(لا تظهر للطالب)</span>
                </label>
                <textarea
                  value={questionForm.aiNotes}
                  onChange={e => setQuestionForm(p => ({ ...p, aiNotes: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="ملاحظات تساعد الذكاء الاصطناعي في التصحيح..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الترتيب</label>
                <input
                  type="number"
                  value={questionForm.order}
                  onChange={e => setQuestionForm(p => ({ ...p, order: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSaveQuestion} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700">
                حفظ
              </button>
              <button onClick={() => setShowQuestionModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}