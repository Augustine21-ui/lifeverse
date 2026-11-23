// frontend/src/pages/DashboardPage.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { 
  Flame, Calendar, CheckCircle, Clock, Plus, Play, BookOpen, 
  Rocket, Sparkles, Brain, Target, ArrowRight, ShieldCheck, Home, User, Users, X
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useMood } from '../context/MoodContext';
import FocusSession from '../components/FocusSession';
import HolographicAvatar from '../components/HolographicAvatar';
import OrbitProgressCard from '../components/orbit/OrbitProgressCard';
import { ErrorBoundary } from '../components/ErrorBoundary';

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function WelcomeHeader({ user, returning, stats }) {
  return (
    <header className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
          Welcome back, {user?.full_name?.split(' ')[0] || 'Learner'}
        </h1>
        <div className="flex items-center gap-3 mt-2 text-xs lg:text-sm text-[var(--text-muted)] font-medium">
          <span className="flex items-center gap-1.5"><Flame size={14} className="text-orange-400" /> {stats?.streakDays || 0} Day Streak</span>
          <span>•</span>
          <span>Level {Math.floor((stats?.totalXP || 0) / 500) + 1}</span>
        </div>
      </div>
      <div className="scale-90 lg:scale-100 origin-right">
        <HolographicAvatar />
      </div>
    </header>
  );
}

function NextActionCard({ action }) {
  const Icon = action.icon || Sparkles;
  const navigate = useNavigate();

  const handleClick = () => {
    if (action.isFocus) {
      document.getElementById('focus-input')?.focus();
    } else {
      navigate(action.link || '/orbit');
    }
  };

  return (
    <section className="mb-6">
      <article className="bg-[var(--bg-card)] border border-cyan-500/30 rounded-2xl p-6 lg:p-8 relative overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.1)]">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Icon size={80} className="text-cyan-400" />
        </div>
        <header className="flex items-center gap-2 text-[11px] lg:text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3">
          <Sparkles size={16} /> <span>Next Best Action</span>
        </header>
        <h2 className="text-xl lg:text-3xl font-bold text-[var(--text-primary)] leading-tight mb-2">
          {action.title}
        </h2>
        <p className="text-sm lg:text-base text-[var(--text-secondary)] max-w-lg mb-6">
          {action.desc}
        </p>
        <button
          onClick={handleClick}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-semibold hover:bg-gray-100 transition shadow-lg"
        >
          {action.btnText || 'Go to Action'} <ArrowRight size={18} />
        </button>
      </article>
    </section>
  );
}

