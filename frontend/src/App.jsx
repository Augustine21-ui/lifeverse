import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import AppLayout from "./components/layout/AppLayout";
import SkillsDashboard from './pages/SkillsDashboard';
import ProfilePage from './pages/ProfilePage';
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import GoalsPage from "./pages/GoalsPage";
import CommunitiesPage from "./pages/CommunitiesPage";
import CommunityDetailPage from "./pages/CommunityDetailPage";
import BadgesPage from "./pages/BadgesPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import MomentumPage from "./pages/MomentumPage";
import ChallengesPage from "./pages/ChallengesPage";
import OpportunitiesPage from "./pages/OpportunitiesPage";
import AiTutorPage from "./pages/AiTutorPage";
import BridgePage from "./pages/BridgePage";
import ParentDashboard from "./pages/ParentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudySpherePage from "./pages/StudySpherePage";
import CommunityChatPage from "./pages/CommunityChatPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AdminDashboard from "./pages/AdminDashboard";
import StudyGroupDetail from './pages/StudyGroupDetail';
import SubscriptionRequired from './pages/SubscriptionRequired';
import OrbitPage from './pages/OrbitPage';
import StudyGroupsPage from './pages/StudyGroupsPage';
import SettingsPage from './pages/SettingsPage';
import AcademicHubPage from './pages/AcademicHubPage';
import SubjectDetailPage from './pages/SubjectDetailPage';
import AcademicOnboarding from './pages/AcademicOnboarding';
import SubscriptionPage from './pages/SubscriptionPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div></div>;
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

function RoleBasedRedirect() {
  const { user } = useAuth();
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  if (user?.role === 'parent') return <Navigate to="/parent-dashboard" replace />;
  if (user?.role === 'teacher') return <Navigate to="/teacher-dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

function RequireRole({ allowedRoles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'parent' ? '/parent-dashboard' : user.role === 'teacher' ? '/teacher-dashboard' : '/dashboard'} replace />;
  }
  return children;
}

export default function App() {
  console.log('🔥 App is rendering');
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/LandingPage" element={<LandingPage />} />
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

      {/* ✅ Protected layout – wraps child routes */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<RoleBasedRedirect />} />
        <Route path="dashboard" element={
          <RequireRole allowedRoles={['student']}>
            <DashboardPage />
          </RequireRole>
        } />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="badges" element={<BadgesPage />} />
        <Route path="studysphere" element={<StudySpherePage />} />
        <Route path="challenges" element={<ChallengesPage />} />
        <Route path="opportunities" element={<OpportunitiesPage />} />
        <Route path="communities" element={<CommunitiesPage />} />
        <Route path="communities/:id" element={<CommunityDetailPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="/study-groups" element={<StudyGroupsPage />} />
        <Route path="/skills" element={<SkillsDashboard />} />
        <Route path="ai-tutor" element={<AiTutorPage />} />
        <Route path="study-groups/:id" element={<StudyGroupDetail />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="bridge" element={<BridgePage />} />
        <Route path="momentum" element={<MomentumPage />} />
        <Route path="/subscription-required" element={<SubscriptionRequired />} />
        <Route path="parent-dashboard" element={<ParentDashboard />} />
        <Route path="teacher-dashboard" element={<TeacherDashboard />} />
        <Route path="/orbit" element={<ProtectedRoute><OrbitPage /></ProtectedRoute>} />
        <Route path="/settings/subscription" element={<SubscriptionPage />} />
        <Route path="community-chat/:id" element={<CommunityChatPage />} />
        <Route path="/studysphere" element={<AcademicHubPage />} />
        <Route path="/studysphere/subject/:subjectId" element={<SubjectDetailPage />} />
        <Route path="/momentum" element={<MomentumPage />} />
        <Route path="/momentum/community/:id" element={<CommunityDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/academic-onboarding" element={<AcademicOnboarding />} />
        <Route path="admin" element={
          <RequireRole allowedRoles={['admin']}>
            <AdminDashboard />
          </RequireRole>
        } />
      </Route>
    </Routes>
  );
}