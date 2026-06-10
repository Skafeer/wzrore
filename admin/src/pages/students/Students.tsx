import { useEffect, useState } from 'react';
import { getUsers, deleteUser, activateSubscription } from '../../services/user.service';
import api from '../../utils/api';
import type { User } from '../../types';
import { Search, Trash2, CreditCard, Users, ChevronRight, ChevronLeft, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';

const PROVINCES = [
  'بغداد', 'البصرة', 'نينوى', 'أربيل', 'النجف',
  'كربلاء', 'الأنبار', 'ديالى', 'صلاح الدين', 'بابل',
  'واسط', 'ميسان', 'ذي قار', 'المثنى', 'القادسية',
  'كركوك', 'السليمانية', 'دهوك',
];

export default function StudentsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showSubModal, setShowSubModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('MONTHLY');

  const [editForm, setEditForm] = useState({
    name: '', phone: '', province: '', password: '',
  });

  useEffect(() => { loadUsers(); }, [search, filter, page]);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await getUsers({
        search: search || undefined,
        hasSubscription: filter || undefined,
        page,
        limit: 20,
      });
      setUsers(res.data);
      setTotalPages(res.pagination.pages);
      setTotal(res.pagination.total);
    } finally {
      setLoading(false);
    }
  }

  function openEdit(user: User) {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      phone: user.phone,
      province: user.province,
      password: '',
    });
    setShowEditModal(true);
  }

  async function handleEdit() {
    if (!selectedUser) return;
    try {
      await api.put(`/users/admin/users/${selectedUser.id}/full`, editForm);
      await loadUsers();
      toast.success('تم تحديث بيانات الطالب');
      setShowEditModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'حدث خطأ');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا الحساب؟')) return;
    try {
      await deleteUser(id);
      await loadUsers();
      toast.success('تم حذف الحساب');
    } catch {
      toast.error('حدث خطأ');
    }
  }

  async function handleActivateSub() {
    if (!selectedUser) return;
    try {
      await activateSubscription(selectedUser.id, selectedPlan);
      await loadUsers();
      toast.success('تم تفعيل الاشتراك');
      setShowSubModal(false);
    } catch {
      toast.error('حدث خطأ');
    }
  }

  const planLabel = (plan?: string) => {
    if (plan === 'WEEKLY') return 'أسبوعي';
    if (plan === 'MONTHLY') return 'شهري';
    if (plan === 'YEARLY') return 'سنوي';
    return 'مجاني';
  };

  return (
    <div className="p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الطلاب</h1>
          <p className="text-sm text-gray-500">{total} طالب مسجل</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="بحث بالاسم أو رقم الهاتف أو المحافظة..."
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 pr-10 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filter}
          onChange={e => { setFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">الكل</option>
          <option value="true">مشتركون</option>
          <option value="false">غير مشتركين</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Users size={48} className="mx-auto mb-3 opacity-30" />
          <p>لا يوجد طلاب</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-right px-6 py-4 font-medium text-gray-600">الاسم</th>
                  <th className="text-right px-6 py-4 font-medium text-gray-600">رقم الهاتف</th>
                  <th className="text-right px-6 py-4 font-medium text-gray-600">المحافظة</th>
                  <th className="text-right px-6 py-4 font-medium text-gray-600">الاشتراك</th>
                  <th className="text-right px-6 py-4 font-medium text-gray-600">الامتحانات</th>
                  <th className="text-right px-6 py-4 font-medium text-gray-600">تاريخ التسجيل</th>
                  <th className="text-right px-6 py-4 font-medium text-gray-600">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-xs">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{user.phone}</td>
                    <td className="px-6 py-4 text-gray-600">{user.province}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.subscription?.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {user.subscription?.status === 'ACTIVE'
                          ? planLabel(user.subscription.plan)
                          : 'مجاني'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{user.examCount ?? 0}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('ar-IQ')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(user)}
                          className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg"
                          title="تعديل البيانات"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => { setSelectedUser(user); setShowSubModal(true); }}
                          className="p-2 hover:bg-green-50 text-green-600 rounded-lg"
                          title="تفعيل اشتراك"
                        >
                          <CreditCard size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-40"
              >
                <ChevronRight size={20} />
              </button>
              <span className="text-sm text-gray-600">
                صفحة {page} من {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-40"
              >
                <ChevronLeft size={20} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-4">تعديل بيانات الطالب</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الاسم</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                  maxLength={11}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المحافظة</label>
                <select
                  value={editForm.province}
                  onChange={e => setEditForm(p => ({ ...p, province: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PROVINCES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  كلمة المرور الجديدة
                  <span className="text-gray-400 text-xs mr-1">(اتركها فارغة إذا لا تريد تغييرها)</span>
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleEdit}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700"
              >
                حفظ
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      {showSubModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-1">تفعيل اشتراك</h2>
            <p className="text-sm text-gray-500 mb-4">{selectedUser.name}</p>
            <div className="space-y-3 mb-6">
              {[
                { key: 'WEEKLY', label: 'أسبوعي', sub: '7 أيام' },
                { key: 'MONTHLY', label: 'شهري', sub: '30 يوم' },
                { key: 'YEARLY', label: 'سنوي', sub: 'سنة كاملة' },
              ].map(plan => (
                <button
                  key={plan.key}
                  onClick={() => setSelectedPlan(plan.key)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-colors ${
                    selectedPlan === plan.key
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium text-gray-900">{plan.label}</span>
                  <span className="text-sm text-gray-500">{plan.sub}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleActivateSub}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700"
              >
                تفعيل
              </button>
              <button
                onClick={() => setShowSubModal(false)}
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