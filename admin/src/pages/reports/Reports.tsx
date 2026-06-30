import { useEffect, useState } from 'react';
import api from '../../utils/api';
import type { Report } from '../../types';
import {
  Flag, CheckCircle, Eye, Trash2, AlignLeft,
  XCircle, HelpCircle, MoreHorizontal,
} from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'SPELLING', label: 'خطأ إملائي', icon: AlignLeft, color: 'text-orange-600 bg-orange-50' },
  { value: 'WRONG_ANSWER', label: 'خطأ في الإجابة', icon: XCircle, color: 'text-red-600 bg-red-50' },
  { value: 'UNCLEAR', label: 'سؤال غير واضح', icon: HelpCircle, color: 'text-purple-600 bg-purple-50' },
  { value: 'OTHER', label: 'أخرى', icon: MoreHorizontal, color: 'text-gray-600 bg-gray-50' },
];

function getCategoryInfo(category: string) {
  return CATEGORIES.find(c => c.value === category) ?? CATEGORIES[3];
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => { loadReports(); loadStats(); }, [statusFilter, categoryFilter]);

  async function loadReports() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      const res = await api.get(`/reports/admin?${params.toString()}`);
      setReports(res.data.data);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      const res = await api.get('/reports/admin/stats');
      setStats(res.data.data);
    } catch {
      // تجاهل
    }
  }

  async function handleUpdateStatus(id: string, status: string) {
    try {
      await api.put(`/reports/admin/${id}`, { status });
      await loadReports();
      await loadStats();
      toast.success('تم تحديث حالة البلاغ');
      setSelectedReport(null);
    } catch {
      toast.error('حدث خطأ');
    }
  }

  async function handleUpdateCategory(id: string, category: string) {
    try {
      await api.put(`/reports/admin/${id}`, { category });
      await loadReports();
      await loadStats();
      toast.success('تم تحديث تصنيف البلاغ');
      setSelectedReport(prev => prev ? { ...prev, category } as Report : null);
    } catch {
      toast.error('حدث خطأ');
    }
  }

  async function handleDeleteReport(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا البلاغ؟')) return;
    try {
      await api.delete(`/reports/admin/${id}`);
      await loadReports();
      await loadStats();
      toast.success('تم حذف البلاغ');
      setSelectedReport(null);
    } catch {
      toast.error('حدث خطأ');
    }
  }

  const statusLabel = (status: string) => {
    if (status === 'PENDING') return 'معلق';
    if (status === 'REVIEWED') return 'تمت المراجعة';
    return 'تم الحل';
  };

  const statusColor = (status: string) => {
    if (status === 'PENDING') return 'bg-yellow-100 text-yellow-700';
    if (status === 'REVIEWED') return 'bg-blue-100 text-blue-700';
    return 'bg-green-100 text-green-700';
  };

  return (
    <div className="p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">البلاغات</h1>
          <p className="text-sm text-gray-500">{reports.length} بلاغ</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">إجمالي البلاغات</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">معلقة</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">تم الحل</p>
            <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
          </div>
          {stats.byCategory?.map((c: any) => {
            const info = getCategoryInfo(c.category);
            return (
              <div key={c.category} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500 mb-1 truncate">{info.label}</p>
                <p className={`text-2xl font-bold ${info.color.split(' ')[0]}`}>{c.count}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="flex gap-2">
          {[
            { value: '', label: 'كل الحالات' },
            { value: 'PENDING', label: 'معلقة' },
            { value: 'REVIEWED', label: 'تمت المراجعة' },
            { value: 'RESOLVED', label: 'تم الحل' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                statusFilter === f.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="w-px bg-gray-200 mx-1" />
        <div className="flex gap-2">
          <button
            onClick={() => setCategoryFilter('')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              categoryFilter === ''
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            كل التصنيفات
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setCategoryFilter(c.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 ${
                categoryFilter === c.value
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <c.icon size={14} />
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reports */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Flag size={48} className="mx-auto mb-3 opacity-30" />
          <p>لا توجد بلاغات</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-right px-6 py-4 font-medium text-gray-600">الطالب</th>
                <th className="text-right px-6 py-4 font-medium text-gray-600">الامتحان</th>
                <th className="text-right px-6 py-4 font-medium text-gray-600">التصنيف</th>
                <th className="text-right px-6 py-4 font-medium text-gray-600">المشكلة</th>
                <th className="text-right px-6 py-4 font-medium text-gray-600">الحالة</th>
                <th className="text-right px-6 py-4 font-medium text-gray-600">التاريخ</th>
                <th className="text-right px-6 py-4 font-medium text-gray-600">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reports.map(report => {
                const catInfo = getCategoryInfo((report as any).category);
                return (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{report.user?.name}</td>
                    <td className="px-6 py-4 text-gray-600">{report.question?.exam?.title}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${catInfo.color}`}>
                        <catInfo.icon size={12} />
                        {catInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{report.message}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(report.status)}`}>
                        {statusLabel(report.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString('ar-IQ')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg"
                          title="عرض التفاصيل"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteReport(report.id)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-lg"
                          title="حذف البلاغ"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-bold text-gray-900 mb-4">تفاصيل البلاغ</h2>

            <div className="space-y-3 mb-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">الطالب</p>
                <p className="font-medium text-gray-900">{selectedReport.user?.name}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">السؤال</p>
                <p className="text-gray-900 text-right">{selectedReport.question?.text}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4">
                <p className="text-xs text-red-500 mb-1">المشكلة المبلغ عنها</p>
                <p className="text-gray-900 text-right">{selectedReport.message}</p>
              </div>
            </div>

            {/* Category Selection */}
            <p className="text-xs text-gray-500 mb-2">تصنيف البلاغ</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {CATEGORIES.map(c => {
                const isActive = (selectedReport as any).category === c.value;
                return (
                  <button
                    key={c.value}
                    onClick={() => handleUpdateCategory(selectedReport.id, c.value)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-sm font-medium transition-colors border ${
                      isActive
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <c.icon size={16} />
                    {c.label}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 mb-4">
              {['REVIEWED', 'RESOLVED'].map(status => (
                <button
                  key={status}
                  onClick={() => handleUpdateStatus(selectedReport.id, status)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    status === 'RESOLVED'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <CheckCircle size={16} className="inline ml-1" />
                  {statusLabel(status)}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleDeleteReport(selectedReport.id)}
                className="flex-1 bg-red-50 text-red-600 py-2.5 rounded-xl font-medium hover:bg-red-100"
              >
                <Trash2 size={16} className="inline ml-1" />
                حذف البلاغ
              </button>
              <button
                onClick={() => setSelectedReport(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}