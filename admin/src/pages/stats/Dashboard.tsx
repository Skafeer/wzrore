import { useEffect, useState } from 'react';
import { getStats } from '../../services/user.service';
import type { Stats } from '../../types';
import {
  Users, FileText, BookOpen, CreditCard,
  Flag, CheckCircle, TrendingUp, Clock,
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats().then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const cards = [
    { label: 'إجمالي الطلاب', value: stats?.totalUsers ?? 0, icon: Users, color: 'bg-blue-500', light: 'bg-blue-50' },
    { label: 'الامتحانات', value: stats?.totalExams ?? 0, icon: BookOpen, color: 'bg-purple-500', light: 'bg-purple-50' },
    { label: 'جلسات الامتحان', value: stats?.totalSessions ?? 0, icon: FileText, color: 'bg-green-500', light: 'bg-green-50' },
    { label: 'المشتركون النشطون', value: stats?.activeSubscriptions ?? 0, icon: CreditCard, color: 'bg-yellow-500', light: 'bg-yellow-50' },
    { label: 'الامتحانات المكتملة', value: stats?.completedSessions ?? 0, icon: CheckCircle, color: 'bg-teal-500', light: 'bg-teal-50' },
    { label: 'البلاغات المعلقة', value: stats?.pendingReports ?? 0, icon: Flag, color: 'bg-red-500', light: 'bg-red-50' },
  ];

  return (
    <div className="p-6" dir="rtl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-gray-500 text-sm mt-1">نظرة عامة على المنصة</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{card.label}</p>
                <p className="text-3xl font-bold text-gray-900">{card.value.toLocaleString()}</p>
              </div>
              <div className={`w-12 h-12 ${card.light} rounded-xl flex items-center justify-center`}>
                <card.icon className={card.color.replace('bg-', 'text-')} size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Sessions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">آخر الامتحانات</h2>
        </div>

        {stats?.recentSessions?.length === 0 ? (
          <p className="text-gray-400 text-center py-8">لا توجد امتحانات بعد</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-100">
                  <th className="text-right pb-3 font-medium">الطالب</th>
                  <th className="text-right pb-3 font-medium">الامتحان</th>
                  <th className="text-right pb-3 font-medium">الدرجة</th>
                  <th className="text-right pb-3 font-medium">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats?.recentSessions?.map((session: any) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{session.user?.name}</td>
                    <td className="py-3 text-gray-600">{session.exam?.title}</td>
                    <td className="py-3">
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs font-medium">
                        {session.totalScore?.toFixed(1)} / {session.maxScore}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500 flex items-center gap-1">
                      <Clock size={13} />
                      {new Date(session.submittedAt).toLocaleDateString('ar-IQ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}