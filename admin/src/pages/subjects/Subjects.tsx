import { useEffect, useState } from 'react';
import {
  getSubjects, createSubject, updateSubject, deleteSubject,
  getChapters, createChapter, updateChapter, deleteChapter,
  getTopics, createTopic, updateTopic, deleteTopic,
} from '../../services/subject.service';
import type { Subject, Chapter, Topic } from '../../types';
import { Plus, Pencil, Trash2, ChevronLeft, BookOpen, Layers, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

type View = 'subjects' | 'chapters' | 'topics';

export default function SubjectsPage() {
  const [view, setView] = useState<View>('subjects');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Subject | Chapter | Topic | null>(null);
  const [formName, setFormName] = useState('');
  const [formOrder, setFormOrder] = useState(0);

  useEffect(() => { loadSubjects(); }, []);

  async function loadSubjects() {
    setLoading(true);
    try {
      const data = await getSubjects();
      setSubjects(data);
    } finally {
      setLoading(false);
    }
  }

  async function loadChapters(subject: Subject) {
    setLoading(true);
    setSelectedSubject(subject);
    try {
      const data = await getChapters(subject.id);
      setChapters(data);
      setView('chapters');
    } finally {
      setLoading(false);
    }
  }

  async function loadTopics(chapter: Chapter) {
    setLoading(true);
    setSelectedChapter(chapter);
    try {
      const data = await getTopics(chapter.id);
      setTopics(data);
      setView('topics');
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditItem(null);
    setFormName('');
    setFormOrder(0);
    setShowModal(true);
  }

  function openEdit(item: Subject | Chapter | Topic) {
    setEditItem(item);
    setFormName(item.name);
    setFormOrder(item.order);
    setShowModal(true);
  }

  async function handleSave() {
    if (!formName.trim()) { toast.error('الاسم مطلوب'); return; }
    try {
      if (view === 'subjects') {
        if (editItem) {
          await updateSubject(editItem.id, { name: formName, order: formOrder });
          toast.success('تم تحديث المادة');
        } else {
          await createSubject(formName, formOrder);
          toast.success('تم إضافة المادة');
        }
        await loadSubjects();
      } else if (view === 'chapters' && selectedSubject) {
        if (editItem) {
          await updateChapter(editItem.id, { name: formName, order: formOrder });
          toast.success('تم تحديث الفصل');
        } else {
          await createChapter(selectedSubject.id, formName, formOrder);
          toast.success('تم إضافة الفصل');
        }
        await loadChapters(selectedSubject);
      } else if (view === 'topics' && selectedChapter) {
        if (editItem) {
          await updateTopic(editItem.id, { name: formName, order: formOrder });
          toast.success('تم تحديث الموضوع');
        } else {
          await createTopic(selectedChapter.id, formName, formOrder);
          toast.success('تم إضافة الموضوع');
        }
        await loadTopics(selectedChapter);
      }
      setShowModal(false);
    } catch {
      toast.error('حدث خطأ');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    try {
      if (view === 'subjects') {
        await deleteSubject(id);
        await loadSubjects();
        toast.success('تم حذف المادة');
      } else if (view === 'chapters') {
        await deleteChapter(id);
        await loadChapters(selectedSubject!);
        toast.success('تم حذف الفصل');
      } else {
        await deleteTopic(id);
        await loadTopics(selectedChapter!);
        toast.success('تم حذف الموضوع');
      }
    } catch {
      toast.error('حدث خطأ في الحذف');
    }
  }

  async function toggleActive(subject: Subject) {
    try {
      await updateSubject(subject.id, { isActive: !subject.isActive });
      await loadSubjects();
      toast.success(subject.isActive ? 'تم إيقاف المادة' : 'تم تفعيل المادة');
    } catch {
      toast.error('حدث خطأ');
    }
  }

  const currentItems = view === 'subjects' ? subjects : view === 'chapters' ? chapters : topics;

  const viewLabels = {
    subjects: { title: 'المواد', icon: BookOpen },
    chapters: { title: `فصول ${selectedSubject?.name}`, icon: Layers },
    topics: { title: `مواضيع ${selectedChapter?.name}`, icon: FileText },
  };

  return (
    <div className="p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {view !== 'subjects' && (
            <button
              onClick={() => {
                if (view === 'topics') setView('chapters');
                else setView('subjects');
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{viewLabels[view].title}</h1>
            {view === 'chapters' && (
              <p className="text-sm text-gray-500">مادة: {selectedSubject?.name}</p>
            )}
            {view === 'topics' && (
              <p className="text-sm text-gray-500">فصل: {selectedChapter?.name}</p>
            )}
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus size={18} />
          إضافة {view === 'subjects' ? 'مادة' : view === 'chapters' ? 'فصل' : 'موضوع'}
        </button>
      </div>

      {/* Breadcrumb */}
      {view !== 'subjects' && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <button onClick={() => setView('subjects')} className="hover:text-blue-600">المواد</button>
          {view === 'topics' && (
            <>
              <span>/</span>
              <button onClick={() => setView('chapters')} className="hover:text-blue-600">
                {selectedSubject?.name}
              </button>
            </>
          )}
          <span>/</span>
          <span className="text-gray-900 font-medium">
            {view === 'chapters' ? selectedSubject?.name : selectedChapter?.name}
          </span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : currentItems.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
         {(() => {
  const Icon = viewLabels[view].icon;
  return <Icon size={48} className="mx-auto mb-3 opacity-30" />;
})()}
          <p>لا يوجد {view === 'subjects' ? 'مواد' : view === 'chapters' ? 'فصول' : 'مواضيع'} بعد</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-right px-6 py-4 font-medium text-gray-600">الاسم</th>
                <th className="text-right px-6 py-4 font-medium text-gray-600">الترتيب</th>
                {view === 'subjects' && (
                  <>
                    <th className="text-right px-6 py-4 font-medium text-gray-600">الفصول</th>
                    <th className="text-right px-6 py-4 font-medium text-gray-600">الحالة</th>
                  </>
                )}
                {view === 'chapters' && (
                  <th className="text-right px-6 py-4 font-medium text-gray-600">المواضيع</th>
                )}
                <th className="text-right px-6 py-4 font-medium text-gray-600">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {currentItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <button
                      onClick={() => {
                        if (view === 'subjects') loadChapters(item as Subject);
                        else if (view === 'chapters') loadTopics(item as Chapter);
                      }}
                      className={`font-medium text-gray-900 ${view !== 'topics' ? 'hover:text-blue-600 cursor-pointer' : ''}`}
                    >
                      {item.name}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{item.order}</td>
                  {view === 'subjects' && (
                    <>
                      <td className="px-6 py-4 text-gray-500">
                        {(item as Subject)._count?.chapters ?? 0} فصل
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleActive(item as Subject)}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            (item as Subject).isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {(item as Subject).isActive ? 'نشط' : 'موقوف'}
                        </button>
                      </td>
                    </>
                  )}
                  {view === 'chapters' && (
                    <td className="px-6 py-4 text-gray-500">
                      {(item as Chapter)._count?.topics ?? 0} موضوع
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
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
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {editItem ? 'تعديل' : 'إضافة'} {view === 'subjects' ? 'مادة' : view === 'chapters' ? 'فصل' : 'موضوع'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الاسم</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="أدخل الاسم"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الترتيب</label>
                <input
                  type="number"
                  value={formOrder}
                  onChange={e => setFormOrder(parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                حفظ
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}