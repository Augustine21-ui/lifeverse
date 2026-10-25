import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import AppLayout from "./components/layout/AppLayout";

// Pages
import ProfilePage from './pages/ProfilePage';
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import GoalsPage from "./pages/GoalsPage";
import CommunitiesPage from "./pages/CommunitiesPage";
import CommunityDetailPage from "./pages/CommunityDetailPage";
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
import InstitutionDashboard from './pages/InstitutionDashboard';
import SkillsPage from './pages/SkillsPage';
import AchievementsPage from './pages/AchievementsPage';
import SkillDetailPage from "./pages/SkillDetailPage";

// ===== NotFound Component =====
const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
    <h1 className="text-6xl font-bold mb-4">404</h1>
    <p className="text-xl text-white/60">Page not found</p>
    <a href="/" className="mt-6 btn-primary">Go Home</a>
  </div>
);

// ===== Auth Guards =====
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

function RequireRole({ allowedRoles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  
  if (!allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'parent') return <Navigate to="/parent-dashboard" replace />;
    if (user.role === 'teacher') return <Navigate to="/teacher-dashboard" replace />;
    if (user.role === 'institution_admin') return <Navigate to="/institution-dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* 1. PUBLIC ROUTES (No Auth Required) */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

      {/* 2. PROTECTED ROUTES (Require Login) */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        
        {/* Dashboards (Role-Based) */}
        <Route path="dashboard" element={
          <RequireRole allowedRoles={['student']}>
            <DashboardPage />
          </RequireRole>
        } />
        <Route path="admin" element={<RequireRole allowedRoles={['admin']}><AdminDashboard /></RequireRole>} />
        <Route path="parent-dashboard" element={<RequireRole allowedRoles={['parent']}><ParentDashboard /></RequireRole>} />
        <Route path="teacher-dashboard" element={<RequireRole allowedRoles={['teacher']}><TeacherDashboard /></RequireRole>} />
        <Route path="institution-dashboard" element={<RequireRole allowedRoles={['institution_admin']}><InstitutionDashboard /></RequireRole>} />

        {/* Student / General Features */}
        <Route path="skills" element={<SkillsPage />} />
        <Route path="skill/:subjectId" element={<SkillDetailPage />} />
        <Route path="achievements" element={<AchievementsPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="orbit" element={<OrbitPage />} />
        <Route path="challenges" element={<ChallengesPage />} />
        <Route path="opportunities" element={<OpportunitiesPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="ai-tutor" element={<AiTutorPage />} />
        
        {/* Academic / Study */}
        <Route path="studysphere" element={<AcademicHubPage />} />
        <Route path="studysphere/subject/:subjectId" element={<SubjectDetailPage />} />
        <Route path="academic-onboarding" element={<AcademicOnboarding />} />
        <Route path="study-groups" element={<StudyGroupsPage />} />
        <Route path="study-groups/:id" element={<StudyGroupDetail />} />
        
        {/* Social / Community */}
        <Route path="momentum" element={<MomentumPage />} />
        <Route path="momentum/community/:id" element={<CommunityDetailPage />} />
        <Route path="communities" element={<CommunitiesPage />} />
        <Route path="communities/:id" element={<CommunityDetailPage />} />
        <Route path="community-chat/:id" element={<CommunityChatPage />} />
        
        {/* Account / Settings */}
        <Route path="profile" element={<ProfilePage />} />
        <Route path="bridge" element={<BridgePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="settings/subscription" element={<SubscriptionPage />} />
        <Route path="subscription-required" element={<SubscriptionRequired />} />
      </Route>

      {/* 3. CATCH-ALL 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}