function FocusSessionCard({ onStart, focusRemaining }) {
  const [duration, setDuration] = useState(25);
  const [topic, setTopic] = useState('');

  const handleStart = () => {
    if (!topic.trim() || focusRemaining <= 0) return;
    onStart(topic, duration);
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 lg:p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm lg:text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Clock size={18} className="text-cyan-400" /> Focus Session
        </h3>
        <span className="text-xs text-[var(--text-muted)]">{focusRemaining} left today</span>
      </div>
      <div className="flex gap-2 mb-3">
        {[10, 25, 45].map((mins) => (
          <button
            key={mins}
            onClick={() => setDuration(mins)}
            className={`flex-1 py-2 rounded-lg text-xs lg:text-sm font-medium transition ${
              duration === mins ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-[rgba(255,255,255,0.03)] text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.08)]'
            }`}
          >
            {mins}m
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          id="focus-input"
          type="text"
          className="flex-1 bg-[rgba(0,0,0,0.3)] text-[var(--text-primary)] text-sm rounded-lg px-3 py-2.5 outline-none border border-[var(--border)] focus:border-cyan-500/50 transition"
          placeholder="What to focus on?"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <button
          onClick={handleStart}
          disabled={!topic.trim() || focusRemaining <= 0}
          className="bg-cyan-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-cyan-500 transition disabled:opacity-50"
        >
          Start
        </button>
      </div>
    </div>
  );
}

function FirstTimeDashboard() {
  const navigate = useNavigate();
  return (
    <section className="mb-6">
      <div className="bg-gradient-to-br from-[rgba(139,92,246,0.10)] to-[rgba(99,102,241,0.05)] border border-[var(--border)] rounded-2xl p-8 lg:p-12 text-center shadow-md">
        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-2xl bg-[rgba(139,92,246,0.15)] text-[var(--accent)]">
          <BookOpen size={32} />
        </div>
        <h2 className="text-2xl lg:text-3xl font-bold text-[var(--text-primary)] tracking-tight mb-3">
          What would you like to learn?
        </h2>
        <p className="text-sm lg:text-base text-[var(--text-secondary)] max-w-md mx-auto mb-8 leading-relaxed">
          Choose a subject in the Academic Hub and KUA will adapt to your learning style.
        </p>
        <button
          onClick={() => navigate('/studysphere')}
          className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-white text-black font-semibold hover:bg-gray-100 transition shadow-lg"
        >
          Open Academic Hub <ArrowRight size={18} />
        </button>
      </div>
    </section>
  );
}

function PhilosophyStrip() {
  return (
    <div className="mt-10 pt-8 border-t border-[var(--border)]">
      <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest text-center mb-8">
        How KUA Connects Your Journey
      </h3>
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
        <div className="flex items-center gap-3 w-full md:w-auto bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border)]">
          <div className="p-2 bg-blue-500/10 rounded-lg"><BookOpen size={20} className="text-blue-400" /></div>
          <div>
            <p className="text-sm font-bold text-[var(--text-primary)]">Learning</p>
            <p className="text-xs text-[var(--text-secondary)]">Academic understanding</p>
          </div>
        </div>
        <ArrowRight className="hidden md:block text-[var(--text-muted)]" size={20} />
        <div className="flex items-center gap-3 w-full md:w-auto bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border)]">
          <div className="p-2 bg-purple-500/10 rounded-lg"><ShieldCheck size={20} className="text-purple-400" /></div>
          <div>
            <p className="text-sm font-bold text-[var(--text-primary)]">Capability</p>
            <p className="text-xs text-[var(--text-secondary)]">Applied through practice</p>
          </div>
        </div>
        <ArrowRight className="hidden md:block text-[var(--text-muted)]" size={20} />
        <div className="flex items-center gap-3 w-full md:w-auto bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border)]">
          <div className="p-2 bg-cyan-500/10 rounded-lg"><Rocket size={20} className="text-cyan-400" /></div>
          <div>
            <p className="text-sm font-bold text-[var(--text-primary)]">Opportunity</p>
            <p className="text-xs text-[var(--text-secondary)]">Where it can lead</p>
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-[var(--text-muted)] mt-6 max-w-sm mx-auto leading-relaxed">
        Learning does not automatically prove capability, and capability does not guarantee opportunity. KUA helps you connect these over time.
      </p>
    </div>
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
  const [focusMode, setFocusMode] = useState(false);
  const [focusTopic, setFocusTopic] = useState('');
  const [focusDuration, setFocusDuration] = useState(25);

  const prevProgressRef = useRef(null);

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

      const newProgress = Math.round(statsRes?.progressPercent ?? 0);
      if (prevProgressRef.current === null) {
        const stored = localStorage.getItem('lastProgressPercent');
        prevProgressRef.current = stored !== null ? parseInt(stored, 10) : newProgress;
      }
      if (prevProgressRef.current !== null && newProgress > prevProgressRef.current) {
        triggerMood?.('progress-visited', { meta: { previous: prevProgressRef.current, current: newProgress } });
      }
      prevProgressRef.current = newProgress;
      localStorage.setItem('lastProgressPercent', String(newProgress));

    } catch (err) {
      console.error('Dashboard load failed:', err);
      showToast?.('Some dashboard sections failed to load', 'error');
    } finally {
      setLoading(false);
    }
  }, [triggerMood, showToast]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleStartFocus = (topic, duration) => {
    if (focusRemaining <= 0) return showToast?.('No focus sessions left today', 'error');
    setFocusTopic(topic);
    setFocusDuration(duration);
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

  if (focusMode) {
    return <FocusSession topic={focusTopic} duration={focusDuration} onEnd={handleFocusEnd} onCancel={() => setFocusMode(false)} />;
  }

  if (loading) {
    return (
      <div className="max-w-[1160px] mx-auto px-4 lg:px-5 py-6 pb-24 lg:pb-12 pt-16 lg:pt-6">
        <div className="grid gap-4 pt-2">
          <div className="h-7 w-2/5 rounded-lg bg-[var(--bg-card)] skeleton-pulse" />
          <div className="h-4 w-3/5 rounded-md bg-[var(--bg-card)] skeleton-pulse" />
          <div className="h-44 rounded-2xl bg-[var(--bg-card)] skeleton-pulse" />
        </div>
      </div>
    );
  }

  // Determine if user is returning (has stats or orbit sessions)
  const returning = (stats?.totalXP > 0) || (orbitCount > 0) || (tasks.length > 0);

  // Deterministic Next Action Logic
  const pendingTask = tasks.find(t => !t.is_completed);
  let nextAction = { title: '', desc: '', link: '', btnText: '', icon: Target, isFocus: false };

  if (pendingTask) {
    nextAction = { title: `Complete: ${pendingTask.title}`, desc: 'You have a pending task for today. Finish it to keep your momentum.', link: '/dashboard', btnText: 'Finish Task', icon: CheckCircle };
  } else if (focusRemaining > 0) {
    nextAction = { title: 'Start a Focus Session', desc: 'Deep work builds capability. You have focus sessions remaining today.', link: '', btnText: 'Focus Now', icon: Clock, isFocus: true };
  } else if (orbitCount === 0) {
    nextAction = { title: 'Explore a new topic in Orbit', desc: 'Keep your learning momentum going by exploring a new subject.', link: '/orbit', btnText: 'Launch Orbit', icon: Rocket };
  } else {
    nextAction = { title: 'Review your Study Hub', desc: 'Check your recent lessons and track your academic momentum.', link: '/studysphere', btnText: 'Open Study', icon: BookOpen };
  }

  return (
    <div className="max-w-[1160px] mx-auto px-4 lg:px-5 py-6 pb-24 lg:pb-12 pt-16 lg:pt-6">
      
      <ErrorBoundary title="Dashboard header failed">
        <WelcomeHeader user={user} returning={returning} stats={stats} />
      </ErrorBoundary>

      {/* 1. HERO: Next Useful Action */}
      {returning ? (
        <ErrorBoundary title="Next action failed to load">
          <NextActionCard action={nextAction} />
        </ErrorBoundary>
      ) : (
        <ErrorBoundary title="Dashboard failed to load">
          <FirstTimeDashboard />
        </ErrorBoundary>
      )}

      {/* 2. COMPACT FOCUS & PROGRESS */}
      {returning && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <FocusSessionCard onStart={handleStartFocus} focusRemaining={focusRemaining} />
          <OrbitProgressCard />
        </div>
      )}

      {/* 3. PHILOSOPHY STRIP */}
      <ErrorBoundary title="Philosophy strip failed">
        <PhilosophyStrip />
      </ErrorBoundary>

      <MobileNav active="home" navigate={navigate} />
    </div>
  );
}