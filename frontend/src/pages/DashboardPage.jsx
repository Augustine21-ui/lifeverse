// frontend/src/pages/DashboardPage.jsx
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import {
  Flame, Calendar, CheckCircle, Clock, Zap, Plus, Trash2, Users, Play,
  Home, User, Rocket, Sparkles, Star, BookOpen, PenTool, Bell, Lightbulb,
  X, Edit2, Calendar as CalendarIcon, Clock as ClockIcon, Bell as BellIcon,
  Crown, Gift, MessageSquare, Heart, Award, Coffee, Brain, Smile,
  TrendingUp, Repeat, Target, BarChart2, Menu, Sun, Moon,
  ArrowRight
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import QuizModal from '../components/QuizModal';
import GlanceTicker from '../components/GlanceTicker';
import FocusSession from '../components/FocusSession';
import ActiveStudyGroups from '../components/groups/ActiveStudyGroups';
import HolographicAvatar from '../components/HolographicAvatar';
import { useTheme } from '../context/ThemeContext';
import { useMood } from '../context/MoodContext';
import OrbitStackedCard from '../components/orbit/OrbitStackedCard';
import ErrorBoundary from '../components/ErrorBoundary';
import { SkeletonDashboard } from '../components/Skeleton';

import './DashboardPage.css';

// ---- Confetti (unchanged) ----
function Confetti({ active, onComplete }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#3f51b5', '#2196f3', '#4caf50', '#ffeb3b', '#ff9800'];
    const particles = [];
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: Math.random() * 6 + 2,
        speedY: Math.random() * 4 + 2,
        speedX: (Math.random() - 0.5) * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
      });
    }
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let allFinished = true;
      particles.forEach(p => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size/2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        if (p.y < canvas.height + 50) allFinished = false;
      });
      if (!allFinished) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        onComplete && onComplete();
      }
    };
    animate();
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [active]);
  if (!active) return null;
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />;
}

// ---- Daily quotes (unchanged) ----
const QUOTES = [
  "Small progress every day leads to big success.",
  "Success is the sum of small efforts repeated every day.",
  "Believe you can and you're halfway there.",
  "The only way to do great work is to love what you do.",
  "Don't watch the clock; do what it does. Keep going.",
  "The secret of getting ahead is getting started.",
  "Strive for progress, not perfection.",
];
const getDailyQuote = () => QUOTES[new Date().getDate() % QUOTES.length];

// ---- Mobile Navigation (unchanged) ----
const MobileNav = ({ active, navigate }) => {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home', path: '/dashboard' },
    { id: 'orbit', icon: Rocket, label: 'Orbit', path: '/orbit' },
    { id: 'momentum', icon: Users, label: 'Momentum', path: '/momentum' },
    { id: 'studysphere', icon: BookOpen, label: 'Study', path: '/studysphere' },
    { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
  ];
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-xl border-t border-white/10 safe-bottom">
      <div className="flex justify-around items-center max-w-md mx-auto px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all duration-200 ${
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
};

// ─────────────────────────────────────────────────────────────
// DAY 2 — Dynamic Smart Suggestions (no hardcoded copy)
// Priority: streak → focus → tasks → weak skill → goal → orbit
// ─────────────────────────────────────────────────────────────
const ORBIT_TARGET = 10; // matches composite progress weight

