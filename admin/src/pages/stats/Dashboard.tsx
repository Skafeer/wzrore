import { useEffect, useState, useRef } from 'react';
import api from '../../utils/api';
import {
  Users, BookOpen, Flag, TrendingUp, Clock, Trophy,
  AlertTriangle, DollarSign, BarChart2, RefreshCw,
  CheckCircle, XCircle, Flame, MapPin, FileText,
  ArrowUpRight, ArrowDownRight, Activity,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, Legend,
} from 'recharts';

const COLORS = ['#1D4ED8', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2', '#65A30D', '#9333EA', '#EA580C', '#0284C7'];

const PLAN_PRICES: Record<string, number> = { WEEKLY: 2000, MONTHLY: 5000, YEARLY: 10000 };

function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startRef.current = null;
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, duration]);

  return <>{display.toLocaleString()}</>;
}

function StatCard({
  label, value, icon: Icon, color, sub, trend,
}: {
  label: string;
  value: number;
  icon: any;
  color: string;
  sub?: string;
  trend?: { value: number; label: string };
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
  };
  const borderMap: Record<string, string> = {
    blue: 'border-t-blue-500', green: 'border-t-green-500',
    purple: 'border-t-purple-500', yellow: 'border-t-yellow-500',
    red: 'border-t-red-500', orange: 'border-t-orange-500',
  };

  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-t-4 ${borderMap[color]} hover:shadow-md transition-all duration-300 group`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl border ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${trend.value >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {trend.value >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div className="text-3xl font-black text-gray-900 mb-1 group-hover:scale-105 transition-transform origin-right">
        <AnimatedNumber value={value} />
      </div>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      {trend && <p className="text-xs text-gray-400 mt-1">{trend.label}</p>}
    </div>
  );
}

const TABS = [
  { id: 'overview', label: 'نظرة عامة', icon: Activity },
  { id: 'users', label: 'الطلاب', icon: Users },
  { id: 'exams', label: 'الامتحانات', icon: BookOpen },
  { id: 'revenue', label: 'الإيرادات', icon: DollarSign },
  { id: 'reports', label: 'البلاغات', icon: Flag },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function loadStats(silent = false) {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (dateRange.from) params.append('from', dateRange.from);
      if (dateRange.to) params.append('to', dateRange.to);
      const res = await api.get(`/stats/admin?${params.toString()}`);
      setStats(res.data.data);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { loadStats(); }, []);

  // Auto-refresh كل 5 دقائق
  useEffect(() => {
    const interval = setInterval(() => loadStats(true), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [dateRange]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4" dir="rtl">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
          <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        </div>
        <p className="text-gray-500 text-sm font-medium">جاري تحميل الإحصائيات...</p>
      </div>
    );
  }

  const s = stats;

  // بيانات مشتقة للرسوم البيانية
  const revenueBreakdown = [
    { name: 'أسبوعي', value: s?.subscriptions?.revenue?.weekly ?? 0, count: s?.subscriptions?.weekly ?? 0 },
    { name: 'شهري', value: s?.subscriptions?.revenue?.monthly ?? 0, count: s?.subscriptions?.monthly ?? 0 },
    { name: 'سنوي', value: s?.subscriptions?.revenue?.yearly ?? 0, count: s?.subscriptions?.yearly ?? 0 },
  ];

  const examCompletionData = [
    { name: 'مكتملة', value: s?.exams?.completedSessions ?? 0, color: '#059669' },
    { name: 'غير مكتملة', value: (s?.exams?.totalSessions ?? 0) - (s?.exams?.completedSessions ?? 0), color: '#E5E7EB' },
  ];

  const subDistribution = [
    { name: 'أسبوعي', value: s?.subscriptions?.weekly ?? 0 },
    { name: 'شهري', value: s?.subscriptions?.monthly ?? 0 },
    { name: 'سنوي', value: s?.subscriptions?.yearly ?? 0 },
  ];

  const scorePct = s?.exams?.completionRate ?? 0;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-gray-900">لوحة التحكم</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="text-gray-400 text-xs">
                آخر تحديث: {lastUpdated ? lastUpdated.toLocaleTimeString('ar-IQ') : '—'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <input type="date" value={dateRange.from}
              onChange={e => setDateRange(p => ({ ...p, from: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
            <span className="text-gray-300">—</span>
            <input type="date" value={dateRange.to}
              onChange={e => setDateRange(p => ({ ...p, to: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
            <button onClick={() => loadStats()}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
              تطبيق
            </button>
            <button onClick={() => loadStats(true)} disabled={refreshing}
              className={`p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors ${refreshing ? 'animate-spin' : ''}`}>
              <RefreshCw size={16} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 overflow-x-auto pb-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}>
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* ═══ نظرة عامة ═══ */}
        {activeTab === 'overview' && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="إجمالي الطلاب" value={s?.users?.total ?? 0} icon={Users} color="blue"
                sub={`${s?.users?.today ?? 0} جديد اليوم`}
                trend={{ value: s?.users?.thisWeek > 0 ? Math.round((s?.users?.today / s?.users?.thisWeek) * 100) : 0, label: 'مقارنة بالأسبوع' }} />
              <StatCard label="الامتحانات المكتملة" value={s?.exams?.completedSessions ?? 0} icon={CheckCircle} color="green"
                sub={`${s?.exams?.completedToday ?? 0} مكتمل اليوم`} />
              <StatCard label="مشتركون نشطون" value={s?.subscriptions?.active ?? 0} icon={DollarSign} color="purple"
                sub={`${s?.subscriptions?.expiringThisWeek ?? 0} تنتهي هذا الأسبوع`} />
              <StatCard label="بلاغات معلقة" value={s?.reports?.pending ?? 0} icon={Flag} color="red"
                sub={`من ${s?.reports?.total ?? 0} إجمالي`} />
            </div>

            {/* رسم بياني التسجيلات */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp size={20} className="text-blue-600" />
                  التسجيلات اليومية — آخر 7 أيام
                </h2>
                <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                  {s?.dailyRegistrations?.reduce((a: number, d: any) => a + d.count, 0) ?? 0} طالب إجمالاً
                </span>
              </div>
              {s?.dailyRegistrations?.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={s.dailyRegistrations}>
                    <defs>
                      <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }} />
                    <Area type="monotone" dataKey="count" stroke="#1D4ED8" strokeWidth={2.5} fill="url(#colorReg)" name="طالب جديد" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-300 text-sm">لا توجد بيانات</div>
              )}
            </div>

            {/* Grid: أكثر المواد + توزيع المحافظات */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* أكثر المواد */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart2 size={20} className="text-purple-600" /> أكثر الامتحانات استخداماً
                </h2>
                {s?.topSubjects?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={s.topSubjects} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="subject" tick={{ fontSize: 11 }} width={60} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }} />
                      <Bar dataKey="count" name="عدد الجلسات" radius={[0, 6, 6, 0]}>
                        {s.topSubjects.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-gray-300 text-sm">لا توجد بيانات</div>
                )}
              </div>

              {/* توزيع المحافظات */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin size={20} className="text-green-600" /> توزيع الطلاب حسب المحافظة
                </h2>
                {s?.provinceDistribution?.length > 0 ? (
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {s.provinceDistribution.map((p: any, i: number) => (
                      <div key={p.province} className="flex items-center gap-3">
                        <span className="text-sm text-gray-700 w-20 text-right shrink-0">{p.province}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div className="h-2 rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.min((p.count / (s.provinceDistribution[0]?.count || 1)) * 100, 100)}%`,
                              backgroundColor: COLORS[i % COLORS.length],
                            }} />
                        </div>
                        <span className="text-sm font-bold w-8 text-left" style={{ color: COLORS[i % COLORS.length] }}>
                          {p.count}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-gray-300 text-sm">لا توجد بيانات</div>
                )}
              </div>
            </div>

            {/* آخر الجلسات */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Clock size={20} className="text-blue-600" /> آخر الامتحانات
                </h2>
                <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                  {s?.recentSessions?.length ?? 0} جلسة
                </span>
              </div>
              {s?.recentSessions?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr className="text-gray-500">
                        <th className="text-right px-6 py-3 font-medium">الطالب</th>
                        <th className="text-right px-6 py-3 font-medium">الامتحان</th>
                        <th className="text-right px-6 py-3 font-medium">الدرجة</th>
                        <th className="text-right px-6 py-3 font-medium">النسبة</th>
                        <th className="text-right px-6 py-3 font-medium">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {s.recentSessions.map((session: any) => {
                        const pct = session.maxScore > 0 ? Math.round((session.totalScore / session.maxScore) * 100) : 0;
                        return (
                          <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 font-bold text-xs">{session.user?.name?.charAt(0)}</span>
                                </div>
                                <span className="font-medium text-gray-900">{session.user?.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-3 text-gray-600 max-w-[200px] truncate">{session.exam?.title}</td>
                            <td className="px-6 py-3">
                              <span className="font-medium text-gray-900">{session.totalScore?.toFixed(1)} / {session.maxScore}</span>
                            </td>
                            <td className="px-6 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                pct >= 80 ? 'bg-green-100 text-green-700' :
                                pct >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {pct}%
                              </span>
                            </td>
                            <td className="px-6 py-3 text-gray-400 text-xs">
                              {new Date(session.submittedAt).toLocaleDateString('ar-IQ')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-10">لا توجد امتحانات بعد</p>
              )}
            </div>
          </>
        )}

        {/* ═══ الطلاب ═══ */}
        {activeTab === 'users' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="إجمالي الطلاب" value={s?.users?.total ?? 0} icon={Users} color="blue" />
              <StatCard label="جديد اليوم" value={s?.users?.today ?? 0} icon={ArrowUpRight} color="green" />
              <StatCard label="هذا الأسبوع" value={s?.users?.thisWeek ?? 0} icon={TrendingUp} color="purple" />
              <StatCard label="هذا الشهر" value={s?.users?.thisMonth ?? 0} icon={Activity} color="yellow" />
            </div>

            {/* الطلاب الأكثر التزاماً */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Trophy size={20} className="text-yellow-500" /> الطلاب الأكثر التزاماً
              </h2>
              {s?.topStudents?.length > 0 ? (
                <div className="space-y-4">
                  {s.topStudents.map((student: any, i: number) => (
                    <div key={student.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-sm ${
                        i === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                        i === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                        i === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                        'bg-gradient-to-br from-blue-400 to-blue-600'
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-sm">{student.name}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <MapPin size={10} /> {student.province}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className="flex items-center gap-1">
                            <Flame size={14} className="text-orange-500" />
                            <span className="font-black text-orange-500 text-lg">{student.studyStreak}</span>
                          </div>
                          <p className="text-xs text-gray-400">يوم</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center gap-1">
                            <Trophy size={14} className="text-yellow-500" />
                            <span className="font-bold text-gray-700 text-sm">{student.bestStreak}</span>
                          </div>
                          <p className="text-xs text-gray-400">أفضل</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">لا توجد بيانات</p>
              )}
            </div>

            {/* توزيع المحافظات بالرسم */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-green-600" /> توزيع الطلاب جغرافياً
              </h2>
              {s?.provinceDistribution?.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={s.provinceDistribution.slice(0, 8)} dataKey="count" nameKey="province"
                        cx="50%" cy="50%" outerRadius={90} innerRadius={50}>
                        {s.provinceDistribution.slice(0, 8).map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {s.provinceDistribution.slice(0, 8).map((p: any, i: number) => (
                      <div key={p.province} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-sm text-gray-700 flex-1">{p.province}</span>
                        <span className="text-sm font-bold text-gray-900">{p.count}</span>
                        <span className="text-xs text-gray-400">
                          ({Math.round((p.count / (s?.users?.total || 1)) * 100)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">لا توجد بيانات</p>
              )}
            </div>
          </>
        )}

        {/* ═══ الامتحانات ═══ */}
        {activeTab === 'exams' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="إجمالي الامتحانات" value={s?.exams?.total ?? 0} icon={BookOpen} color="purple" />
              <StatCard label="كل الجلسات" value={s?.exams?.totalSessions ?? 0} icon={Activity} color="blue" />
              <StatCard label="مكتملة" value={s?.exams?.completedSessions ?? 0} icon={CheckCircle} color="green" />
              <StatCard label="مكتملة اليوم" value={s?.exams?.completedToday ?? 0} icon={Clock} color="yellow" />
            </div>

            {/* معدل الإكمال */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">معدل إكمال الامتحانات</h2>
                <span className={`text-2xl font-black ${scorePct >= 70 ? 'text-green-600' : scorePct >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {scorePct}%
                </span>
              </div>
              <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
                <div className={`h-4 rounded-full transition-all duration-1000 ${
                  scorePct >= 70 ? 'bg-gradient-to-l from-green-500 to-green-400' :
                  scorePct >= 40 ? 'bg-gradient-to-l from-yellow-500 to-yellow-400' :
                  'bg-gradient-to-l from-red-500 to-red-400'
                }`} style={{ width: `${scorePct}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>{s?.exams?.completedSessions?.toLocaleString()} مكتملة</span>
                <span>{((s?.exams?.totalSessions ?? 0) - (s?.exams?.completedSessions ?? 0)).toLocaleString()} غير مكتملة</span>
              </div>
            </div>

            {/* Pie Chart نسب الإكمال */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4">توزيع الجلسات</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={examCompletionData} dataKey="value" cx="50%" cy="50%" outerRadius={80} innerRadius={50}>
                      {examCompletionData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* أصعب الأسئلة */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-red-500" /> أصعب الأسئلة
                </h2>
                {s?.hardestQuestions?.length > 0 ? (
                  <div className="space-y-3">
                    {s.hardestQuestions.map((q: any, i: number) => (
                      <div key={q.questionId} className="border border-gray-100 rounded-xl p-3 hover:border-red-100 hover:bg-red-50 transition-colors">
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-bold text-red-500 bg-red-50 w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700 truncate">{q.text}...</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-gray-400">{q.examTitle}</span>
                              <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                                متوسط {q.avgScore} / {q.attempts} محاولة
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-6">لا توجد بيانات كافية</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* ═══ الإيرادات ═══ */}
        {activeTab === 'revenue' && (
          <>
            {/* KPIs إيرادات */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
                <p className="text-green-100 text-sm font-medium mb-2">الإيرادات التقديرية الإجمالية</p>
                <p className="text-4xl font-black">
                  <AnimatedNumber value={s?.subscriptions?.revenue?.total ?? 0} />
                </p>
                <p className="text-green-200 text-sm mt-1">دينار عراقي</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <p className="text-gray-500 text-sm mb-2 flex items-center gap-1">
                  <AlertTriangle size={14} className="text-yellow-500" /> تنتهي هذا الأسبوع
                </p>
                <p className="text-4xl font-black text-yellow-600">
                  <AnimatedNumber value={s?.subscriptions?.expiringThisWeek ?? 0} />
                </p>
                <p className="text-gray-400 text-xs mt-1">اشتراك يحتاج تجديد</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <p className="text-gray-500 text-sm mb-2">متوسط قيمة الاشتراك</p>
                <p className="text-4xl font-black text-blue-600">
                  <AnimatedNumber value={
                    s?.subscriptions?.active > 0
                      ? Math.round((s?.subscriptions?.revenue?.total ?? 0) / s?.subscriptions?.active)
                      : 0
                  } />
                </p>
                <p className="text-gray-400 text-xs mt-1">دينار لكل مشترك</p>
              </div>
            </div>

            {/* Bar chart توزيع الإيرادات */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">توزيع الإيرادات حسب الباقة</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenueBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
                    formatter={(value: any) => [`${value.toLocaleString()} د.ع`, 'الإيرادات']}
                  />
                  <Bar dataKey="value" name="الإيرادات" radius={[8, 8, 0, 0]}>
                    <Cell fill="#059669" />
                    <Cell fill="#1D4ED8" />
                    <Cell fill="#7C3AED" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* تفاصيل الباقات */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {[
                { name: 'أسبوعي', count: s?.subscriptions?.weekly ?? 0, revenue: s?.subscriptions?.revenue?.weekly ?? 0, color: 'green', price: '2,000' },
                { name: 'شهري', count: s?.subscriptions?.monthly ?? 0, revenue: s?.subscriptions?.revenue?.monthly ?? 0, color: 'blue', price: '5,000' },
                { name: 'سنوي ⭐', count: s?.subscriptions?.yearly ?? 0, revenue: s?.subscriptions?.revenue?.yearly ?? 0, color: 'purple', price: '10,000' },
              ].map(plan => (
                <div key={plan.name} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-gray-900">{plan.name}</span>
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">{plan.price} د.ع</span>
                  </div>
                  <p className="text-3xl font-black text-gray-900 mb-1"><AnimatedNumber value={plan.count} /></p>
                  <p className="text-xs text-gray-500 mb-3">مشترك نشط</p>
                  <div className="border-t border-gray-50 pt-3">
                    <p className="text-sm font-bold text-green-600">{plan.revenue.toLocaleString()} د.ع</p>
                    <p className="text-xs text-gray-400">إيرادات تقديرية</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ═══ البلاغات ═══ */}
        {activeTab === 'reports' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="إجمالي البلاغات" value={s?.reports?.total ?? 0} icon={Flag} color="blue" />
              <StatCard label="معلقة" value={s?.reports?.pending ?? 0} icon={AlertTriangle} color="yellow" />
              <StatCard label="تم الحل" value={s?.reports?.resolved ?? 0} icon={CheckCircle} color="green" />
              <StatCard label="نسبة الحل" value={
                s?.reports?.total > 0 ? Math.round(((s?.reports?.resolved ?? 0) / s?.reports?.total) * 100) : 0
              } icon={Activity} color="purple" sub="%" />
            </div>

            {/* توزيع التصنيفات */}
            {s?.reports?.byCategory && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4">توزيع البلاغات حسب التصنيف</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { key: 'SPELLING', label: 'خطأ إملائي', color: 'orange' },
                    { key: 'WRONG_ANSWER', label: 'خطأ في الإجابة', color: 'red' },
                    { key: 'UNCLEAR', label: 'سؤال غير واضح', color: 'purple' },
                    { key: 'OTHER', label: 'أخرى', color: 'gray' },
                  ].map(cat => {
                    const found = s.reports.byCategory?.find((c: any) => c.category === cat.key);
                    return (
                      <div key={cat.key} className="text-center p-4 bg-gray-50 rounded-2xl">
                        <p className="text-3xl font-black text-gray-900 mb-1">
                          <AnimatedNumber value={found?.count ?? 0} />
                        </p>
                        <p className="text-xs text-gray-500">{cat.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* حالة البلاغات رسم بياني */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">حالة البلاغات</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'معلقة', value: s?.reports?.pending ?? 0, color: '#D97706' },
                      { name: 'تم الحل', value: s?.reports?.resolved ?? 0, color: '#059669' },
                      { name: 'قيد المراجعة', value: Math.max(0, (s?.reports?.total ?? 0) - (s?.reports?.pending ?? 0) - (s?.reports?.resolved ?? 0)), color: '#1D4ED8' },
                    ]}
                    dataKey="value" cx="50%" cy="50%" outerRadius={80}
                  >
                    {[0, 1, 2].map((i) => (
                      <Cell key={i} fill={['#D97706', '#059669', '#1D4ED8'][i]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

      </div>
    </div>
  );
}