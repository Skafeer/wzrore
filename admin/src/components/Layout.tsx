import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import {
  LayoutDashboard, BookOpen, FileText, Users,
  CreditCard, Flag, Shield, LogOut, GraduationCap,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'الإحصائيات', icon: LayoutDashboard },
  { path: '/subjects', label: 'المواد', icon: BookOpen },
  { path: '/exams', label: 'الامتحانات', icon: FileText },
  { path: '/students', label: 'الطلاب', icon: Users },
  { path: '/subscriptions', label: 'الاشتراكات', icon: CreditCard },
  { path: '/reports', label: 'البلاغات', icon: Flag },
  { path: '/admins', label: 'الأدمنية', icon: Shield, superOnly: true },
];

export default function Layout() {
  const { admin, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-l border-gray-200 flex flex-col shadow-sm">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">صواب</h1>
              <p className="text-xs text-gray-500">لوحة الإدارة</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            if (item.superOnly && admin?.adminRole !== 'SUPER_ADMIN') return null;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Admin Info */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">
                {admin?.name?.charAt(0) ?? 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{admin?.name}</p>
              <p className="text-xs text-gray-500">
                {admin?.adminRole === 'SUPER_ADMIN' ? 'مشرف رئيسي' : 'مشرف'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}