import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard, Target, Users, Award, Trophy, LogOut, Zap, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/communities', icon: Users, label: 'Communities' },
  { to: '/badges', icon: Award, label: 'Badges' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
];

const LevelBadge = ({ level }) => (
  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-500/20 border border-brand-500/30">
    <Zap size={10} className="text-brand-400" />
    <span className="text-xs font-bold text-brand-400">LV {level}</span>
  </div>
);

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const xpPercent = user?.stats?.xpPercent ?? Math.round(((user?.xp ?? 0) % 500) / 500 * 100);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 flex flex-col border-r border-white/[0.06] bg-surface-950/95 backdrop-blur-xl
        transition-transform duration-300 lg:translate-x-0 lg:static
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/[0.06]">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">Lifeverse</span>
        </div>

        {/* User card */}
        <div className="mx-4 mt-4 p-4 rounded-2xl glass">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center font-display font-bold text-sm">
              {(user?.fullName || user?.username || 'U')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{user?.fullName || user?.username}</p>
              <p className="text-xs text-white/40 truncate">@{user?.username}</p>
            </div>
            <LevelBadge level={user?.level || 1} />
          </div>
          <div>
            <div className="flex justify-between text-xs text-white/40 mb-1">
              <span>{user?.xp ?? 0} XP</span>
              <span>{xpPercent}%</span>
            </div>
            <div className="xp-bar-track">
              <div className="xp-bar-fill" style={{ width: `${xpPercent}%` }} />
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-4 pb-6">
          <button onClick={handleLogout} className="nav-item nav-item-inactive w-full">
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-white/5">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-brand-400" />
            <span className="font-display font-bold">Lifeverse</span>
          </div>
          <LevelBadge level={user?.level || 1} />
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}