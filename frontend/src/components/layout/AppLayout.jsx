import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard, Activity, Target, BookOpen, Briefcase, Users, Bot, Link, LogOut, Zap, Menu, ChevronDown, ChevronRight, Award, Trophy, ChevronLeft, MessageCircle, X, Send, Minimize2, Maximize2, Crown, Rocket
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useSubscription } from '../../hooks/useSubscription';

// ===== Inline TutorAssistant component =====
function TutorAssistant({ isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 200);
  }, [isOpen]);

  const send = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('token') },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'No reply' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error. Try again.' }]);
    } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed right-0 top-0 h-full bg-gray-900/95 backdrop-blur-sm border-l border-white/10 shadow-2xl transition-all duration-300 z-50 ${expanded ? 'w-[90vw] max-w-2xl' : 'w-[400px]'}`}>
      <div className="flex justify-between items-center p-4 border-b border-white/10">
        <span className="text-white font-bold">🧠 AI Tutor</span>
        <div className="flex gap-1">
          <button onClick={() => setExpanded(!expanded)} className="text-white/60 hover:text-white p-1">
            {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button onClick={onClose} className="text-white/60 hover:text-white p-1"><X size={18} /></button>
        </div>
      </div>
      <div className="p-4 space-y-3 overflow-y-auto" style={{ height: 'calc(100% - 130px)' }}>
        {messages.length === 0 && <div className="text-white/40 text-center mt-12"><MessageCircle className="mx-auto mb-2" size={32} /><p>Ask anything</p></div>}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${m.role === 'user' ? 'bg-brand-500 text-white' : 'bg-white/10 text-white/90'}`}>{m.content}</div>
          </div>
        ))}
        {loading && <div className="text-white/40 text-sm">Thinking...</div>}
      </div>
      <div className="p-4 border-t border-white/10 flex gap-2">
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Ask..." className="flex-1 input text-sm py-2" disabled={loading} />
        <button onClick={send} disabled={loading || !input.trim()} className="px-4 py-2 bg-brand-500 text-white rounded-lg disabled:opacity-40"><Send size={16} /></button>
      </div>
    </div>
  );
}

// ===== Main AppLayout =====
export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [studySphereOpen, setStudySphereOpen] = useState(true);
  const [tutorOpen, setTutorOpen] = useState(false);

  // ✅ Determine if mobile based on window width
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(() => !isMobile); // open on desktop, closed on mobile

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
      // ✅ Merged Goals, Badges, Skills, Leaderboard into one Skills item
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

  // ---- StudySphere items ----
  const studySphereItems = isStudent ? [
    { to: '/orbit', icon: Rocket, label: 'Orbit' },
    { to: '/opportunities', icon: Briefcase, label: 'Opportunities' },
    { to: '/communities', icon: Users, label: 'Communities' },
    { to: '/ai-tutor', icon: Bot, label: 'AI Tutor' },
  ] : [];

  // ---- Premium-only nav items ----
  const premiumNavItems = isStudent ? [
    { to: '/bridge', icon: Link, label: 'Bridge' },
  ] : [];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleTutor = () => setTutorOpen(!tutorOpen);

  // ---- Subscription label ----
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

  // ✅ Resize listener to update isMobile
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        // On desktop, ensure sidebar is open
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ✅ Hamburger button (only on mobile)
  const HamburgerButton = () => (
    <button
      onClick={toggleSidebar}
      className="fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-gray-800/90 backdrop-blur-sm text-white border border-white/10 lg:hidden hover:bg-gray-700 transition shadow-lg"
      aria-label="Toggle navigation"
    >
      <Menu size={24} />
    </button>
  );

  // ✅ Backdrop (only on mobile)
  const Backdrop = () => (
    <div
      onClick={toggleSidebar}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
      style={{ display: isMobile && sidebarOpen ? 'block' : 'none' }}
    />
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div className="animated-bg" />
      
      {/* Backdrop */}
      <Backdrop />

      {/* Hamburger button */}
      {isMobile && !sidebarOpen && <HamburgerButton />}

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
          zIndex: 50,
          transition: 'width 0.3s ease, background 0.3s ease, border-color 0.3s ease, transform 0.3s ease',
          overflow: 'hidden',
          transform: isMobile && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)',
        }}
        className={isMobile ? '' : 'lg:translate-x-0'}
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
            <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>KUA</span>
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
                      className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
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

      <button
        onClick={toggleTutor}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-r from-brand-500 to-violet-600 text-white shadow-lg hover:scale-105 transition-transform duration-200 flex items-center justify-center"
        aria-label="Toggle AI Tutor"
      >
        {tutorOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      <TutorAssistant isOpen={tutorOpen} onClose={() => setTutorOpen(false)} />
    </div>
  );
}