function buildSuggestions({ stats, tasks, goals, focusRemaining, progressBreakdown, orbitSessionCount }) {
  const out = [];

  // 1. Streak nudge
  if ((stats?.streakDays ?? 0) === 0) {
    out.push({
      id: 'streak',
      icon: '🔥',
      text: 'Start a streak today — finish one task or orbit session.',
      to: '/orbit',
    });
  }

  // 2. Focus reminder
  if (typeof focusRemaining === 'number' && focusRemaining <= 0) {
    out.push({
      id: 'focus',
      icon: '⏱️',
      text: 'No focus sessions left today. Plan one for tomorrow.',
      to: '/dashboard',
    });
  }

  // 3. Pending tasks
  const pending = (tasks || []).filter(t => !t.is_completed);
  if (pending.length > 0) {
    out.push({
      id: 'tasks',
      icon: '✅',
      text: `You have ${pending.length} task${pending.length > 1 ? 's' : ''} left today.`,
      to: '/dashboard',
    });
  }

  // 4. Weak skill (from progress breakdown)
  const skillsPct = progressBreakdown?.skills ?? null;
  if (skillsPct !== null && skillsPct < 50) {
    out.push({
      id: 'skill',
      icon: '📈',
      text: `Skills at ${skillsPct}% — boost with an Orbit practice session.`,
      to: '/orbit',
    });
  }

  // 5. Active goal (only if goals data is available)
  const activeGoal = (goals || []).find(g => !g.completed);
  if (activeGoal) {
    const pct = Math.round(activeGoal.progress ?? 0);
    out.push({
      id: 'goal',
      icon: '🎯',
      text: `Goal "${activeGoal.title}" is ${pct}% complete — keep going.`,
      to: '/skills',
    });
  }

  // 6. Orbit volume nudge (only if orbit is the bottleneck)
  if ((orbitSessionCount ?? 0) < ORBIT_TARGET) {
    const remaining = ORBIT_TARGET - (orbitSessionCount ?? 0);
    out.push({
      id: 'orbit',
      icon: '🪐',
      text: `${remaining} more orbit session${remaining > 1 ? 's' : ''} to max out orbit progress.`,
      to: '/orbit',
    });
  }

  return out.slice(0, 5);
}

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { mood: autoMood, triggerMood } = useMood();

  // ---- State ----
  const [stats, setStats] = useState({ totalXP: 0, todayXP: 0, streakDays: 0, rank: '#?', completed: 0 });
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [currentQuizId, setCurrentQuizId] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  const [progressPercent, setProgressPercent] = useState(0);
  const [progressBreakdown, setProgressBreakdown] = useState(null);
  const [moodPercent, setMoodPercent] = useState(0);

  // ✅ DAY 2 — goals state (required by Smart Suggestion #5)
  const [goals, setGoals] = useState([]);

  const [focusRemaining, setFocusRemaining] = useState(4);
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [focusTopic, setFocusTopic] = useState('');
  const [focusMode, setFocusMode] = useState(false);
  const [focusCompleted, setFocusCompleted] = useState(false);

  const [stackedSuggestions, setStackedSuggestions] = useState([]);
  const [stackedLoading, setStackedLoading] = useState(true);

  const [feedPosts, setFeedPosts] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskXp, setNewTaskXp] = useState(30);

  const [editingTask, setEditingTask] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editXp, setEditXp] = useState(30);
  const [editDueDate, setEditDueDate] = useState('');
  const [editReminder, setEditReminder] = useState('');
  const [editPriority, setEditPriority] = useState(false);

  const [showConfetti, setShowConfetti] = useState(false);

  const [academicTimetable, setAcademicTimetable] = useState([]);
  const [academicAssignments, setAcademicAssignments] = useState([]);

  const [studyTime, setStudyTime] = useState(0);
  const [studyTimeBreakdown, setStudyTimeBreakdown] = useState(null);
  const [brainDump, setBrainDump] = useState(() => localStorage.getItem('brainDump') || '');
  const [showBrainDump, setShowBrainDump] = useState(false);
  const [quickAddType, setQuickAddType] = useState('task');
  const [quickAddText, setQuickAddText] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);

  const [currentTime, setCurrentTime] = useState(new Date());
  const dailyQuote = getDailyQuote();

  const [orbitSessionCount, setOrbitSessionCount] = useState(0);

  const prevProgressRef = useRef(null);

  // ---- Image map for avatar ----
  const avatarImageMap = {
    happy: '/happy.jpg',
    excited: '/excited.jpg',
    thinking: '/thinking.jpg',
    neutral: '/neutral.jpg',
    suprised: '/suprised.jpg',
    celebrating: '/celebrating.jpg',
    focused: '/focused.jpg',
    calm: '/calm.jpg',
  };

  // ---- Effects ----
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const hour = currentTime.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // ✅ FIX: Feed polling every 90s + pause when tab hidden
  useEffect(() => {
    let interval = null;

    const startPolling = () => {
      if (interval) return;
      interval = setInterval(() => loadFeed(true), 90000);
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        loadFeed(true);
        startPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const storedFocus = localStorage.getItem('focusMode');
    if (storedFocus === 'true') {
      const topic = localStorage.getItem('focusTopic') || 'Focus';
      setFocusMode(true);
      setFocusTopic(topic);
    }
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsData, tasksData, timetableData, assignmentsData, subscriptionData, goalsData] = await Promise.all([
        api.getDashboardStats(),
        api.getTodayTasks(),
        api.getTimetable().catch(() => []),
        api.getAssignments().catch(() => []),
        api.getSubscriptionStatus().catch(() => null),
        // ✅ DAY 2 — guarded goals fetch: if getGoals doesn't exist yet, resolves to []
        api.getGoals ? api.getGoals().catch(() => []) : Promise.resolve([]),
      ]);

      const userData = statsData.user || {};
      const xp = userData.xp ?? statsData.totalXP ?? user?.xp ?? 0;
      const level = userData.level ?? statsData.level ?? user?.level ?? 1;
      const streakDays = userData.streakDays ?? statsData.streakDays ?? user?.streakDays ?? 0;
      const rank = userData.rank ?? statsData.rank ?? '#?';
      const todayXP = userData.todayXP ?? statsData.todayXP ?? 0;
      const completed = userData.completed ?? statsData.completed ?? 0;

      setStats({
        totalXP: xp,
        todayXP: todayXP,
        streakDays: streakDays,
        rank: rank,
        completed: completed,
      });

      setTasks(tasksData || []);
      setStudyTime(statsData.studyTimeMinutes ?? 0);
      setStudyTimeBreakdown(statsData.studyTimeBreakdown ?? null);

      // ✅ DAY 2 — normalize goals array
      setGoals(goalsData?.goals || goalsData?.data || goalsData || []);

      // ─── PROGRESS + CALM MOOD DETECTION ────────────────────
      const newProgress = Math.round(statsData.progressPercent ?? 0);
      setProgressPercent(newProgress);
      setProgressBreakdown(statsData.progressBreakdown ?? null);

      if (prevProgressRef.current === null) {
        const stored = localStorage.getItem('lastProgressPercent');
        if (stored !== null) {
          prevProgressRef.current = parseInt(stored, 10);
        } else {
          prevProgressRef.current = newProgress;
        }
      }

      const lastSeen = prevProgressRef.current;
      if (lastSeen !== null && newProgress > lastSeen) {
        console.log(`📈 Progress increased: ${lastSeen}% → ${newProgress}% → calm mood`);
        triggerMood('progress-visited', {
          meta: {
            previous: lastSeen,
            current: newProgress,
            delta: newProgress - lastSeen,
            breakdown: statsData.progressBreakdown,
          },
        });
      }

      prevProgressRef.current = newProgress;
      localStorage.setItem('lastProgressPercent', String(newProgress));

      setMoodPercent(userData.moodPercent ?? 0);
      setAcademicTimetable(timetableData || []);
      setAcademicAssignments(assignmentsData || []);
      if (subscriptionData) {
        setSubscriptionStatus(subscriptionData);
        setHasPremiumAccess(subscriptionData.isActive || subscriptionData.isInstitutional);
      }

      try {
        let orbitData = null;
        if (api.getOrbitSessionCount) {
          orbitData = await api.getOrbitSessionCount();
        }
        const count = orbitData?.count || 0;
        setOrbitSessionCount(count);
        if (count >= 4) {
          triggerMood('progress-up');
        }
      } catch (e) {
        console.warn('Could not fetch orbit session count:', e.message);
        setOrbitSessionCount(0);
      }

      try {
        setStackedLoading(true);
        const stackedData = await api.getStackedSuggestions();
        setStackedSuggestions(stackedData?.suggestions || []);
      } catch (e) {
        console.warn('Could not fetch stacked suggestions:', e.message);
        setStackedSuggestions([]);
      } finally {
        setStackedLoading(false);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadFeed = async (silent = false) => {
    if (!silent) setFeedLoading(true);
    try {
      const data = await api.getFeedPosts(20, 0);
      const uniquePosts = data.posts || data || [];
      const uniqueMap = new Map();
      uniquePosts.forEach(post => {
        if (!uniqueMap.has(post.id)) {
          uniqueMap.set(post.id, post);
        }
      });
      setFeedPosts(Array.from(uniqueMap.values()));
    } catch (err) {
      console.error(err);
      if (!silent) showToast('Failed to load feed', 'error');
    } finally {
      if (!silent) setFeedLoading(false);
    }
  };

  const loadFocusRemaining = async () => {
    try {
      const data = await api.getFocusRemaining();
      setFocusRemaining(data.remaining);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDashboard();
    loadFeed();
    loadFocusRemaining();
  }, []);

  // ---- Focus Session ----
  const startFocusSession = () => {
    if (!focusTopic.trim() || focusRemaining <= 0) return;
    setFocusMode(true);
    setFocusCompleted(false);
    localStorage.setItem('focusMode', 'true');
    localStorage.setItem('focusTopic', focusTopic);
  };

  const cancelFocus = () => {
    setFocusMode(false);
    setFocusCompleted(false);
    localStorage.removeItem('focusMode');
    localStorage.removeItem('focusTopic');
  };

  const handleFocusEnd = async () => {
    setFocusCompleted(true);
    try {
      const res = await api.completeFocusSession(selectedDuration);
      showToast(`+${res.xpAwarded} XP for focus session! ${res.remaining} left today`);
      setFocusRemaining(res.remaining);
      setStudyTime(prev => prev + selectedDuration);
      await loadDashboard();
      await refreshUser();
      triggerMood('focus-complete');
    } catch (err) {
      showToast(err.message, 'error');
    }
    setFocusMode(false);
    localStorage.removeItem('focusMode');
  };

  const selectDuration = (mins) => setSelectedDuration(mins);

  // ---- Task functions ----
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setActionLoading(true);
    try {
      const newTask = await api.createTask({ title: newTaskTitle, xp_reward: newTaskXp });
      setTasks(prev => [...prev, { ...newTask, is_completed: false }]);
      setNewTaskTitle('');
      setNewTaskXp(30);
      showToast('Task added!');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      showToast('Task deleted');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleTaskComplete = async (task) => {
    setShowConfetti(true);
    try {
      await api.completeTask(task.id);
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_completed: true } : t));
      showToast(`✅ Task completed! +${task.xp_reward || 30} XP`);
      await loadDashboard();
      await refreshUser();
      triggerMood('task-complete');
    } catch (err) {
      showToast(err.message, 'error');
    }
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditXp(task.xp_reward || 30);
    setEditDueDate(task.due_date || '');
    setEditReminder(task.reminder || '');
    setEditPriority(task.priority || '');
}