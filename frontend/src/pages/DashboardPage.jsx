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
  Home, Users, User,
} from 'lucide-react';

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

  return (
    <header className="flex items-start justify-between gap-3 mb-6 mt-2">
      
      {/* Left Column: Left-Aligned Text */}
      <div className="flex flex-col flex-1 min-w-0 text-left mt-1">
        <h1 className="text-[18px] lg:text-2xl font-bold text-[var(--text-primary)] truncate leading-tight m-0">
          {returning ? `Welcome back, ${firstName}` : `Hi ${firstName}.`}
        </h1>
        <p className="text-[13px] lg:text-sm text-[var(--text-secondary)] truncate mt-1 m-0">
          {returning ? 'Pick up where you left off.' : 'What would you like to learn today?'}
        </p>
      </div>

      {/* Right Column: Avatar & Focus Button Stacked */}
      <div className="flex flex-col items-end gap-3 shrink-0">
        
        {/* Premium Holographic Avatar Badge */}
        <div className="relative p-[2px] rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#3b82f6] shadow-[0_0_15px_rgba(139,92,246,0.4)]">
          <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full overflow-hidden bg-[#1a1a20] flex items-center justify-center relative">
            <HolographicAvatar size={returning ? 48 : 56} />
            {/* Subtle inner ring to unify edges */}
            <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/20 pointer-events-none" />
          </div>
        </div>

        {/* Focus Button */}
        {returning && focusRemaining > 0 && (
          <button
            type="button"
            onClick={onStartFocus}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] text-[12px] lg:text-sm font-medium hover:border-[var(--accent)] transition-colors"
          >
            <Play size={12} className="text-[var(--accent)]" />
            <span>Focus</span>
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[rgba(139,92,246,0.15)] text-[var(--accent)] text-[10px] font-semibold">
              {focusRemaining}
            </span>
          </button>
        )}
      </div>
    </header>
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

function FirstTimeDashboard() {
  const navigate = useNavigate();

  return (
    <section className="flex flex-col gap-3 lg:gap-4">
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

      <button
        type="button"
        onClick={() => navigate('/orbit')}
        className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-left hover:border-[var(--accent)] transition-colors min-h-[68px]"
      >
        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[rgba(139,92,246,0.10)] text-[var(--accent)] shrink-0">
          <Rocket size={18} />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="font-semibold text-[14px] lg:text-[15px] text-[var(--text-primary)]">Explore a practical challenge</span>
          <span className="text-xs lg:text-sm text-[var(--text-secondary)] mt-0.5">Practice real problems in Orbit</span>
        </div>
        <ArrowRight size={16} className="text-[var(--text-muted)] shrink-0" />
      </button>
    </section>
  );
}

function ReturningDashboard({ tasks, timetable, assignments, orbitCount, stackedSuggestions, lessonProgress, onCompleteTask }) {
  const navigate = useNavigate();

  const lesson = pickUnfinishedLesson(lessonProgress);
  const openTask = Array.isArray(tasks) ? tasks.find(t => !t.is_completed) : null;
  const upcoming = pickUpcoming(timetable, assignments);
  const challenge = Array.isArray(stackedSuggestions) && stackedSuggestions.length > 0 ? stackedSuggestions[0] : null;
  const orbits = typeof orbitCount === 'number' ? orbitCount : (orbitCount?.count ?? 0);
  const next = pickNextAction({ lesson, openTask, upcoming, orbits });

  const hasAny = lesson || openTask || upcoming || challenge;
  if (!hasAny) {
    return (
      <section className="my-6">
        <button onClick={() => navigate('/studysphere')} className="btn-primary inline-flex items-center gap-2">
          Open Academic Hub <ArrowRight size={16} />
        </button>
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
      {lesson && (
        <article className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 lg:p-5 flex flex-col gap-2 hover:border-[rgba(139,92,246,0.35)] transition-colors">
          <header className="flex items-center gap-2 text-[11px] lg:text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            <BookOpen size={16} /> <span>Continue learning</span>
          </header>
          <h3 className="text-[15px] lg:text-[17px] font-semibold text-[var(--text-primary)] leading-tight m-0 truncate">{lesson.title}</h3>
          <p className="text-xs lg:text-sm text-[var(--text-secondary)] m-0 truncate">{lesson.subject}</p>
          <div className="flex items-center gap-2.5 my-1">
            <div className="flex-1 h-1.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[var(--accent)] to-[#c084fc] rounded-full" style={{ width: `${lesson.progress}%` }} />
            </div>
            <span className="text-[11px] lg:text-xs font-semibold text-[var(--text-secondary)] min-w-[30px] text-right">{lesson.progress}%</span>
          </div>
          <button
            onClick={() => navigate(lesson.href)}
            className="inline-flex items-center gap-1.5 self-start mt-1 px-3 py-1.5 lg:px-3.5 lg:py-2 rounded-lg bg-[rgba(139,92,246,0.12)] text-[var(--accent)] text-xs lg:text-sm font-medium hover:bg-[rgba(139,92,246,0.20)] transition-colors"
          >
            Resume lesson <ArrowRight size={14} />
          </button>
        </article>
      )}

      {openTask && (
        <article className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 lg:p-5 flex flex-col gap-2 hover:border-[rgba(139,92,246,0.35)] transition-colors">
          <header className="flex items-center gap-2 text-[11px] lg:text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            <CheckCircle size={16} /> <span>Today's task</span>
          </header>
          <h3 className="text-[15px] lg:text-[17px] font-semibold text-[var(--text-primary)] leading-tight m-0 line-clamp-2">{openTask.title}</h3>
          {openTask.due_date && (
            <p className="text-xs lg:text-sm text-[var(--text-secondary)] m-0">
              Due {new Date(openTask.due_date).toLocaleDateString()}
            </p>
          )}
          <label className="flex items-center gap-2.5 cursor-pointer min-h-[44px] text-sm text-[var(--text-secondary)] mt-1">
            <input
              type="checkbox"
              onChange={() => onCompleteTask(openTask)}
              className="w-4 h-4 accent-[var(--accent)]"
            />
            <span className="text-xs lg:text-sm">Mark as done</span>
          </label>
        </article>
      )}

      {upcoming && (
        <article className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 lg:p-5 flex flex-col gap-2 hover:border-[rgba(139,92,246,0.35)] transition-colors">
          <header className="flex items-center gap-2 text-[11px] lg:text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            <Calendar size={16} /> <span>Coming up</span>
          </header>
          <h3 className="text-[15px] lg:text-[17px] font-semibold text-[var(--text-primary)] leading-tight m-0 truncate">{upcoming.title}</h3>
          <p className="text-xs lg:text-sm text-[var(--text-secondary)] m-0 line-clamp-2">{upcoming.when}</p>
          <button
            onClick={() => navigate(upcoming.href)}
            className="inline-flex items-center gap-1.5 self-start mt-1 px-3 py-1.5 lg:px-3.5 lg:py-2 rounded-lg bg-[rgba(139,92,246,0.12)] text-[var(--accent)] text-xs lg:text-sm font-medium hover:bg-[rgba(139,92,246,0.20)] transition-colors"
          >
            Open <ArrowRight size={14} />
          </button>
        </article>
      )}

      {challenge && (
        <article className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 lg:p-5 flex flex-col gap-2 hover:border-[rgba(139,92,246,0.35)] transition-colors">
          <header className="flex items-center gap-2 text-[11px] lg:text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            <Rocket size={16} /> <span>Suggested for you</span>
          </header>
          <h3 className="text-[15px] lg:text-[17px] font-semibold text-[var(--text-primary)] leading-tight m-0 line-clamp-2">
            {challenge.title || 'Practical challenge'}
          </h3>
          <p className="text-xs lg:text-sm text-[var(--text-secondary)] m-0 line-clamp-2">
            {challenge.reason || challenge.text || 'Practise a real problem in Orbit.'}
          </p>
          <button
            onClick={() => navigate('/orbit')}
            className="inline-flex items-center gap-1.5 self-start mt-1 px-3 py-1.5 lg:px-3.5 lg:py-2 rounded-lg bg-[rgba(139,92,246,0.12)] text-[var(--accent)] text-xs lg:text-sm font-medium hover:bg-[rgba(139,92,246,0.20)] transition-colors"
          >
            Open Orbit <ArrowRight size={14} />
          </button>
        </article>
      )}

      {next && (
        <article className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 lg:p-5 flex flex-col gap-2 hover:border-[rgba(139,92,246,0.35)] transition-colors">
          <header className="flex items-center gap-2 text-[11px] lg:text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            <Target size={16} /> <span>Next useful action</span>
          </header>
          <h3 className="text-[15px] lg:text-[17px] font-semibold text-[var(--text-primary)] leading-tight m-0 truncate">{next.title}</h3>
          <p className="text-xs lg:text-sm text-[var(--text-secondary)] m-0 line-clamp-2">{next.reason}</p>
          <button
            onClick={() => navigate(next.href)}
            className="inline-flex items-center gap-1.5 self-start mt-1 px-3 py-1.5 lg:px-3.5 lg:py-2 rounded-lg bg-[rgba(139,92,246,0.12)] text-[var(--accent)] text-xs lg:text-sm font-medium hover:bg-[rgba(139,92,246,0.20)] transition-colors"
          >
            {next.cta} <ArrowRight size={14} />
          </button>
        </article>
      )}
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
// Helpers
// ─────────────────────────────────────────────────────────────

function pickUnfinishedLesson(lp) {
  if (!lp) return null;
  const raw = lp.current ?? lp.unfinished ?? lp.in_progress;
  if (!raw) return null;
  const progress = Number(raw.progress_percent ?? raw.progress ?? 0);
  if (progress <= 0 || progress >= 100) return null;
  return {
    title: raw.lesson_title || raw.title || 'Unfinished lesson',
    subject: raw.subject || raw.course || 'Academic',
    progress: Math.round(progress),
    href: raw.href || `/studysphere?lesson=${raw.id ?? ''}`,
  };
}

function pickUpcoming(timetable, assignments) {
  const now = Date.now();
  const cands = [];
  (Array.isArray(assignments) ? assignments : []).forEach(a => {
    const when = a.due_date || a.due_at || a.deadline;
    if (!when) return;
    const t = new Date(when).getTime();
    if (Number.isNaN(t) || t < now) return;
    cands.push({
      title: a.title || a.name || 'Assignment',
      when: `Due ${new Date(when).toLocaleString()}`,
      time: t,
      href: `/studysphere?assignment=${a.id ?? ''}`,
    });
  });
  (Array.isArray(timetable) ? timetable : []).forEach(e => {
    const when = e.starts_at || e.start_time;
    if (!when) return;
    const t = new Date(when).getTime();
    if (Number.isNaN(t) || t < now) return;
    cands.push({
      title: e.subject_name || e.title || 'Class',
      when: `Starts ${new Date(when).toLocaleString()}`,
      time: t,
      href: `/studysphere?timetable=${e.id ?? ''}`,
    });
  });
  cands.sort((a, b) => a.time - b.time);
  return cands[0] ?? null;
}

function pickNextAction({ lesson, openTask, upcoming, orbits }) {
  if (lesson || openTask || upcoming) return null;
  if (orbits > 0) {
    return { title: 'Practise in Orbit', reason: 'Keep your learning active with a short session.', cta: 'Open Orbit', href: '/orbit' };
  }
  return { title: 'Start a lesson', reason: 'Pick a subject in the Academic Hub to begin.', cta: 'Open Academic Hub', href: '/studysphere' };
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
  const [focusDuration] = useState(25);

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

  const handleCompleteTask = async (task) => {
    try {
      await api.completeTask(task.id);
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_completed: true } : t));
      triggerMood?.('task-complete');
      showToast?.(`Task completed +${task.xp_reward || 30} XP`);
      await loadDashboard();
      await refreshUser?.();
    } catch (err) {
      showToast?.(err.message || 'Failed to complete task', 'error');
    }
  };

  const startFocusSession = () => {
    if (focusRemaining <= 0) {
      showToast?.('No focus sessions left today', 'error');
      return;
    }
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
        topic="Focus Session"
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
          onStartFocus={startFocusSession}
          focusRemaining={focusRemaining}
        />
      </ErrorBoundary>

      {returning ? (
        <ErrorBoundary title="Some dashboard sections failed to load">
          <ReturningDashboard
            tasks={tasks}
            timetable={timetable}
            assignments={assignments}
            orbitCount={orbitCount}
            stackedSuggestions={stackedSuggestions}
            lessonProgress={lessonProgress}
            onCompleteTask={handleCompleteTask}
          />
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
}// frontend/src/pages/DashboardPage.jsx
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
  Home, Users, User,
} from 'lucide-react';

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

  return (
    <header className="flex items-start justify-between gap-3 mb-6 mt-2">
      
      {/* Left Column: Left-Aligned Text */}
      <div className="flex flex-col flex-1 min-w-0 text-left mt-1">
        <h1 className="text-[18px] lg:text-2xl font-bold text-[var(--text-primary)] truncate leading-tight m-0">
          {returning ? `Welcome back, ${firstName}` : `Hi ${firstName}.`}
        </h1>
        <p className="text-[13px] lg:text-sm text-[var(--text-secondary)] truncate mt-1 m-0">
          {returning ? 'Pick up where you left off.' : 'What would you like to learn today?'}
        </p>
      </div>

      {/* Right Column: Avatar & Focus Button Stacked */}
      <div className="flex flex-col items-end gap-3 shrink-0">
        
        {/* Premium Holographic Avatar Badge */}
        <div className="relative p-[2px] rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#3b82f6] shadow-[0_0_15px_rgba(139,92,246,0.4)]">
          <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full overflow-hidden bg-[#1a1a20] flex items-center justify-center relative">
            <HolographicAvatar size={returning ? 48 : 56} />
            {/* Subtle inner ring to unify edges */}
            <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/20 pointer-events-none" />
          </div>
        </div>

        {/* Focus Button */}
        {returning && focusRemaining > 0 && (
          <button
            type="button"
            onClick={onStartFocus}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] text-[12px] lg:text-sm font-medium hover:border-[var(--accent)] transition-colors"
          >
            <Play size={12} className="text-[var(--accent)]" />
            <span>Focus</span>
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[rgba(139,92,246,0.15)] text-[var(--accent)] text-[10px] font-semibold">
              {focusRemaining}
            </span>
          </button>
        )}
      </div>
    </header>
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

function FirstTimeDashboard() {
  const navigate = useNavigate();

  return (
    <section className="flex flex-col gap-3 lg:gap-4">
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

      <button
        type="button"
        onClick={() => navigate('/orbit')}
        className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-left hover:border-[var(--accent)] transition-colors min-h-[68px]"
      >
        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[rgba(139,92,246,0.10)] text-[var(--accent)] shrink-0">
          <Rocket size={18} />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="font-semibold text-[14px] lg:text-[15px] text-[var(--text-primary)]">Explore a practical challenge</span>
          <span className="text-xs lg:text-sm text-[var(--text-secondary)] mt-0.5">Practice real problems in Orbit</span>
        </div>
        <ArrowRight size={16} className="text-[var(--text-muted)] shrink-0" />
      </button>
    </section>
  );
}

function ReturningDashboard({ tasks, timetable, assignments, orbitCount, stackedSuggestions, lessonProgress, onCompleteTask }) {
  const navigate = useNavigate();

  const lesson = pickUnfinishedLesson(lessonProgress);
  const openTask = Array.isArray(tasks) ? tasks.find(t => !t.is_completed) : null;
  const upcoming = pickUpcoming(timetable, assignments);
  const challenge = Array.isArray(stackedSuggestions) && stackedSuggestions.length > 0 ? stackedSuggestions[0] : null;
  const orbits = typeof orbitCount === 'number' ? orbitCount : (orbitCount?.count ?? 0);
  const next = pickNextAction({ lesson, openTask, upcoming, orbits });

  const hasAny = lesson || openTask || upcoming || challenge;
  if (!hasAny) {
    return (
      <section className="my-6">
        <button onClick={() => navigate('/studysphere')} className="btn-primary inline-flex items-center gap-2">
          Open Academic Hub <ArrowRight size={16} />
        </button>
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
      {lesson && (
        <article className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 lg:p-5 flex flex-col gap-2 hover:border-[rgba(139,92,246,0.35)] transition-colors">
          <header className="flex items-center gap-2 text-[11px] lg:text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            <BookOpen size={16} /> <span>Continue learning</span>
          </header>
          <h3 className="text-[15px] lg:text-[17px] font-semibold text-[var(--text-primary)] leading-tight m-0 truncate">{lesson.title}</h3>
          <p className="text-xs lg:text-sm text-[var(--text-secondary)] m-0 truncate">{lesson.subject}</p>
          <div className="flex items-center gap-2.5 my-1">
            <div className="flex-1 h-1.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[var(--accent)] to-[#c084fc] rounded-full" style={{ width: `${lesson.progress}%` }} />
            </div>
            <span className="text-[11px] lg:text-xs font-semibold text-[var(--text-secondary)] min-w-[30px] text-right">{lesson.progress}%</span>
          </div>
          <button
            onClick={() => navigate(lesson.href)}
            className="inline-flex items-center gap-1.5 self-start mt-1 px-3 py-1.5 lg:px-3.5 lg:py-2 rounded-lg bg-[rgba(139,92,246,0.12)] text-[var(--accent)] text-xs lg:text-sm font-medium hover:bg-[rgba(139,92,246,0.20)] transition-colors"
          >
            Resume lesson <ArrowRight size={14} />
          </button>
        </article>
      )}

      {openTask && (
        <article className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 lg:p-5 flex flex-col gap-2 hover:border-[rgba(139,92,246,0.35)] transition-colors">
          <header className="flex items-center gap-2 text-[11px] lg:text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            <CheckCircle size={16} /> <span>Today's task</span>
          </header>
          <h3 className="text-[15px] lg:text-[17px] font-semibold text-[var(--text-primary)] leading-tight m-0 line-clamp-2">{openTask.title}</h3>
          {openTask.due_date && (
            <p className="text-xs lg:text-sm text-[var(--text-secondary)] m-0">
              Due {new Date(openTask.due_date).toLocaleDateString()}
            </p>
          )}
          <label className="flex items-center gap-2.5 cursor-pointer min-h-[44px] text-sm text-[var(--text-secondary)] mt-1">
            <input
              type="checkbox"
              onChange={() => onCompleteTask(openTask)}
              className="w-4 h-4 accent-[var(--accent)]"
            />
            <span className="text-xs lg:text-sm">Mark as done</span>
          </label>
        </article>
      )}

      {upcoming && (
        <article className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 lg:p-5 flex flex-col gap-2 hover:border-[rgba(139,92,246,0.35)] transition-colors">
          <header className="flex items-center gap-2 text-[11px] lg:text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            <Calendar size={16} /> <span>Coming up</span>
          </header>
          <h3 className="text-[15px] lg:text-[17px] font-semibold text-[var(--text-primary)] leading-tight m-0 truncate">{upcoming.title}</h3>
          <p className="text-xs lg:text-sm text-[var(--text-secondary)] m-0 line-clamp-2">{upcoming.when}</p>
          <button
            onClick={() => navigate(upcoming.href)}
            className="inline-flex items-center gap-1.5 self-start mt-1 px-3 py-1.5 lg:px-3.5 lg:py-2 rounded-lg bg-[rgba(139,92,246,0.12)] text-[var(--accent)] text-xs lg:text-sm font-medium hover:bg-[rgba(139,92,246,0.20)] transition-colors"
          >
            Open <ArrowRight size={14} />
          </button>
        </article>
      )}

      {challenge && (
        <article className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 lg:p-5 flex flex-col gap-2 hover:border-[rgba(139,92,246,0.35)] transition-colors">
          <header className="flex items-center gap-2 text-[11px] lg:text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            <Rocket size={16} /> <span>Suggested for you</span>
          </header>
          <h3 className="text-[15px] lg:text-[17px] font-semibold text-[var(--text-primary)] leading-tight m-0 line-clamp-2">
            {challenge.title || 'Practical challenge'}
          </h3>
          <p className="text-xs lg:text-sm text-[var(--text-secondary)] m-0 line-clamp-2">
            {challenge.reason || challenge.text || 'Practise a real problem in Orbit.'}
          </p>
          <button
            onClick={() => navigate('/orbit')}
            className="inline-flex items-center gap-1.5 self-start mt-1 px-3 py-1.5 lg:px-3.5 lg:py-2 rounded-lg bg-[rgba(139,92,246,0.12)] text-[var(--accent)] text-xs lg:text-sm font-medium hover:bg-[rgba(139,92,246,0.20)] transition-colors"
          >
            Open Orbit <ArrowRight size={14} />
          </button>
        </article>
      )}

      {next && (
        <article className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 lg:p-5 flex flex-col gap-2 hover:border-[rgba(139,92,246,0.35)] transition-colors">
          <header className="flex items-center gap-2 text-[11px] lg:text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            <Target size={16} /> <span>Next useful action</span>
          </header>
          <h3 className="text-[15px] lg:text-[17px] font-semibold text-[var(--text-primary)] leading-tight m-0 truncate">{next.title}</h3>
          <p className="text-xs lg:text-sm text-[var(--text-secondary)] m-0 line-clamp-2">{next.reason}</p>
          <button
            onClick={() => navigate(next.href)}
            className="inline-flex items-center gap-1.5 self-start mt-1 px-3 py-1.5 lg:px-3.5 lg:py-2 rounded-lg bg-[rgba(139,92,246,0.12)] text-[var(--accent)] text-xs lg:text-sm font-medium hover:bg-[rgba(139,92,246,0.20)] transition-colors"
          >
            {next.cta} <ArrowRight size={14} />
          </button>
        </article>
      )}
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
// Helpers
// ─────────────────────────────────────────────────────────────

function pickUnfinishedLesson(lp) {
  if (!lp) return null;
  const raw = lp.current ?? lp.unfinished ?? lp.in_progress;
  if (!raw) return null;
  const progress = Number(raw.progress_percent ?? raw.progress ?? 0);
  if (progress <= 0 || progress >= 100) return null;
  return {
    title: raw.lesson_title || raw.title || 'Unfinished lesson',
    subject: raw.subject || raw.course || 'Academic',
    progress: Math.round(progress),
    href: raw.href || `/studysphere?lesson=${raw.id ?? ''}`,
  };
}

function pickUpcoming(timetable, assignments) {
  const now = Date.now();
  const cands = [];
  (Array.isArray(assignments) ? assignments : []).forEach(a => {
    const when = a.due_date || a.due_at || a.deadline;
    if (!when) return;
    const t = new Date(when).getTime();
    if (Number.isNaN(t) || t < now) return;
    cands.push({
      title: a.title || a.name || 'Assignment',
      when: `Due ${new Date(when).toLocaleString()}`,
      time: t,
      href: `/studysphere?assignment=${a.id ?? ''}`,
    });
  });
  (Array.isArray(timetable) ? timetable : []).forEach(e => {
    const when = e.starts_at || e.start_time;
    if (!when) return;
    const t = new Date(when).getTime();
    if (Number.isNaN(t) || t < now) return;
    cands.push({
      title: e.subject_name || e.title || 'Class',
      when: `Starts ${new Date(when).toLocaleString()}`,
      time: t,
      href: `/studysphere?timetable=${e.id ?? ''}`,
    });
  });
  cands.sort((a, b) => a.time - b.time);
  return cands[0] ?? null;
}

function pickNextAction({ lesson, openTask, upcoming, orbits }) {
  if (lesson || openTask || upcoming) return null;
  if (orbits > 0) {
    return { title: 'Practise in Orbit', reason: 'Keep your learning active with a short session.', cta: 'Open Orbit', href: '/orbit' };
  }
  return { title: 'Start a lesson', reason: 'Pick a subject in the Academic Hub to begin.', cta: 'Open Academic Hub', href: '/studysphere' };
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
  const [focusDuration] = useState(25);

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

  const handleCompleteTask = async (task) => {
    try {
      await api.completeTask(task.id);
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_completed: true } : t));
      triggerMood?.('task-complete');
      showToast?.(`Task completed +${task.xp_reward || 30} XP`);
      await loadDashboard();
      await refreshUser?.();
    } catch (err) {
      showToast?.(err.message || 'Failed to complete task', 'error');
    }
  };

  const startFocusSession = () => {
    if (focusRemaining <= 0) {
      showToast?.('No focus sessions left today', 'error');
      return;
    }
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
        topic="Focus Session"
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
          onStartFocus={startFocusSession}
          focusRemaining={focusRemaining}
        />
      </ErrorBoundary>

      {returning ? (
        <ErrorBoundary title="Some dashboard sections failed to load">
          <ReturningDashboard
            tasks={tasks}
            timetable={timetable}
            assignments={assignments}
            orbitCount={orbitCount}
            stackedSuggestions={stackedSuggestions}
            lessonProgress={lessonProgress}
            onCompleteTask={handleCompleteTask}
          />
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