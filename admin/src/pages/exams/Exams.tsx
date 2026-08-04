import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Plus, Pencil, Trash2, BookOpen, Clock, FileText, X } from 'lucide-react';
import toast from 'react-hot-toast';
import RichEditor, { richBlocksToText } from '../../components/RichEditor';
import type { RichBlock } from '../../components/RichEditor';
import 'katex/dist/katex.min.css';

interface Subject { id: string; name: string; }
interface Chapter { id: string; name: string; }
interface Exam {
  id: string; title: string; type: string; year?: number; round?: number;
  duration: number; isActive: boolean; chapterId?: string; topicId?: string;
  subject: { name: string }; chapter?: { name: string }; topic?: { name: string };
  _count: { questions: number; sessions: number };
}
interface Question {
  id: string; text: string; modelAnswer: string; degree: number;
  aiNotes?: string; order: number; modelImages: string[];
  richContent?: RichBlock[]; richModelAnswer?: RichBlock[];
}

export default function ExamsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const [examForm, setExamForm] = useState({
    title: '', type: 'CHAPTER', chapterId: '', topicId: '',
    year: '', round: '', duration: '60',
  });

  const [questionForm, setQuestionForm] = useState({
    text: '', modelAnswer: '', degree: '10', aiNotes: '', order: '0',
  });

  const [useRichText, setUseRichText] = useState(false);
  const [richContent, setRichContent] = useState<RichBlock[]>([]);
  const [richModelAnswer, setRichModelAnswer] = useState<RichBlock[]>([]);

  useEffect(() => { loadSubjects(); }, []);
  useEffect(() => { if (selectedSubject) { loadChapters(); loadExams(); } }, [selectedSubject]);
  useEffect(() => { if (selectedExam) loadQuestions(); }, [selectedExam]);

  async function loadSubjects() {
    const res = await api.get('/subjects/admin');
    setSubjects(res.data.data);
  }

  async function loadChapters() {
    const res = await api.get(`/subjects/${selectedSubject}/chapters`);
    setChapters(res.data.data);
  }

  async function loadExams() {
    setLoading(true);
    try {
      const res = await api.get(`/exams/admin?subjectId=${selectedSubject}`);
      setExams(res.data.data);
    } finally {
      setLoading(false);
    }
  }

  async function loadQuestions() {
    if (!selectedExam) return;
    const res = await api.get(`/exams/${selectedExam.id}/questions`);
    setQuestions(res.data.data);
  }

  function openAddExam() {
    setEditingExam(null);
    setExamForm({ title: '', type: 'CHAPTER', chapterId: '', topicId: '', year: '', round: '', duration: '60' });
    setShowExamModal(true);
  }

  function openEditExam(exam: Exam) {
    setEditingExam(exam);
    setExamForm({
      title: exam.title, type: exam.type,
      chapterId: exam.chapterId ?? '', topicId: exam.topicId ?? '',
      year: exam.year?.toString() ?? '', round: exam.round?.toString() ?? '',
      duration: exam.duration.toString(),
    });
    setShowExamModal(true);
  }

  function openAddQuestion() {
    setEditingQuestion(null);
    setQuestionForm({ text: '', modelAnswer: '', degree: '10', aiNotes: '', order: '0' });
    setUseRichText(false);
    setRichContent([]);
    setRichModelAnswer([]);
    setShowQuestionModal(true);
  }

  function openEditQuestion(q: Question) {
    setEditingQuestion(q);
    setQuestionForm({
      text: q.text, modelAnswer: q.modelAnswer,
      degree: q.degree.toString(), aiNotes: q.aiNotes ?? '', order: q.order.toString(),
    });
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

  async function handleSaveExam() {
    try {
      const payload = {
        ...examForm,
        subjectId: selectedSubject,
        year: examForm.year ? parseInt(examForm.year) : undefined,
        round: examForm.round ? parseInt(examForm.round) : undefined,
        duration: parseInt(examForm.duration),
      };

      if (editingExam) {
        await api.put(`/exams/${editingExam.id}`, payload);
        toast.success('تم تحديث الامتحان');
      } else {
        await api.post('/exams', payload);
        toast.success('تم إضافة الامتحان');
      }
      setShowExamModal(false);
      await loadExams();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'حدث خطأ');
    }
  }

  async function handleDeleteExam(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا الامتحان؟')) return;
    try {
      await api.delete(`/exams/${id}`);
      toast.success('تم حذف الامتحان');
      if (selectedExam?.id === id) setSelectedExam(null);
      await loadExams();
    } catch {
      toast.error('حدث خطأ');
    }
  }

  async function handleSaveQuestion() {
    if (!selectedExam) return;
    try {
      const payload = {
        text: useRichText ? richBlocksToText(richContent) : questionForm.text,
        modelAnswer: useRichText ? richBlocksToText(richModelAnswer) : questionForm.modelAnswer,
        richContent: useRichText && richContent.length > 0 ? richContent : null,
        richModelAnswer: useRichText && richModelAnswer.length > 0 ? richModelAnswer : null,
        degree: parseFloat(questionForm.degree),
        aiNotes: questionForm.aiNotes || null,
        order: parseInt(questionForm.order),
      };

      if (editingQuestion) {
        await api.put(`/exams/questions/${editingQuestion.id}`, payload);
        toast.success('تم تحديث السؤال');
      } else {
        await api.post(`/exams/${selectedExam.id}/questions`, payload);
        toast.success('تم إضافة السؤال');
      }
      setShowQuestionModal(false);
      await loadQuestions();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'حدث خطأ');
    }
  }

  async function handleDeleteQuestion(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا السؤال؟')) return;
    try {
      await api.delete(`/exams/questions/${id}`);
      toast.success('تم حذف السؤال');
      await loadQuestions();
    } catch {
      toast.error('حدث خطأ');
    }
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">الامتحانات</h1>
      </div>

      {/* Subject Select */}
      <div className="flex gap-3 mb-6">
        <select
          value={selectedSubject}
          onChange={e => { setSelectedSubject(e.target.value); setSelectedExam(null); }}
          className="border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">اختر المادة</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        {selectedSubject && (
          <button onClick={openAddExam}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700">
            <Plus size={18} /> إضافة امتحان
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exams List */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3">الامتحانات</h2>
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : exams.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <BookOpen size={40} className="mx-auto mb-2 opacity-30" />
              <p>{selectedSubject ? 'لا توجد امتحانات' : 'اختر مادة أولاً'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exams.map(exam => (
                <div key={exam.id}
                  onClick={() => setSelectedExam(exam)}
                  className={`bg-white rounded-2xl p-4 border cursor-pointer transition-all ${
                    selectedExam?.id === exam.id
                      ? 'border-blue-500 shadow-md shadow-blue-100'
                      : 'border-gray-100 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{exam.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <FileText size={12} /> {exam._count.questions} سؤال
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {exam.duration} دقيقة
                        </span>
                        <span className={`px-2 py-0.5 rounded-full ${
                          exam.type === 'WIZARI' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {exam.type === 'WIZARI' ? 'وزاري' : 'فصل'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={e => { e.stopPropagation(); openEditExam(exam); }}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg">
                        <Pencil size={15} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); handleDeleteExam(exam.id); }}
                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Questions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-800">
              {selectedExam ? `أسئلة: ${selectedExam.title}` : 'اختر امتحاناً'}
            </h2>
            {selectedExam && (
              <button onClick={openAddQuestion}
                className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-xl text-sm hover:bg-green-700">
                <Plus size={16} /> إضافة سؤال
              </button>
            )}
          </div>

          {!selectedExam ? (
            <div className="text-center py-10 text-gray-400">
              <FileText size={40} className="mx-auto mb-2 opacity-30" />
              <p>اختر امتحاناً لعرض أسئلته</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p>لا توجد أسئلة بعد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q, index) => (
                <div key={q.id} className="bg-white rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          س{index + 1}
                        </span>
                        <span className="text-xs text-gray-500">{q.degree} درجة</span>
                        {q.richContent && q.richContent.length > 0 && (
                          <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">LaTeX</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-800 line-clamp-2">{q.text}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEditQuestion(q)}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDeleteQuestion(q.id)}
                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Exam Modal */}
      {showExamModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {editingExam ? 'تعديل امتحان' : 'إضافة امتحان'}
              </h2>
              <button onClick={() => setShowExamModal(false)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم الامتحان</label>
                <input type="text" value={examForm.title}
                  onChange={e => setExamForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">النوع</label>
                <select value={examForm.type}
                  onChange={e => setExamForm(p => ({ ...p, type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CHAPTER">فصل محدد</option>
                  <option value="WIZARI">وزاري شامل</option>
                </select>
              </div>

              {examForm.type === 'CHAPTER' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الفصل</label>
                  <select value={examForm.chapterId}
                    onChange={e => setExamForm(p => ({ ...p, chapterId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">اختر الفصل</option>
                    {chapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {examForm.type === 'WIZARI' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">السنة</label>
                    <input type="number" value={examForm.year}
                      onChange={e => setExamForm(p => ({ ...p, year: e.target.value }))}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الدور</label>
                    <input type="number" value={examForm.round}
                      onChange={e => setExamForm(p => ({ ...p, round: e.target.value }))}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">مدة الامتحان (دقيقة)</label>
                <input type="number" value={examForm.duration}
                  onChange={e => setExamForm(p => ({ ...p, duration: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleSaveExam}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700">
                {editingExam ? 'تحديث' : 'إضافة'}
              </button>
              <button onClick={() => setShowExamModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200">
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {editingQuestion ? 'تعديل سؤال' : 'إضافة سؤال'}
              </h2>
              <button onClick={() => setShowQuestionModal(false)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">

              {/* Toggle نمط المحتوى */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="text-sm font-medium text-gray-700 flex-1">نمط المحتوى</span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setUseRichText(false)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      !useRichText ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}>
                    نص عادي
                  </button>
                  <button type="button" onClick={() => setUseRichText(true)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      useRichText ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}>
                    نص + معادلات
                  </button>
                </div>
              </div>

              {/* السؤال */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">السؤال</label>
                {useRichText ? (
                  <RichEditor
                    value={richContent}
                    onChange={setRichContent}
                    placeholder="أضف نصاً أو معادلة للسؤال..."
                  />
                ) : (
                  <textarea value={questionForm.text}
                    onChange={e => setQuestionForm(p => ({ ...p, text: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                )}
              </div>

              {/* الإجابة النموذجية */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الإجابة النموذجية</label>
                {useRichText ? (
                  <RichEditor
                    value={richModelAnswer}
                    onChange={setRichModelAnswer}
                    placeholder="أضف نصاً أو معادلة للإجابة..."
                  />
                ) : (
                  <textarea value={questionForm.modelAnswer}
                    onChange={e => setQuestionForm(p => ({ ...p, modelAnswer: e.target.value }))}
                    rows={4}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                )}
              </div>

              {/* الدرجة والترتيب */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الدرجة</label>
                  <input type="number" value={questionForm.degree}
                    onChange={e => setQuestionForm(p => ({ ...p, degree: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الترتيب</label>
                  <input type="number" value={questionForm.order}
                    onChange={e => setQuestionForm(p => ({ ...p, order: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* ملاحظات للذكاء الاصطناعي */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ملاحظات للذكاء الاصطناعي
                  <span className="text-gray-400 text-xs mr-1">(لا تظهر للطالب)</span>
                </label>
                <textarea value={questionForm.aiNotes}
                  onChange={e => setQuestionForm(p => ({ ...p, aiNotes: e.target.value }))}
                  rows={2}
                  placeholder="تعليمات خاصة للذكاء الاصطناعي عند التصحيح..."
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleSaveQuestion}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700">
                {editingQuestion ? 'تحديث' : 'إضافة'}
              </button>
              <button onClick={() => setShowQuestionModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}