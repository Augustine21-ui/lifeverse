// frontend/src/pages/DashboardPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { 
  Flame, Calendar, CheckCircle, Clock, Plus, Play, BookOpen, 
  Rocket, Sparkles, Brain, Target, ArrowRight, ShieldCheck, Home, User, Users, X,
  RotateCcw, Lightbulb, CalendarCheck, Settings, Book
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useMood } from '../context/MoodContext';
import FocusSession from '../components/FocusSession';
import HolographicAvatar from '../components/HolographicAvatar';
import ErrorBoundary from '../components/ErrorBoundary';

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function DashboardHeader({ user }) {
  const navigate = useNavigate();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  
  return (
    <header className="flex flex-col gap-6 mb-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <h1 className="text-xl font-bold text-white tracking-wide">KUA</h1>
        <div className="px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-[10px] font-bold text-purple-400 uppercase tracking-wider">
          Your learning space
        </div>
      </div>

      {/* Welcome Area */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full border-2 border-indigo-500/50 overflow-hidden shrink-0">
            <HolographicAvatar />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{greeting}, {user?.full_name?.split(' ')[0] || 'Learner'}</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">Ready to make progress today?</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">A short, personalised welcome.</p>
          </div>
        </div>
        <button onClick={() => navigate('/settings')} className="p-2 text-[var(--text-muted)] hover:text-white transition">
          <Settings size={20} />
        </button>
      </div>
    </header>
  );
}

function HeroActionCard({ action }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (action.link) navigate(action.link);
  };

  return (
    <section className="mb-8">
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Your next step</h3>
          <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] font-bold text-green-400">
            Recommended
          </span>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">{action.title}</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-6">{action.desc}</p>
        
        <button
          onClick={handleClick}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#1A1C23] border border-[var(--border)] text-white hover:bg-[#20232D] transition group"
        >
          <span className="font-medium text-sm">{action.btnText}</span>
          <ArrowRight size={18} className="text-gray-400 group-hover:text-white transition" />
        </button>
        
        <p className="text-[10px] text-[var(--text-muted)] mt-3">
          Only show a continue action when a real unfinished activity exists.
        </p>
      </div>
    </section>
  );
}

function ActionGrid({ onStartFocus }) {
  const navigate = useNavigate();
  
  const cards = [
    { title: "Today's focus", desc: "Your selected learning priority.", icon: Calendar, onClick: onStartFocus, color: 'text-blue-400' },
    { title: "Revision", desc: "Topics due for another look.", icon: RotateCcw, onClick: () => navigate('/orbit'), color: 'text-indigo-400' },
    { title: "Apply your knowledge", desc: "A relevant practical challenge.", icon: Lightbulb, onClick: () => navigate('/orbit'), color: 'text-amber-400' },
    { title: "Coming up", desc: "Real deadlines and commitments.", icon: CalendarCheck, onClick: () => navigate('/studysphere'), color: 'text-cyan-400' },
  ];

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div 
            key={idx} 
            onClick={card.onClick}
            className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 cursor-pointer hover:border-white/20 transition"
          >
            <Icon size={20} className={`${card.color} mb-3`} />
            <h4 className="text-sm font-bold text-white mb-1">{card.title}</h4>
            <p className="text-xs text-[var(--text-secondary)]">{card.desc}</p>
          </div>
        );
      })}
    </section>
  );
}

function PhilosophyJourney() {
  return (
    <section className="border-t border-[var(--border)] pt-8 pb-12">
      <h3 className="text-sm font-bold text-white mb-6">Your learning journey</h3>
      
      <div className="flex items-center justify-between max-w-sm mx-auto mb-6">
        <div className="flex flex-col items-center gap-2">
          <Book size={18} className="text-blue-400" />
          <span className="text-xs font-medium text-white">Learning</span>
        </div>
        <ArrowRight size={14} className="text-[var(--text-muted)] mb-5" />
        
        <div className="flex flex-col items-center gap-2">
          <Target size={18} className="text-purple-400" />
          <span className="text-xs font-medium text-white">Capability</span>
        </div>
        <ArrowRight size={14} className="text-[var(--text-muted)] mb-5" />
        
        <div className="flex flex-col items-center gap-2">
          <Rocket size={18} className="text-cyan-400" />
          <span className="text-xs font-medium text-white">Opportunity</span>
        </div>
      </div>

      <p className="text-xs text-center text-[var(--text-muted)] leading-relaxed">
        Conceptual layout to communicate the direction. These are not live KUA features or real learner records.
      </p>
    </section>
  );
}

