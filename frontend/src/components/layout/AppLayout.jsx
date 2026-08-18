import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard, Activity, Target, BookOpen, Briefcase, Users, Bot, Link, LogOut, Zap, Menu, ChevronDown, ChevronRight, Award, Trophy, ChevronLeft, MessageCircle, X, Send, Minimize2, Maximize2, Crown, Rocket
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useSubscription } from '../../hooks/useSubscription';

// ===== Inline TutorAssistant component =====
function TutorAssistant({ isOpen, onClose }) {
  // ... (unchanged, keep as is)
}

// ===== Main AppLayout =====
export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [studySphereOpen, setStudySphereOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tutorOpen, setTutorOpen] = useState(false);

  // ---- Subscription check ----
  const { status, loading: subscriptionLoading } = useSubscription();
  const hasPremiumAccess = status?.isActive || status?.isInstitutional || user?.role === 'admin';

  const handleLogout = () => { logout(); navigate('/'); };
  const xpPercent = user?.stats?.xpPercent ?? Math.round(((user?.xp ?? 0) % 500) / 500 * 100);

  const isStudent = user?.role === 'student';
  const isParent = user?.role === 'parent';
  const isTeacher = user?.role === 'teacher';
  const isAdmin = user?.role === 'admin';

  const getAvatarGradient = (level) => {
    if (level <= 5) return 'linear-gradient(135deg, #3b82f6, #7c3aed)';
    if (level <= 10) return 'linear-gradient(135deg, #8b5cf6, #ec4899)';
    if (level <= 20) return 'linear-gradient(135deg, #f59e0b, #ef4444)';
    return 'linear-gradient(135deg, #10b981, #06b6d4)';
  };

  // ---- Main navigation ----
  let mainNav = [];
  if (isStudent) {
    mainNav = [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/goals', icon: Target, label: 'Goals' },
      { to: '/badges', icon: Award, label: 'Badges' },
      { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
      { to: '/skills', icon: Activity, label: 'Skills' },
    ];
  } else if (isParent) {
    mainNav = [
      { to: '/parent-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ];
  } else if (isTeacher) {
    mainNav = [
      { to: '/teacher-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ];
  } else if (isAdmin) {
    mainNav = [
      { to: '/admin', icon: LayoutDashboard, label: 'Admin Dashboard' },
    ];
  } else {
    mainNav = [{ to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }];
  }

  // ---- StudySphere items (sub-items) ----
  // ✅ Renamed to studySphereItems and moved out of the previous allStudySphereItems
  const studySphereItems = isStudent ? [
    { to: '/orbit', icon: Rocket, label: 'Orbit' },
    { to: '/opportunities', icon: Briefcase, label: 'Opportunities' },
    { to: '/communities', icon: Users, label: 'Communities' },
    { to: '/ai-tutor', icon: Bot, label: 'AI Tutor' },
  ] : [];

  // ---- Premium-only nav items (top-level) ----
  // ✅ Removed StudySphere – it's now only in the collapsible section
  const premiumNavItems = isStudent ? [
    { to: '/bridge', icon: Link, label: 'Bridge' },
  ] : [];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleTutor = () => setTutorOpen(!tutorOpen);

  // ---- Get subscription status display ----
  const getSubscriptionLabel = () => {
    if (isAdmin) return 'Admin';
    if (status?.isInstitutional) return '🏫 Institutional';
    if (status?.plan === 'trial' && status.isActive) {
      const days = status.daysRemaining;
      return `🎯 Trial (${days}d)`;
    }
    if (status?.plan === 'trial' && !status.isActive) return '⚠️ Trial Expired';
    if (status?.plan && status.plan !== 'none' && status.isActive) return '⭐ Premium';
    return '📖 Free';
  };

  const isTrialExpired = status?.plan === 'trial' && !status.isActive;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div className="animated-bg" />
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 30 }}
        />
      )}
      <aside
        style={{
          width: sidebarOpen ? 256 : 64,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 40,
          transition: 'width 0.3s ease, background 0.3s ease, border-color 0.3s ease',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px' }}>
          <button
            onClick={toggleSidebar}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            {sidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {sidebarOpen && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '0 24px 20px 24px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: 'linear-gradient(135deg,#3b82f6,#7c3aed)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Zap size={16} color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>Lifeverse</span>
            {!isAdmin && !subscriptionLoading && (
              <span
                style={{
                  fontSize: 10,
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: isTrialExpired ? 'rgba(239,68,68,0.2)' : 'rgba(139,92,246,0.2)',
                  color: isTrialExpired ? '#ef4444' : 'var(--accent)',
                  border: '1px solid ' + (isTrialExpired ? 'rgba(239,68,68,0.3)' : 'rgba(139,92,246,0.3)'),
                  whiteSpace: 'nowrap',
                }}
              >
                {getSubscriptionLabel()}
              </span>
            )}
          </div>
        )}

        {sidebarOpen && (
          <div
            style={{
              margin: '16px',
              padding: '16px',
              borderRadius: 16,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: getAvatarGradient(user?.level || 1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                  color: 'white',
                }}
              >
                {(user?.fullName || user?.username || 'U')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'var(--text-primary)',
                  }}
                >
                  {user?.fullName || user?.username}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                  Level {user?.level || 1}
                </p>
              </div>
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 6,
              }}
            >
              <span>{user?.xp ?? 0} XP</span>
              <span>{xpPercent}%</span>
            </div>
            <div className="xp-bar-track">
              <div className="xp-bar-fill" style={{ width: `${xpPercent}%` }} />
            </div>
          </div>
        )}

        <nav style={{ flex: 1, padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Main navigation */}
          {mainNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
              style={!sidebarOpen ? { justifyContent: 'center', padding: '8px' } : {}}
            >
              <Icon size={18} style={{ color: 'currentColor' }} />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}

          {/* Premium-only navigation (Bridge) - hidden if no premium access */}
          {premiumNavItems.length > 0 && hasPremiumAccess && (
            <>
              {premiumNavItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
                  style={!sidebarOpen ? { justifyContent: 'center', padding: '8px' } : {}}
                >
                  <Icon size={18} style={{ color: 'currentColor' }} />
                  {sidebarOpen && <span>{label}</span>}
                </NavLink>
              ))}
            </>
          )}

          {/* Premium upgrade prompt (only show for free/trial expired users) */}
          {!hasPremiumAccess && !isAdmin && isStudent && (
            <div
              style={{
                marginTop: 8,
                padding: '10px 12px',
                borderRadius: 10,
                background: isTrialExpired ? 'rgba(239,68,68,0.1)' : 'rgba(139,92,246,0.08)',
                border: '1px solid ' + (isTrialExpired ? 'rgba(239,68,68,0.2)' : 'rgba(139,92,246,0.15)'),
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isTrialExpired ? (
                  <X size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
                ) : (
                  <Crown size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 500, margin: 0 }}>
                    {isTrialExpired ? 'Trial Expired' : 'Premium Features'}
                  </p>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, lineHeight: 1.3 }}>
                    {isTrialExpired ? 'Upgrade to continue' : 'Bridge, StudySphere & more'}
                  </p>
                </div>
                <button
                  onClick={() => navigate('/settings/subscription')}
                  style={{
                    fontSize: 10,
                    padding: '2px 10px',
                    borderRadius: 6,
                    background: isTrialExpired ? '#ef4444' : 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isTrialExpired ? 'Upgrade' : 'Unlock'}
                </button>
              </div>
            </div>
          )}

          {/* StudySphere collapsible section - only visible if premium access */}
          {studySphereItems.length > 0 && sidebarOpen && hasPremiumAccess && (
            <div style={{ marginTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <NavLink
                  to="/studysphere"
                  className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
                  style={{ flex: 1, justifyContent: 'flex-start' }}
                >
                  <BookOpen size={18} style={{ color: 'currentColor' }} />
                  <span>StudySphere</span>
                </NavLink>
                <button
                  onClick={() => setStudySphereOpen(!studySphereOpen)}
                  className="nav-item-inactive"
                  style={{ padding: '8px', marginLeft: '4px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  {studySphereOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              </div>
              {studySphereOpen && (
                <div style={{ marginLeft: 28, display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
                  {studySphereItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                      key={to}
                      to={to}
                      className={({ isActive }) =>
                        `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`
                      }
                      style={{ paddingLeft: 28 }}
                    >
                      <Icon size={16} style={{ color: 'currentColor' }} />
                      <span>{label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Collapsed StudySphere icons (when sidebar is closed) */}
          {studySphereItems.length > 0 && !sidebarOpen && hasPremiumAccess && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
              {studySphereItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
                  style={{ justifyContent: 'center', padding: '8px' }}
                >
                  <Icon size={18} style={{ color: 'currentColor' }} />
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        <div style={{ padding: '0 16px 24px' }}>
          <button
            onClick={handleLogout}
            className="nav-item nav-item-inactive"
            style={{ width: '100%', justifyContent: sidebarOpen ? 'flex-start' : 'center' }}
          >
            <LogOut size={18} style={{ color: 'currentColor' }} />
            {sidebarOpen && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        <Outlet />
      </main>

      {/* AI Tutor toggle button */}
      <button
        onClick={toggleTutor}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-r from-brand-500 to-violet-600 text-white shadow-lg hover:scale-105 transition-transform duration-200 flex items-center justify-center"
        aria-label="Toggle AI Tutor"
      >
        {tutorOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* AI Tutor panel */}
      <TutorAssistant
        isOpen={tutorOpen}
        onClose={() => setTutorOpen(false)}
      />
    </div>
  );
}