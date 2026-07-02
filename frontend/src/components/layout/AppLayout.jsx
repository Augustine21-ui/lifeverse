// frontend/src/components/layout/AppLayout.jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard, Activity, Target, BookOpen, Briefcase, Users, Bot, Link, LogOut, Zap, Menu, ChevronDown, ChevronRight, Award
} from 'lucide-react';
import { useState } from 'react';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [studySphereOpen, setStudySphereOpen] = useState(true);

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

  // Main navigation – changes based on role
  let mainNav = [];
  if (isStudent) {
    mainNav = [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      //{ to: '/momentum', icon: Activity, label: 'Momentum Feed' },
      { to: '/goals', icon: Target, label: 'Goals' },
      { to: '/badges', icon: Award, label: 'Badges' },
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
    // fallback
    mainNav = [{ to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }];
  }

  // StudySphere – only for students
  const studySphereItems = isStudent ? [
    { to: '/challenges', icon: Target, label: 'Challenges' },
    { to: '/opportunities', icon: Briefcase, label: 'Opportunities' },
    { to: '/communities', icon: Users, label: 'Communities' },
    { to: '/ai-tutor', icon: Bot, label: 'AI Tutor' },
  ] : [];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
    <div className="animated-bg" />
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 30 }}
        />
      )}
      <aside
        style={{
          width: 256,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(10,10,15,0.98)',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 40,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
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
          <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.5px' }}>Lifeverse</span>
        </div>

        {/* User card */}
        <div
          style={{
            margin: '16px',
            padding: '16px',
            borderRadius: 16,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
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
                }}
              >
                {user?.fullName || user?.username}
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                Level {user?.level || 1}
              </p>
            </div>
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.4)',
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

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {mainNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}

          {/* Bridge link (for all users, placed after main nav) */}
          <NavLink
            to="/bridge"
            className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
          >
            <Link size={18} />
            <span>Bridge</span>
          </NavLink>

          {/* StudySphere section – only for students */}
          {studySphereItems.length > 0 && (
            <div style={{ marginTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <NavLink
                  to="/studysphere"
                  className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
                  style={{ flex: 1, justifyContent: 'flex-start' }}
                >
                  <BookOpen size={18} />
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
                      <Icon size={16} />
                      <span>{label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Sign out button */}
        <div style={{ padding: '0 16px 24px' }}>
          <button onClick={handleLogout} className="nav-item nav-item-inactive" style={{ width: '100%' }}>
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}