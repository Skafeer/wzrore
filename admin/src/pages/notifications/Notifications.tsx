import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Bell, Send, Users, CreditCard, MapPin, Clock, History, Search, User } from 'lucide-react';
import toast from 'react-hot-toast';

const PROVINCES = [
  'بغداد', 'البصرة', 'نينوى', 'أربيل', 'النجف',
  'كربلاء', 'الأنبار', 'ديالى', 'صلاح الدين', 'بابل',
  'واسط', 'ميسان', 'ذي قار', 'المثنى', 'القادسية',
  'كركوك', 'السليمانية', 'دهوك',
];

type SendTarget = 'all' | 'subscribed' | 'province' | 'user';

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState<SendTarget>('all');
  const [province, setProvince] = useState('بغداد');
  const [scheduledAt, setScheduledAt] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // بحث الطالب
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => { loadHistory(); }, []);

  async function loadHistory() {
    setLoadingHistory(true);
    try {
      const res = await api.get('/notifications/admin/history');
      setHistory(res.data.data);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function searchUsers(q: string) {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await api.get(`/users/admin/users?search=${q}&limit=5`);
      setSearchResults(res.data.data);
    } finally {
      setSearching(false);
    }
  }

  async function handleSend() {
    if (!title.trim() || !body.trim()) {
      toast.error('العنوان والنص مطلوبان');
      return;
    }

    if (target === 'user' && !selectedUser) {
      toast.error('اختر طالباً');
      return;
    }

    if (isScheduled && !scheduledAt) {
      toast.error('حدد وقت الجدولة');
      return;
    }

    setSending(true);
    try {
      if (isScheduled) {
        await api.post('/notifications/admin/schedule', {
          title, body, scheduledAt,
          target: target === 'user' ? 'all' : target,
          province: target === 'province' ? province : undefined,
        });
        toast.success('تمت جدولة الإشعار بنجاح');
      } else if (target === 'all') {
        await api.post('/notifications/admin/all', { title, body });
        toast.success('تم إرسال الإشعار لجميع الطلاب');
      } else if (target === 'subscribed') {
        await api.post('/notifications/admin/send-to-subscribed', { title, body });
        toast.success('تم إرسال الإشعار للمشتركين');
      } else if (target === 'province') {
        await api.post('/notifications/admin/send-to-province', { title, body, province });
        toast.success(`تم إرسال الإشعار لطلاب ${province}`);
      } else if (target === 'user' && selectedUser) {
        await api.post('/notifications/admin/send-to-user', {
          userId: selectedUser.id, title, body,
        });
        toast.success(`تم إرسال الإشعار لـ ${selectedUser.name}`);
      }

      setTitle('');
      setBody('');
      setScheduledAt('');
      setIsScheduled(false);
      setSelectedUser(null);
      setUserSearch('');
      setSearchResults([]);
      await loadHistory();
    } catch {
      toast.error('حدث خطأ في الإرسال');
    } finally {
      setSending(false);
    }
  }

  const targets = [
    { value: 'all', label: 'الجميع', icon: Users },
    { value: 'subscribed', label: 'المشتركون', icon: CreditCard },
    { value: 'province', label: 'محافظة', icon: MapPin },
    { value: 'user', label: 'طالب محدد', icon: User },
  ];

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">الإشعارات</h1>
        <p className="text-sm text-gray-500 mt-1">إرسال إشعارات للطلاب</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Send Form */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
            <Send size={20} className="text-blue-600" />
            إرسال إشعار جديد
          </h2>

          {/* Target Selection */}
          <p className="text-sm font-medium text-gray-700 mb-3">إرسال إلى</p>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {targets.map(t => (
              <button
                key={t.value}
                onClick={() => { setTarget(t.value as SendTarget); setSelectedUser(null); setUserSearch(''); setSearchResults([]); }}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                  target === t.value
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <t.icon size={16} />
                {t.label}
              </button>
            ))}
          </div>

          {/* Province Select */}
          {target === 'province' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">اختر المحافظة</label>
              <select
                value={province}
                onChange={e => setProvince(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          )}

          {/* User Search */}
          {target === 'user' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">ابحث عن الطالب</label>
              {selectedUser ? (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {selectedUser.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedUser.name}</p>
                      <p className="text-xs text-gray-500">{selectedUser.phone}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setSelectedUser(null); setUserSearch(''); }}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    تغيير
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={e => { setUserSearch(e.target.value); searchUsers(e.target.value); }}
                    placeholder="ابحث بالاسم أو رقم الهاتف..."
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 pr-10 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {searching && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                    </div>
                  )}
                  {searchResults.length > 0 && (
                    <div className="absolute top-full right-0 left-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 mt-1 overflow-hidden">
                      {searchResults.map(user => (
                        <button
                          key={user.id}
                          onClick={() => { setSelectedUser(user); setSearchResults([]); setUserSearch(''); }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-right border-b border-gray-50 last:border-0"
                        >
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.phone} — {user.province}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">عنوان الإشعار</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="مثال: امتحانات جديدة متوفرة!"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Body */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">نص الإشعار</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="اكتب نص الإشعار هنا..."
              rows={4}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Schedule Toggle */}
          {target !== 'user' && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
              <Clock size={18} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700 flex-1">جدولة الإرسال</span>
              <button
                onClick={() => setIsScheduled(!isScheduled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  isScheduled ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  isScheduled ? 'right-1' : 'left-1'
                }`} />
              </button>
            </div>
          )}

          {/* Schedule DateTime */}
          {isScheduled && target !== 'user' && (
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">وقت الإرسال</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Preview */}
          {(title || body) && (
            <div className="mb-5 p-4 bg-gray-900 rounded-2xl">
              <p className="text-xs text-gray-400 mb-2">معاينة الإشعار</p>
              <div className="bg-white rounded-xl p-3 flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex-shrink-0 flex items-center justify-center">
                  <Bell size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{title || 'عنوان الإشعار'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{body || 'نص الإشعار'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={sending}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                {isScheduled ? <Clock size={18} /> : <Send size={18} />}
                {isScheduled ? 'جدولة الإشعار' : 'إرسال الآن'}
              </>
            )}
          </button>
        </div>

        {/* History */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
            <History size={20} className="text-blue-600" />
            سجل الإشعارات
          </h2>

          {loadingHistory ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Bell size={40} className="mx-auto mb-3 opacity-30" />
              <p>لا توجد إشعارات مرسلة</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {history.map((notif: any) => (
                <div key={notif.id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{notif.title}</p>
                      <p className="text-gray-500 text-xs mt-1">{notif.body}</p>
                    </div>
                    <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap">
                      {notif.totalSent} مستلم
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mt-2">
                    {new Date(notif.sentAt).toLocaleDateString('ar-IQ')} — {new Date(notif.sentAt).toLocaleTimeString('ar-IQ')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}