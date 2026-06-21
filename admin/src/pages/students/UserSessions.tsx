import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { ArrowRight, BookOpen, Clock } from 'lucide-react'; // ✅ تم حذف Trophy و ChevronRight

interface Session {
  sessionId: string;
  examTitle: string;
  subject: string;
  chapter: string | null;
  totalScore: number;
  maxScore: number;
  submittedAt: string;
}

interface UserData {
  name: string;
  phone: string;
}

export default function UserSessionsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const res = await api.get(`/users/admin/users/${id}/sessions`);
      setUser(res.data.data.user);
      setSessions(res.data.data.sessions);
    } finally {
      setLoading(false);
    }
  }

  function getScoreColor(score: number, max: number) {
    const pct = max > 0 ? (score / max) * 100 : 0;
    if (pct >= 80) return 'text-green-600 bg-green-50';
    if (pct >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  }

  function getScorePct(score: number, max: number) {
    return max > 0 ? Math.round((score / max) * 100) : 0;
  }

  const avgScore = sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => sum + getScorePct(s.totalScore, s.maxScore ?? 1), 0) / sessions.length)
    : 0;

  return (
    <div className="p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/students')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowRight size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{user?.name ?? '...'}</h1>
          <p className="text-sm text-gray-500">{user?.phone} — {sessions.length} امتحان مكتمل</p>
        </div>
      </div>

      {/* Stats */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold text-blue-600">{sessions.length}</p>
            <p className="text-sm text-gray-500 mt-1">امتحان مكتمل</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold text-green-600">{avgScore}%</p>
            <p className="text-sm text-gray-500 mt-1">متوسط الدرجات</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {Math.max(...sessions.map(s => getScorePct(s.totalScore, s.maxScore ?? 1)))}%
            </p>
            <p className="text-sm text-gray-500 mt-1">أعلى درجة</p>
          </div>
        </div>
      )}

      {/* Sessions List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
          <p>لا يوجد امتحانات مكتملة</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-right px-6 py-4 font-medium text-gray-600">الامتحان</th>
                <th className="text-right px-6 py-4 font-medium text-gray-600">المادة</th>
                <th className="text-right px-6 py-4 font-medium text-gray-600">الدرجة</th>
                <th className="text-right px-6 py-4 font-medium text-gray-600">النسبة</th>
                <th className="text-right px-6 py-4 font-medium text-gray-600">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sessions.map(session => {
                const pct = getScorePct(session.totalScore, session.maxScore ?? 1);
                const color = getScoreColor(session.totalScore, session.maxScore ?? 1);
                return (
                  <tr key={session.sessionId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                          <BookOpen size={14} className="text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-900">{session.examTitle}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-gray-900 font-medium">{session.subject}</p>
                        {session.chapter && (
                          <p className="text-gray-400 text-xs mt-0.5">{session.chapter}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-900">
                        {session.totalScore?.toFixed(1)} / {session.maxScore}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${color}`}>
                        {pct}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-gray-500">
                        <Clock size={12} />
                        <span>{new Date(session.submittedAt).toLocaleDateString('ar-IQ')}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}