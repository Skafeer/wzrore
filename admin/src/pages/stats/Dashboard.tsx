import { useEffect, useState } from 'react';
import api from '../../utils/api';
import {
  Users, BookOpen, Flag,
  TrendingUp, Clock, Trophy, AlertTriangle, DollarSign, BarChart2,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

const PROVINCE_COLORS = [
  '#1D4ED8', '#7C3AED', '#059669', '#D97706', '#DC2626',
  '#0891B2', '#65A30D', '#9333EA', '#EA580C', '#0284C7',
];

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  async function loadStats() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange.from) params.append('from', dateRange.from);
      if (dateRange.to) params.append('to', dateRange.to);
      const res = await api.get(`/stats/admin?${params.toString()}`);
      setStats(res.data.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadStats(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const s = stats;

  return (
    <div className="p-6 space-y-6" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
          <p className="text-gray-500 text-sm mt-1">إحصائيات شاملة للمنصة</p>
        </div>
        <div className="flex gap-3 items-center">
          <input type="date" value={dateRange.from}
            onChange={e => setDateRange(p => ({ ...p, from: e.target.value }))}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400">—</span>
          <input type="date" value={dateRange.to}
            onChange={e => setDateRange(p => ({ ...p, to: e.target.value }))}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={loadStats}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700">
            تطبيق
          </button>
        </div>
      </div>

      {/* المستخدمون */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Users size={20} className="text-blue-600" /> المستخدمون
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي الطلاب', value: s?.users?.total, color: 'blue' },
            { label: 'اليوم', value: s?.users?.today, color: 'green' },
            { label: 'هذا الأسبوع', value: s?.users?.thisWeek, color: 'purple' },
            { label: 'هذا الشهر', value: s?.users?.thisMonth, color: 'yellow' },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">{card.label}</p>
              <p className="text-3xl font-bold text-gray-900">{(card.value ?? 0).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* الامتحانات */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
          <BookOpen size={20} className="text-purple-600" /> الامتحانات
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي الامتحانات', value: s?.exams?.total },
            { label: 'الجلسات الكلية', value: s?.exams?.totalSessions },
            { label: 'المكتملة', value: s?.exams?.completedSessions },
            { label: 'مكتملة اليوم', value: s?.exams?.completedToday },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">{card.label}</p>
              <p className="text-3xl font-bold text-gray-900">{(card.value ?? 0).toLocaleString()}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">معدل الإكمال</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 bg-gray-100 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${s?.exams?.completionRate ?? 0}%` }}
              />
            </div>
            <span className="font-bold text-blue-600">{s?.exams?.completionRate ?? 0}%</span>
          </div>
        </div>
      </div>

      {/* الاشتراكات والإيرادات */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
          <DollarSign size={20} className="text-green-600" /> الاشتراكات والإيرادات
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {[
            { label: 'مشتركون نشطون', value: s?.subscriptions?.active, suffix: '' },
            { label: 'أسبوعي', value: s?.subscriptions?.weekly, suffix: '' },
            { label: 'شهري', value: s?.subscriptions?.monthly, suffix: '' },
            { label: 'سنوي', value: s?.subscriptions?.yearly, suffix: '' },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">{card.label}</p>
              <p className="text-3xl font-bold text-gray-900">{card.value ?? 0}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">الإيرادات التقديرية الإجمالية</p>
            <p className="text-3xl font-bold text-green-600">
              {(s?.subscriptions?.revenue?.total ?? 0).toLocaleString()} د.ع
            </p>
            <div className="mt-3 space-y-2 text-sm text-gray-500">
              <div className="flex justify-between">
                <span>أسبوعي</span>
                <span>{(s?.subscriptions?.revenue?.weekly ?? 0).toLocaleString()} د.ع</span>
              </div>
              <div className="flex justify-between">
                <span>شهري</span>
                <span>{(s?.subscriptions?.revenue?.monthly ?? 0).toLocaleString()} د.ع</span>
              </div>
              <div className="flex justify-between">
                <span>سنوي</span>
                <span>{(s?.subscriptions?.revenue?.yearly ?? 0).toLocaleString()} د.ع</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={18} className="text-yellow-500" />
              <p className="text-sm font-medium text-gray-700">اشتراكات تنتهي هذا الأسبوع</p>
            </div>
            <p className="text-3xl font-bold text-yellow-600">{s?.subscriptions?.expiringThisWeek ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1">يحتاجون تجديد قريباً</p>
          </div>
        </div>
      </div>

      {/* رسم بياني للتسجيلات */}
      {s?.dailyRegistrations?.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600" /> التسجيلات اليومية (آخر 7 أيام)
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={s.dailyRegistrations}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#1D4ED8" strokeWidth={2}
                fill="url(#colorUsers)" name="طالب جديد" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* أكثر المواد + أصعب الأسئلة */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* أكثر المواد استخداماً */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart2 size={20} className="text-purple-600" /> أكثر الامتحانات استخداماً
          </h2>
          {s?.topSubjects?.length === 0 ? (
            <p className="text-gray-400 text-center py-6">لا توجد بيانات</p>
          ) : (
            <div className="space-y-3">
              {s?.topSubjects?.map((item: any) => (
                <div key={item.examId}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium truncate">{item.subject} — {item.title}</span>
                    <span className="text-blue-600 font-bold">{item.count}</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${Math.min((item.count / (s?.topSubjects[0]?.count || 1)) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* أصعب الأسئلة */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-500" /> أصعب الأسئلة
          </h2>
          {s?.hardestQuestions?.length === 0 ? (
            <p className="text-gray-400 text-center py-6">لا توجد بيانات كافية</p>
          ) : (
            <div className="space-y-3">
              {s?.hardestQuestions?.map((q: any) => (
                <div key={q.questionId} className="border border-gray-100 rounded-xl p-3">
                  <p className="text-sm text-gray-700 mb-1 truncate">{q.text}...</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{q.examTitle}</span>
                    <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">
                      متوسط {q.avgScore} نقطة
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* الطلاب الأكثر نشاطاً + توزيع المحافظات */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* الطلاب الأكثر نشاطاً */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Trophy size={20} className="text-yellow-500" /> الطلاب الأكثر التزاماً
          </h2>
          <div className="space-y-3">
            {s?.topStudents?.map((student: any, i: number) => (
              <div key={student.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white
                    ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-400' : 'bg-blue-400'}`}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{student.name}</p>
                    <p className="text-xs text-gray-400">{student.province}</p>
                  </div>
                </div>
                <div className="text-left">
                  <span className="text-orange-500 font-bold">🔥 {student.studyStreak}</span>
                  <p className="text-xs text-gray-400">أفضل: {student.bestStreak}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* توزيع المحافظات */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Users size={20} className="text-green-600" /> توزيع الطلاب حسب المحافظة
          </h2>
          {s?.provinceDistribution?.length === 0 ? (
            <p className="text-gray-400 text-center py-6">لا توجد بيانات</p>
          ) : (
            <div className="space-y-2">
              {s?.provinceDistribution?.slice(0, 8).map((p: any, i: number) => (
                <div key={p.province}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{p.province}</span>
                    <span className="font-bold" style={{ color: PROVINCE_COLORS[i % PROVINCE_COLORS.length] }}>
                      {p.count}
                    </span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min((p.count / (s?.provinceDistribution[0]?.count || 1)) * 100, 100)}%`,
                        backgroundColor: PROVINCE_COLORS[i % PROVINCE_COLORS.length],
                      }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* البلاغات */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <Flag size={18} className="text-red-500" />
            <p className="text-sm text-gray-500">إجمالي البلاغات</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{s?.reports?.total ?? 0}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={18} className="text-yellow-500" />
            <p className="text-sm text-gray-500">بلاغات معلقة</p>
          </div>
          <p className="text-3xl font-bold text-yellow-600">{s?.reports?.pending ?? 0}</p>
        </div>
      </div>

      {/* آخر الامتحانات */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Clock size={20} className="text-blue-600" /> آخر الامتحانات
        </h2>
        {s?.recentSessions?.length === 0 ? (
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
                {s?.recentSessions?.map((session: any) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{session.user?.name}</td>
                    <td className="py-3 text-gray-600 truncate max-w-[200px]">{session.exam?.title}</td>
                    <td className="py-3">
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs font-medium">
                        {session.totalScore?.toFixed(1)} / {session.maxScore}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">
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