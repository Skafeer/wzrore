import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudentExamSessions } from '../../services/exam.service';
import { ChevronRight, FileText, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentExamsPage() {
  const { id } = useParams<{ id: string }>(); // جلب معرف الطالب من الرابط
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadSessions();
    }
  }, [id]);

  async function loadSessions() {
    setLoading(true);
    try {
      const data = await getStudentExamSessions(id!);
      setSessions(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'تعذر جلب امتحانات الطالب');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6" dir="rtl">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/admin/students')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">امتحانات الطالب</h1>
          <p className="text-sm text-gray-500 mt-1">سجل الامتحانات التي قام الطالب بحلها</p>
        </div>
      </div>

      {/* Table */}
      {sessions.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <FileText size={48} className="mx-auto mb-3 opacity-30" />
          <p>لم يقم هذا الطالب بحل أي امتحان بعد.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-right px-6 py-4 font-medium text-gray-600">الامتحان</th>
                <th className="text-right px-6 py-4 font-medium text-gray-600">المادة</th>
                <th className="text-right px-6 py-4 font-medium text-gray-600">الدرجة</th>
                <th className="text-right px-6 py-4 font-medium text-gray-600">التاريخ</th>
                <th className="text-right px-6 py-4 font-medium text-gray-600">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{session.exam?.title}</td>
                  <td className="px-6 py-4 text-gray-600">{session.exam?.subject?.name}</td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs font-medium">
                      {session.totalScore?.toFixed(1)} / {session.maxScore}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 flex items-center gap-1">
                    <Clock size={13} />
                    {new Date(session.submittedAt).toLocaleDateString('ar-IQ')}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-green-50 text-green-700 px-2 py-1 rounded-lg text-xs font-medium">
                      مكتمل
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}