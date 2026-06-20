import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./hooks/useAuth"
import AppLayout from "./components/layout/AppLayout"
import LandingPage from "./pages/LandingPage"        // ✅ Fixed: capital 'P'
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import DashboardPage from "./pages/DashboardPage"
import GoalsPage from "./pages/GoalsPage"            // ✅ Fixed: capital 'P'
import CommunitiesPage from "./pages/CommunitiesPage"
import CommunityPage from "./pages/CommunityPage"
import BadgesPage from "./pages/BadgesPage"
import LeaderboardPage from "./pages/LeaderboardPage"
import MomentumFeedPage from "./pages/MomentumFeedPage"
import ChallengesPage from "./pages/ChallengesPage"
import OpportunitiesPage from "./pages/OpportunitiesPage"
import AiTutorPage from "./pages/AiTutorPage"
import BridgePage from "./pages/BridgePage"
import ParentDashboard from "./pages/ParentDashboard"
import TeacherDashboard from "./pages/TeacherDashboard"
import StudySpherePage from "./pages/StudySpherePage"
import CommunityChatPage from "./pages/CommunityChatPage"
import ForgotPasswordPage from "./pages/ForgotPasswordPage"
import ResetPasswordPage from "./pages/ResetPasswordPage"

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div></div>
  return user ? children : <Navigate to="/login" replace />
}

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : children
}

function RoleBasedRedirect() {
  const { user } = useAuth();
  if (user?.role === 'parent') return <Navigate to="/parent-dashboard" replace />;
  if (user?.role === 'teacher') return <Navigate to="/teacher-dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

function RequireRole({ allowedRoles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'parent' ? '/parent-dashboard' : '/teacher-dashboard'} replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes (no authentication required) */}
          <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
          <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

          {/* Protected routes (require authentication) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<RoleBasedRedirect />} />
            <Route
              path="dashboard"
              element={
                <RequireRole allowedRoles={['student']}>
                  <DashboardPage />
                </RequireRole>
              }
            />
            <Route path="momentum" element={<MomentumFeedPage />} />
            <Route path="goals" element={<GoalsPage />} />
            <Route path="badges" element={<BadgesPage />} />
            <Route path="studysphere" element={<StudySpherePage />} />
            <Route path="challenges" element={<ChallengesPage />} />
            <Route path="opportunities" element={<OpportunitiesPage />} />
            <Route path="communities" element={<CommunitiesPage />} />
            <Route path="communities/:id" element={<CommunityPage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="ai-tutor" element={<AiTutorPage />} />
            <Route path="bridge" element={<BridgePage />} />
            <Route path="parent-dashboard" element={<ParentDashboard />} />
            <Route path="teacher-dashboard" element={<TeacherDashboard />} />
            <Route path="community-chat/:id" element={<CommunityChatPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}