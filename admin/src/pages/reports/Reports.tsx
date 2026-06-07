import { useEffect, useState } from 'react';
import { getReports, updateReport } from '../../services/user.service';
import type { Report } from '../../types';
import { Flag, CheckCircle, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => { loadReports(); }, [filter]);

  async function loadReports() {
    setLoading(true);
    try {
      const data = await getReports(filter || undefined);
      setReports(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(id: string, status: string) {
    try {
      await updateReport(id, status);
      await loadReports();
      toast.success('تم تحديث حالة البلاغ');
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

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {[
          { value: '', label: 'الكل' },
          { value: 'PENDING', label: 'معلقة' },
          { value: 'REVIEWED', label: 'تمت المراجعة' },
          { value: 'RESOLVED', label: 'تم الحل' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
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
                <th className="text-right px-6 py-4 font-medium text-gray-600">المشكلة</th>
                <th className="text-right px-6 py-4 font-medium text-gray-600">الحالة</th>
                <th className="text-right px-6 py-4 font-medium text-gray-600">التاريخ</th>
                <th className="text-right px-6 py-4 font-medium text-gray-600">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reports.map(report => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{report.user?.name}</td>
                  <td className="px-6 py-4 text-gray-600">{report.question?.exam?.title}</td>
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
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
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

            <button
              onClick={() => setSelectedReport(null)}
              className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}