function MobileNav({ active, navigate }) {
  const items = [
    { id: 'home', icon: Home, label: 'Home', path: '/dashboard' },
    { id: 'orbit', icon: Rocket, label: 'Orbit', path: '/orbit' },
    { id: 'momentum', icon: Users, label: 'Momentum', path: '/momentum' },
    { id: 'studysphere', icon: BookOpen, label: 'Study', path: '/studysphere' },
    { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
  ];
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-xl border-t border-white/10 safe-bottom">
      <div className="flex justify-around items-center max-w-md mx-auto px-2 py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
                isActive ? 'text-brand-400 scale-105' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const { triggerMood } = useMood();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [orbitCount, setOrbitCount] = useState(0);
  const [focusRemaining, setFocusRemaining] = useState(0);

  // Focus Mode State
  const [focusMode, setFocusMode] = useState(false);
  const [focusDuration, setFocusDuration] = useState(25);
  const [focusTopic, setFocusTopic] = useState('Deep Work');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, tasksRes, orbitRes, focusRes] = await Promise.all([
        api.getDashboardStats?.().catch(() => null) ?? Promise.resolve(null),
        api.getTodayTasks?.().catch(() => []) ?? Promise.resolve([]),
        api.getOrbitSessionCount?.().catch(() => null) ?? Promise.resolve(null),
        api.getFocusRemaining?.().catch(() => null) ?? Promise.resolve(null),
      ]);

      setStats(statsRes);
      setTasks(Array.isArray(tasksRes) ? tasksRes : (tasksRes?.tasks ?? []));
      setOrbitCount(typeof orbitRes === 'number' ? orbitRes : (orbitRes?.count ?? 0));

      if (focusRes) {
        setFocusRemaining(typeof focusRes === 'number' ? focusRes : focusRes.remaining ?? 0);
      }
    } catch (err) {
      console.error('Dashboard load failed:', err);
      showToast?.('Some dashboard sections failed to load', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Focus Session Handlers
  const handleStartFocus = () => {
    if (focusRemaining <= 0) {
      showToast?.('No focus sessions left today', 'error');
      return;
    }
    setFocusMode(true);
  };

  const handleFocusEnd = async () => {
    try {
      await api.completeFocusSession(focusDuration);
      triggerMood?.('focus-complete');
      showToast?.('Focus session complete');
      await loadDashboard();
      await refreshUser?.();
    } catch (err) {
      showToast?.(err.message || 'Focus session failed', 'error');
    }
    setFocusMode(false);
  };

  // If Focus Mode is active, render the overlay
  if (focusMode) {
    return (
      <FocusSession 
        topic={focusTopic} 
        duration={focusDuration} 
        onEnd={handleFocusEnd} 
        onCancel={() => setFocusMode(false)} 
      />
    );
  }

  if (loading) {
    return (
      <div className="max-w-[800px] mx-auto px-4 py-6 pb-24 pt-16">
        <div className="grid gap-4 pt-2">
          <div className="h-8 w-1/3 rounded-lg bg-[var(--bg-card)] skeleton-pulse" />
          <div className="h-44 rounded-2xl bg-[var(--bg-card)] skeleton-pulse" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-28 rounded-xl bg-[var(--bg-card)] skeleton-pulse" />
            <div className="h-28 rounded-xl bg-[var(--bg-card)] skeleton-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Deterministic Next Action Logic
  const pendingTask = tasks.find(t => !t.is_completed);
  let nextAction = { title: '', desc: '', link: '', btnText: '' };

  if (pendingTask) {
    nextAction = { 
      title: `Complete: ${pendingTask.title}`, 
      desc: 'You have a pending task for today. Finish it to keep your momentum.', 
      link: '/dashboard', 
      btnText: 'Finish Task' 
    };
  } else if (orbitCount === 0) {
    nextAction = { 
      title: 'Explore a new topic', 
      desc: 'Start your learning journey by exploring a subject in Orbit.', 
      link: '/orbit', 
      btnText: 'Open Orbit' 
    };
  } else {
    nextAction = { 
      title: 'Continue where you left off.', 
      desc: 'Return to your actual unfinished lesson or start learning if you’re new.', 
      link: '/studysphere', 
      btnText: 'Open StudySphere' 
    };
  }

  return (
    <div className="max-w-[800px] mx-auto px-4 py-6 pb-24 pt-16 lg:pt-6">
      
      <ErrorBoundary title="Dashboard header failed">
        <DashboardHeader user={user} />
      </ErrorBoundary>

      <ErrorBoundary title="Next action failed to load">
        <HeroActionCard action={nextAction} />
      </ErrorBoundary>

      <ErrorBoundary title="Action grid failed to load">
        <ActionGrid onStartFocus={handleStartFocus} />
      </ErrorBoundary>

      <ErrorBoundary title="Philosophy strip failed">
        <PhilosophyJourney />
      </ErrorBoundary>

      <MobileNav active="home" navigate={navigate} />
    </div>
  );
}