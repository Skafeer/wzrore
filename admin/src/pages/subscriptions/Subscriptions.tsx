import { useEffect, useState } from 'react';
import {
  getCodes, createCodes, getLaunchPeriod, setLaunchPeriod,
} from '../../services/user.service';
import type { SubscriptionCode } from '../../types';
import { Plus, Copy, Check, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SubscriptionsPage() {
  const [codes, setCodes] = useState<SubscriptionCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'used' | 'unused'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [newCodes, setNewCodes] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [launch, setLaunch] = useState<{ startDate: string; endDate: string } | null>(null);

  const [createForm, setCreateForm] = useState({ plan: 'MONTHLY', count: '5' });
  const [launchForm, setLaunchForm] = useState({ startDate: '', endDate: '' });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [codesData, launchData] = await Promise.all([
        getCodes(),
        getLaunchPeriod().catch(() => null),
      ]);
      setCodes(codesData);
      setLaunch(launchData);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCodes() {
    try {
      const created = await createCodes(createForm.plan, parseInt(createForm.count));
      setNewCodes(created);
      await loadData();
      toast.success(`تم إنشاء ${createForm.count} كود`);
    } catch {
      toast.error('حدث خطأ');
    }
  }

  async function handleSetLaunch() {
    if (!launchForm.startDate || !launchForm.endDate) {
      toast.error('حدد تاريخ البداية والنهاية');
      return;
    }
    try {
      await setLaunchPeriod(launchForm.startDate, launchForm.endDate);
      await loadData();
      toast.success('تم تحديث فترة الإطلاق');
      setShowLaunchModal(false);
    } catch {
      toast.error('حدث خطأ');
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('تم نسخ الكود');
  }

  const filteredCodes = codes.filter(c => {
    if (filter === 'used') return c.isUsed;
    if (filter === 'unused') return !c.isUsed;
    return true;
  });

  const planLabel = (plan: string) => {
    if (plan === 'WEEKLY') return 'أسبوعي';
    if (plan === 'MONTHLY') return 'شهري';
    return 'سنوي';
  };

  return (
    <div className="p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">الاشتراكات</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowLaunchModal(true)}
            className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2.5 rounded-xl hover:bg-yellow-600 transition-colors text-sm font-medium"
          >
            <Calendar size={18} />
            فترة الإطلاق
          </button>
          <button
            onClick={() => { setShowCreateModal(true); setNewCodes([]); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus size={18} />
            إنشاء أكواد
          </button>
        </div>
      </div>

      {/* Launch Period Card */}
      {launch && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-yellow-600" />
            <span className="font-medium text-yellow-800">فترة الإطلاق المجانية</span>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            من {new Date(launch.startDate).toLocaleDateString('ar-IQ')} إلى {new Date(launch.endDate).toLocaleDateString('ar-IQ')}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-gray-900">{codes.length}</p>
          <p className="text-sm text-gray-500">إجمالي الأكواد</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-green-600">{codes.filter(c => c.isUsed).length}</p>
          <p className="text-sm text-gray-500">مستخدمة</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-blue-600">{codes.filter(c => !c.isUsed).length}</p>
          <p className="text-sm text-gray-500">متاحة</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(['all', 'unused', 'used'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {f === 'all' ? 'الكل' : f === 'unused' ? 'متاحة' : 'مستخدمة'}
          </button>
        ))}
      </div>

      {/* Codes Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-right px-6 py-4 font-medium text-gray-600">الكود</th>
                <th className="text-right px-6 py-4 font-medium text-gray-600">الباقة</th>
                <th className="text-right px-6 py-4 font-medium text-gray-600">الحالة</th>
                <th className="text-right px-6 py-4 font-medium text-gray-600">تاريخ الانتهاء</th>
                <th className="text-right px-6 py-4 font-medium text-gray-600">نسخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCodes.map(code => (
                <tr key={code.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-gray-900">{code.code}</td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                      {planLabel(code.plan)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      code.isUsed ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'
                    }`}>
                      {code.isUsed ? 'مستخدم' : 'متاح'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(code.expiresAt).toLocaleDateString('ar-IQ')}
                  </td>
                  <td className="px-6 py-4">
                    {!code.isUsed && (
                      <button
                        onClick={() => copyCode(code.code)}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg"
                      >
                        {copiedId === code.code ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Codes Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-4">إنشاء أكواد اشتراك</h2>

            {newCodes.length > 0 ? (
              <div>
                <p className="text-sm text-gray-600 mb-3">تم إنشاء {newCodes.length} كود:</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {newCodes.map(code => (
                    <div key={code} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2">
                      <span className="font-mono text-sm text-gray-900">{code}</span>
                      <button onClick={() => copyCode(code)} className="text-blue-600 hover:text-blue-700">
                        {copiedId === code ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-full mt-4 bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700"
                >
                  إغلاق
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الباقة</label>
                  <select
                    value={createForm.plan}
                    onChange={e => setCreateForm(p => ({ ...p, plan: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="WEEKLY">أسبوعي - 2,000 د.ع</option>
                    <option value="MONTHLY">شهري - 5,000 د.ع</option>
                    <option value="YEARLY">سنوي - 10,000 د.ع</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">عدد الأكواد</label>
                  <input
                    type="number"
                    value={createForm.count}
                    onChange={e => setCreateForm(p => ({ ...p, count: e.target.value }))}
                    min="1"
                    max="100"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCreateCodes}
                    className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700"
                  >
                    إنشاء
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Launch Period Modal */}
      {showLaunchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-4">تحديد فترة الإطلاق المجانية</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ البداية</label>
                <input
                  type="date"
                  value={launchForm.startDate}
                  onChange={e => setLaunchForm(p => ({ ...p, startDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ النهاية</label>
                <input
                  type="date"
                  value={launchForm.endDate}
                  onChange={e => setLaunchForm(p => ({ ...p, endDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSetLaunch}
                className="flex-1 bg-yellow-500 text-white py-2.5 rounded-xl font-medium hover:bg-yellow-600"
              >
                حفظ
              </button>
              <button
                onClick={() => setShowLaunchModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200"
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