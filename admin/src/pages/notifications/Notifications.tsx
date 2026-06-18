import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Bell, Send, Users, User, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  title: string;
  body: string;
  sentBy: string;
  sentAt: string;
  totalSent: number;
}

interface Student {
  id: string;
  name: string;
  phone: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<'all' | 'single'>('all');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  const [form, setForm] = useState({ title: '', body: '' });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [notifRes, studentsRes] = await Promise.all([
        api.get('/notifications/admin/history'),
        api.get('/users/admin/users?limit=100'),
      ]);
      setNotifications(notifRes.data.data);
      setStudents(studentsRes.data.data);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendToAll() {
    if (!form.title || !form.body) {
      toast.error('العنوان والنص مطلوبان');
      return;
    }
    if (!confirm(`هل أنت متأكد من إرسال الإشعار لجميع الطلاب؟`)) return;

    setSending(true);
    try {
      const res = await api.post('/notifications/admin/send-to-all', form);
      toast.success(res.data.message);
      setForm({ title: '', body: '' });
      await loadData();
    } catch {
      toast.error('حدث خطأ في الإرسال');
    } finally {
      setSending(false);
    }
  }

  async function handleSendToUser() {
    if (!form.title || !form.body || !selectedStudent) {
      toast.error('اختر طالباً وأدخل العنوان والنص');
      return;
    }

    setSending(true);
    try {
      const res = await api.post('/notifications/admin/send-to-user', {
        userId: selectedStudent,
        ...form,
      });
      toast.success(res.data.message);
      setForm({ title: '', body: '' });
      setSelectedStudent('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'حدث خطأ في الإرسال');
    } finally {
      setSending(false);
    }
  }

  const filteredStudents = students.filter(s =>
    s.name.includes(studentSearch) || s.phone.includes(studentSearch)
  );

  const quickMessages = [
    { title: '🔥 تذكير الدراسة', body: 'لا تخسر سلسلة دراستك! أكمل امتحاناً اليوم.' },
    { title: '📘 امتحانات جديدة', body: 'تم إضافة امتحانات وزارية جديدة. ابدأ الآن!' },
    { title: '⭐ عرض خاص', body: 'اشترك الآن واستثمر وقتك في المراجعة.' },
  ];

  return (
    <div className="p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الإشعارات</h1>
          <p className="text-sm text-gray-500">إرسال إشعارات للطلاب</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send Section */}
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setTab('all')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                tab === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              <Users size={16} />
              لجميع الطلاب
            </button>
            <button
              onClick={() => setTab('single')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                tab === 'single' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              <User size={16} />
              طالب محدد
            </button>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">

            {/* Student Select */}
            {tab === 'single' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اختر الطالب</label>
                <input
                  type="text"
                  placeholder="بحث بالاسم أو الهاتف..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                />
                <select
                  value={selectedStudent}
                  onChange={e => setSelectedStudent(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- اختر طالب --</option>
                  {filteredStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.name} — {s.phone}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">عنوان الإشعار</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="مثال: تذكير بالدراسة 🔥"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نص الإشعار</label>
              <textarea
                value={form.body}
                onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                placeholder="اكتب نص الإشعار هنا..."
                rows={4}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <button
              onClick={tab === 'all' ? handleSendToAll : handleSendToUser}
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <Send size={18} />
                  {tab === 'all' ? 'إرسال لجميع الطلاب' : 'إرسال للطالب'}
                </>
              )}
            </button>
          </div>

          {/* Quick Messages */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-medium text-gray-900 mb-3">رسائل سريعة</h3>
            <div className="space-y-2">
              {quickMessages.map((msg, i) => (
                <button
                  key={i}
                  onClick={() => setForm({ title: msg.title, body: msg.body })}
                  className="w-full text-right p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <p className="font-medium text-gray-900 text-sm">{msg.title}</p>
                  <p className="text-gray-500 text-xs mt-1">{msg.body}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* History */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Clock size={18} />
              سجل الإشعارات
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Bell size={48} className="mx-auto mb-3 opacity-30" />
              <p>لا يوجد إشعارات مرسلة</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
              {notifications.map(n => (
                <div key={n.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{n.title}</p>
                      <p className="text-gray-500 text-xs mt-1">{n.body}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-400">
                          {new Date(n.sentAt).toLocaleDateString('ar-IQ')}
                        </span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          وصل لـ {n.totalSent} طالب
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}