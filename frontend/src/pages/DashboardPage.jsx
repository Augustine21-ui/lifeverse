// frontend/src/pages/DashboardPage.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useMood } from '../context/MoodContext';
import ErrorBoundary from '../components/ErrorBoundary';
import FocusSession from '../components/FocusSession';
import HolographicAvatar from '../components/HolographicAvatar';
import {
  Play, BookOpen, Target, Compass, Rocket, CheckCircle, Calendar, ArrowRight,
  Home, Users, User, BarChart, Clock, Flame, Smile, Sparkles
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Quote logic
// ─────────────────────────────────────────────────────────────
const QUOTES = [
  "Success is the sum of small efforts repeated every day.",
  "Small progress every day leads to big success.",
  "Believe you can and you're halfway there.",
  "The only way to do great work is to love what you do.",
  "Don't watch the clock; do what it does. Keep going.",
  "The secret of getting ahead is getting started.",
  "Strive for progress, not perfection.",
];
const getDailyQuote = () => QUOTES[new Date().getDate() % QUOTES.length];

// ─────────────────────────────────────────────────────────────
// State detection (§4.F, §5) — deterministic, no AI
// ─────────────────────────────────────────────────────────────
function isReturningLearner({ stats, tasks, timetable, assignments, orbitCount, lessonProgress }) {
  const hasLessons = Number(lessonProgress?.lessons_started ?? 0) > 0;
  const hasTasks = Array.isArray(tasks) && tasks.length > 0;
  const hasTimetable = Array.isArray(timetable) && timetable.length > 0;
  const hasAssignments = Array.isArray(assignments) && assignments.length > 0;
  const orbits = typeof orbitCount === 'number' ? orbitCount : (orbitCount?.count ?? 0);
  const hasOrbit = orbits > 0;
  const hasXp = Number(stats?.xp ?? stats?.user?.xp ?? 0) > 0;
  return hasLessons || hasTasks || hasTimetable || hasAssignments || hasOrbit || hasXp;
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function WelcomeHeader({ user, returning, focusRemaining = 0, onStartFocus }) {
  const firstName = (user?.full_name || user?.username || 'Learner').split(' ')[0];
  const dailyQuote = getDailyQuote();
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <header className="flex flex-col gap-5 mb-6 mt-4 text-left w-full">
      
      {/* Top Row: Avatar & Focus Button */}
      <div className="flex items-start justify-between w-full pl-1">
        <div className="relative p-[2px] rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#3b82f6] shadow-[0_0_20px_rgba(139,92,246,0.3)] shrink-0">
          <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full overflow-hidden bg-[#1a1a20] flex items-center justify-center relative">
            <HolographicAvatar size={returning ? 64 : 80} />
            <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/20 pointer-events-none" />
          </div>
        </div>

        {returning && focusRemaining > 0 && (
          <button
            type="button"
            onClick={onStartFocus}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] text-[13px] lg:text-sm font-medium hover:border-[var(--accent)] transition-colors"
          >
            <Play size={14} className="text-[var(--accent)]" />
            <span>Focus</span>
            <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded-full bg-[rgba(139,92,246,0.15)] text-[var(--accent)] text-[11px] font-semibold">
              {focusRemaining}
            </span>
          </button>
        )}
      </div>

      {/* Bottom Row: Greeting & Quote */}
      <div className="flex flex-col min-w-0 pl-1">
        <h1 className="text-[26px] lg:text-3xl font-bold text-[var(--text-primary)] truncate leading-tight m-0">
          {returning ? `Welcome back, ${firstName}` : `Hi ${firstName}.`}
        </h1>
        <p className="text-[14px] lg:text-base text-[var(--text-secondary)] truncate mt-1 m-0">
          {returning ? 'Pick up where you left off.' : 'What would you like to learn today?'}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-2.5 text-[11px] lg:text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1"><Calendar size={12}/> {dateStr}</span>
          <span className="hidden sm:inline">•</span>
          <span className="italic truncate max-w-full">"{dailyQuote}"</span>
        </div>
      </div>
    </header>
  );
}

function StatsRow({ stats, user }) {
  const studyMins = stats?.studyTimeMinutes ?? 0;
  const displayStudy = studyMins >= 60 ? `${Math.floor(studyMins/60)}h ${studyMins%60}m` : `${studyMins}m`;
  const level = Math.floor((stats?.xp ?? stats?.user?.xp ?? 0) / 100) || 1;
  
  return (
    <div className="flex overflow-x-auto gap-3 pb-3 mb-2 -mx-4 px-4 snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {/* Level */}
      <div className="snap-start shrink-0 w-[85px] bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3 flex flex-col items-center">
        <BarChart size={16} className="text-[#8b5cf6] mb-1.5" />
        <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-0.5">Level</span>
        <span className="text-lg font-bold text-[var(--text-primary)] leading-none">{level}</span>
      </div>
      {/* Study */}
      <div className="snap-start shrink-0 w-[85px] bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3 flex flex-col items-center">
        <Clock size={16} className="text-cyan-400 mb-1.5" />
        <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-0.5">Study</span>
        <span className="text-lg font-bold text-[var(--text-primary)] leading-none">{displayStudy}</span>
      </div>
      {/* Streak */}
      <div className="snap-start shrink-0 w-[85px] bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3 flex flex-col items-center">
        <Flame size={16} className="text-orange-400 mb-1.5" />
        <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-0.5">Streak</span>
        <span className="text-lg font-bold text-[var(--text-primary)] leading-none">{stats?.streakDays ?? 0}</span>
      </div>
      {/* Mood */}
      <div className="snap-start shrink-0 w-[85px] bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3 flex flex-col items-center">
        <Smile size={16} className="text-yellow-400 mb-1.5" />
        <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-0.5">Mood</span>
        <span className="text-sm font-bold text-[var(--text-primary)] leading-none truncate w-full text-center mt-1 capitalize">{user?.mood || 'Neutral'}</span>
      </div>
    </div>
  );
}

function FocusSessionCard({ onStart }) {
  const [duration, setDuration] = useState(25);
  const [topic, setTopic] = useState('');

  const handleStart = () => {
    if (!topic.trim()) return;
    onStart(topic, duration);
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 mb-4">
      <h2 className="text-[15px] font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-4">
        <Clock size={18} className="text-cyan-400" /> Focus Session
      </h2>
      
      <div className="flex gap-2 mb-3">
        {[10, 25, 45].map((mins) => (
          <button
            key={mins}
            onClick={() => setDuration(mins)}
            className={`flex-1 py-2 text-[13px] rounded-xl font-medium transition-colors border ${
              duration === mins
                ? 'bg-[rgba(139,92,246,0.15)] border-[#8b5cf6] text-[#c084fc]'
                : 'bg-transparent border-[var(--border)] text-[var(--text-secondary)] hover:bg-white/5'
            }`}
          >
            {mins}m
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          className="flex-1 bg-[#121218] text-[var(--text-primary)] text-[13px] rounded-xl px-4 py-3 placeholder-[var(--text-muted)] outline-none border border-[var(--border)] focus:border-[var(--accent)] transition-colors"
          placeholder="What to focus on?"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleStart()}
        />
        <button
          onClick={handleStart}
          disabled={!topic.trim()}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
        >
          <Play size={14} /> Start
        </button>
      </div>
    </div>
  );
}

function PhilosophyStrip() {
  const nodes = [
    { icon: BookOpen, label: 'Learning', sub: 'Academic understanding' },
    { icon: Target, label: 'Capability', sub: 'Applied through practice' },
    { icon: Compass, label: 'Opportunity', sub: 'Where it can lead' },
  ];

  return (
    <section className="mt-6 lg:mt-8 p-4 lg:p-5 rounded-2xl bg-gradient-to-br from-[rgba(139,92,246,0.05)] to-[rgba(99,102,241,0.02)] border border-[var(--border)]">
      <p className="text-[10px] lg:text-[12px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3 lg:mb-4">
        How KUA connects your journey
      </p>
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-3">
        {nodes.map((n, i) => (
          <div key={n.label} className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-xl bg-[rgba(139,92,246,0.12)] text-[var(--accent)] shrink-0">
              <n.icon size={16} className="lg:w-[18px] lg:h-[18px]" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[13px] lg:text-sm font-semibold text-[var(--text-primary)]">{n.label}</span>
              <span className="text-[11px] lg:text-xs text-[var(--text-muted)] mt-0.5">{n.sub}</span>
            </div>
            {i < nodes.length - 1 && (
              <span className="hidden lg:block text-[var(--text-muted)] text-base px-1.5" aria-hidden>→</span>
            )}
          </div>
        ))}
      </div>
      <p className="mt-4 pt-3 border-t border-[var(--border)] text-[11px] lg:text-xs leading-relaxed text-[var(--text-muted)] m-0">
        Learning does not automatically prove capability, and capability does not guarantee opportunity.
        KUA helps you connect these over time.
      </p>
    </section>
  );
}

function ReturningDashboard({ stackedSuggestions }) {
  const navigate = useNavigate();

  const challenge = Array.isArray(stackedSuggestions) && stackedSuggestions.length > 0 ? stackedSuggestions[0] : null;

  return (
    <section className="flex flex-col gap-4">
      {/* Suggested for you */}
      {challenge && (
        <article className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 flex flex-col gap-2 transition-colors">
          <header className="flex items-center gap-2 text-[11px] lg:text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            <Rocket size={16} className="text-[#8b5cf6]" /> <span>Suggested for you</span>
          </header>
          <h3 className="text-[17px] font-semibold text-[var(--text-primary)] leading-tight m-0 line-clamp-2">
            {challenge.title || 'Practical challenge'}
          </h3>
          <p className="text-[13px] lg:text-sm text-[var(--text-secondary)] m-0 line-clamp-2">
            {challenge.reason || challenge.text || 'Practise a real problem in Orbit.'}
          </p>
          <button
            onClick={() => navigate('/orbit')}
            className="inline-flex items-center gap-1.5 self-start mt-2 px-3.5 py-2 rounded-lg bg-[rgba(139,92,246,0.12)] text-[var(--accent)] text-[13px] lg:text-sm font-medium hover:bg-[rgba(139,92,246,0.20)] transition-colors"
          >
            Open Orbit <ArrowRight size={14} />
          </button>
        </article>
      )}

      {/* Next Useful Action - Distinct from Orbit */}
      <article className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 flex flex-col gap-2 transition-colors">
        <header className="flex items-center gap-2 text-[11px] lg:text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          <Target size={16} className="text-cyan-400" /> <span>Next useful action</span>
        </header>
        <h3 className="text-[17px] font-semibold text-[var(--text-primary)] leading-tight m-0 truncate">
          Review your Study Hub
        </h3>
        <p className="text-[13px] lg:text-sm text-[var(--text-secondary)] m-0 line-clamp-2">
          Check your recent lessons and track your academic momentum.
        </p>
        <button
          onClick={() => navigate('/studysphere')}
          className="inline-flex items-center gap-1.5 self-start mt-2 px-3.5 py-2 rounded-lg bg-[rgba(139,92,246,0.12)] text-[var(--accent)] text-[13px] lg:text-sm font-medium hover:bg-[rgba(139,92,246,0.20)] transition-colors"
        >
          Open Study <ArrowRight size={14} />
        </button>
      </article>
    </section>
  );
}

function FirstTimeDashboard() {
  const navigate = useNavigate();

  return (
    <section className="flex flex-col gap-4">
      <div className="bg-gradient-to-br from-[rgba(139,92,246,0.10)] to-[rgba(99,102,241,0.05)] border border-[var(--border)] rounded-2xl p-6 lg:p-9 text-center shadow-md">
        <div className="w-12 h-12 lg:w-14 lg:h-14 mx-auto mb-3 lg:mb-4 flex items-center justify-center rounded-2xl bg-[rgba(139,92,246,0.15)] text-[var(--accent)]">
          <BookOpen size={24} className="lg:w-7 lg:h-7" />
        </div>
        <h2 className="text-xl lg:text-[26px] font-bold text-[var(--text-primary)] tracking-tight mb-2">
          Start learning
        </h2>
        <p className="text-sm lg:text-[15px] text-[var(--text-secondary)] max-w-sm mx-auto mb-5 lg:mb-6 leading-relaxed">
          Choose a subject in the Academic Hub and KUA will adapt as you go.
        </p>
        <button
          type="button"
          onClick={() => navigate('/studysphere')}
          className="btn-primary inline-flex items-center justify-center gap-2 px-5 py-2.5 lg:py-3 text-sm lg:text-[15px] w-full sm:w-auto"
        >
          Open Academic Hub <ArrowRight size={16} />
        </button>
      </div>
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
// Main component
// ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const { triggerMood } = useMood();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [orbitCount, setOrbitCount] = useState(0);
  const [stackedSuggestions, setStackedSuggestions] = useState([]);
  const [lessonProgress, setLessonProgress] = useState(null);

  const [focusMode, setFocusMode] = useState(false);
  const [focusRemaining, setFocusRemaining] = useState(0);
  const [focusDuration, setFocusDuration] = useState(25);
  const [focusTopic, setFocusTopic] = useState('');

  const prevProgressRef = useRef(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [
        statsRes, tasksRes, timetableRes, assignmentsRes,
        orbitRes, suggestionsRes, lessonsRes, focusRes
      ] = await Promise.all([
        api.getDashboardStats?.().catch(() => null)     ?? Promise.resolve(null),
        api.getTodayTasks?.().catch(() => [])           ?? Promise.resolve([]),
        api.getTimetable?.().catch(() => [])            ?? Promise.resolve([]),
        api.getAssignments?.().catch(() => [])          ?? Promise.resolve([]),
        api.getOrbitSessionCount?.().catch(() => null)  ?? Promise.resolve(null),
        api.getStackedSuggestions?.().catch(() => null) ?? Promise.resolve(null),
        api.getLessonProgress?.().catch(() => null)     ?? Promise.resolve(null),
        api.getFocusRemaining?.().catch(() => null)     ?? Promise.resolve(null),
      ]);

      setStats(statsRes);
      setTasks(Array.isArray(tasksRes) ? tasksRes : (tasksRes?.tasks ?? []));
      setTimetable(Array.isArray(timetableRes) ? timetableRes : []);
      setAssignments(Array.isArray(assignmentsRes) ? assignmentsRes : []);
      setOrbitCount(typeof orbitRes === 'number' ? orbitRes : (orbitRes?.count ?? 0));
      setStackedSuggestions(suggestionsRes?.suggestions ?? []);
      setLessonProgress(lessonsRes ?? null);

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
    if (focusRemaining <= 0) {
      showToast?.('No focus sessions left today', 'error');
      return;
    }
    setFocusTopic(topic);
    setFocusDuration(duration);
    setFocusMode(true);
  };

  const cancelFocus = () => setFocusMode(false);

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
    return (
      <FocusSession
        topic={focusTopic}
        duration={focusDuration}
        onEnd={handleFocusEnd}
        onCancel={cancelFocus}
      />
    );
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

  const returning = isReturningLearner({
    stats, tasks, timetable, assignments, orbitCount, lessonProgress,
  });

  return (
    <div className="max-w-[1160px] mx-auto px-4 lg:px-5 py-6 pb-24 lg:pb-12 pt-16 lg:pt-6">
      <ErrorBoundary title="Dashboard header failed">
        <WelcomeHeader
          user={user}
          returning={returning}
          onStartFocus={() => document.querySelector('input[placeholder="What to focus on?"]')?.focus()}
          focusRemaining={focusRemaining}
        />
      </ErrorBoundary>

      <StatsRow stats={stats} user={user} />
      
      <FocusSessionCard onStart={handleStartFocus} />

      {returning ? (
        <ErrorBoundary title="Some dashboard sections failed to load">
          <ReturningDashboard stackedSuggestions={stackedSuggestions} />
        </ErrorBoundary>
      ) : (
        <ErrorBoundary title="Dashboard failed to load">
          <FirstTimeDashboard />
        </ErrorBoundary>
      )}

      <ErrorBoundary title="Philosophy strip failed">
        <PhilosophyStrip />
      </ErrorBoundary>

      <MobileNav active="home" navigate={navigate} />
    </div>
  );
}