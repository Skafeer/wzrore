import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/auth.store';
import LoginPage from './pages/auth/Login';
import Layout from './components/Layout';
import DashboardPage from './pages/stats/Dashboard';
import SubjectsPage from './pages/subjects/Subjects';
import ExamsPage from './pages/exams/Exams';
import StudentsPage from './pages/students/Students';
import SubscriptionsPage from './pages/subscriptions/Subscriptions';
import ReportsPage from './pages/reports/Reports';
import AdminsPage from './pages/admins/Admins';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="exams" element={<ExamsPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="subscriptions" element={<SubscriptionsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="admins" element={<AdminsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}