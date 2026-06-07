import { useEffect, useState } from 'react';
import { getAdmins, createAdmin, updateAdmin, deleteAdmin } from '../../services/user.service';
import type { Admin } from '../../types';
import { Plus, Pencil, Trash2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const PERMISSIONS = [
  { key: 'subjects', label: 'المواد' },
  { key: 'exams', label: 'الامتحانات' },
  { key: 'students', label: 'الطلاب' },
  { key: 'subscriptions', label: 'الاشتراكات' },
  { key: 'reports', label: 'البلاغات' },
  { key: 'stats', label: 'الإحصائيات' },
];

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAdmin, setEditAdmin] = useState<Admin | null>(null);

  const [form, setForm] = useState({
    name: '', username: '', email: '', password: '',
    permissions: {} as Record<string, boolean>,
  });

  useEffect(() => { loadAdmins(); }, []);

  async function loadAdmins() {
    setLoading(true);
    try {
      const data = await getAdmins();
      setAdmins(data);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditAdmin(null);
    setForm({ name: '', username: '', email: '', password: '', permissions: {} });
    setShowModal(true);
  }

  function openEdit(admin: Admin) {
    setEditAdmin(admin);
    setForm({
      name: admin.name,
      username: admin.username,
      email: admin.email,
      password: '',
      permissions: admin.permissions,
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!editAdmin && (!form.name || !form.username || !form.email || !form.password)) {
      toast.error('جميع الحقول مطلوبة');
      return;
    }
    try {
      if (editAdmin) {
        await updateAdmin(editAdmin.id, {
          name: form.name,
          permissions: form.permissions,
        });
        toast.success('تم تحديث الأدمن');
      } else {
        await createAdmin({
          name: form.name,
          username: form.username,
          email: form.email,
          password: form.password,
          permissions: form.permissions,
        });
        toast.success('تم إضافة الأدمن');
      }
      await loadAdmins();
      setShowModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'حدث خطأ');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا الأدمن؟')) return;
    try {
      await deleteAdmin(id);
      await loadAdmins();
      toast.success('تم حذف الأدمن');
    } catch {
      toast.error('حدث خطأ');
    }
  }

  function togglePermission(key: string) {
    setForm(p => ({
      ...p,
      permissions: { ...p.permissions, [key]: !p.permissions[key] },
    }));
  }

  return (
    <div className="p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة الأدمنية</h1>
          <p className="text-sm text-gray-500">هذه الصفحة للمشرف الرئيسي فقط</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus size={18} />
          إضافة أدمن
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : admins.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Shield size={48} className="mx-auto mb-3 opacity-30" />
          <p>لا يوجد أدمنية</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-right px-6 py-4 font-medium text-gray-600">الاسم</th>
                <th className="text-right px-6 py-4 font-medium text-gray-600">البريد</th>
                <th className="text-right px-6 py-4 font-medium text-gray-600">الدور</th>
                <th className="text-right px-6 py-4 font-medium text-gray-600">الصلاحيات</th>
                <th className="text-right px-6 py-4 font-medium text-gray-600">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {admins.map(admin => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-xs">
                          {admin.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{admin.name}</p>
                        <p className="text-xs text-gray-500">@{admin.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{admin.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      admin.adminRole === 'SUPER_ADMIN'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {admin.adminRole === 'SUPER_ADMIN' ? 'مشرف رئيسي' : 'مشرف'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {admin.adminRole === 'SUPER_ADMIN' ? (
                      <span className="text-xs text-gray-500">كل الصلاحيات</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {PERMISSIONS.filter(p => admin.permissions[p.key]).map(p => (
                          <span key={p.key} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                            {p.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {admin.adminRole !== 'SUPER_ADMIN' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(admin)}
                          className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(admin.id)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {editAdmin ? 'تعديل أدمن' : 'إضافة أدمن جديد'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الاسم</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {!editAdmin && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">اسم المستخدم</label>
                    <input
                      type="text"
                      value={form.username}
                      onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* Permissions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">الصلاحيات</label>
                <div className="space-y-2">
                  {PERMISSIONS.map(p => (
                    <label key={p.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100">
                      <span className="text-sm text-gray-700">{p.label}</span>
                      <div
                        onClick={() => togglePermission(p.key)}
                        className={`w-11 h-6 rounded-full transition-colors relative ${
                          form.permissions[p.key] ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                          form.permissions[p.key] ? 'translate-x-1' : 'translate-x-6'
                        }`} />
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700"
              >
                حفظ
              </button>
              <button
                onClick={() => setShowModal(false)}
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