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
  TrendingUp, Repeat, Target, BarChart2, Menu, Sun, Moon
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import QuizModal from '../components/QuizModal';
import GlanceTicker from '../components/GlanceTicker';
import FocusSession from '../components/FocusSession';
import ActiveStudyGroups from '../components/groups/ActiveStudyGroups';
import HolographicAvatar from '../components/HolographicAvatar';
import { useTheme } from '../context/ThemeContext';

// ---- Confetti ----
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

// ---- Daily quotes ----
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

// ---- Mobile Navigation ----
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

// ---- Reusable Card ----
const Card = ({ children, className = '', gradient = false }) => (
  <div className={`bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 transition-all hover:border-white/20 ${
    gradient ? 'bg-gradient-to-br from-purple-900/30 to-blue-900/30' : ''
  } ${className}`}>
    {children}
  </div>
);

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // ---- State ----
  const [stats, setStats] = useState({ totalXP: 0, todayXP: 0, streakDays: 0, rank: '#?', completed: 0 });
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Quiz states
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [currentQuizId, setCurrentQuizId] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  // ─── New states for real data ──────────────────────────────
  const [progressPercent, setProgressPercent] = useState(0);
  const [autoMood, setAutoMood] = useState('neutral');

  // Focus timer
  const [focusRemaining, setFocusRemaining] = useState(4);
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [focusTopic, setFocusTopic] = useState('');
  const [focusMode, setFocusMode] = useState(false);
  const [focusCompleted, setFocusCompleted] = useState(false);

  // Feed
  const [feedPosts, setFeedPosts] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);

  // Task creation
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskXp, setNewTaskXp] = useState(30);

  // Task edit
  const [editingTask, setEditingTask] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editXp, setEditXp] = useState(30);
  const [editDueDate, setEditDueDate] = useState('');
  const [editReminder, setEditReminder] = useState('');
  const [editPriority, setEditPriority] = useState(false);

  const [showConfetti, setShowConfetti] = useState(false);

  // Academic
  const [academicTimetable, setAcademicTimetable] = useState([]);
  const [academicAssignments, setAcademicAssignments] = useState([]);

  // Other
  const [studyTime, setStudyTime] = useState(0);
  const [brainDump, setBrainDump] = useState(() => localStorage.getItem('brainDump') || '');
  const [showBrainDump, setShowBrainDump] = useState(false);
  const [quickAddType, setQuickAddType] = useState('task');
  const [quickAddText, setQuickAddText] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);

  // Date & time
  const [currentTime, setCurrentTime] = useState(new Date());
  const dailyQuote = getDailyQuote();

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

  // ---- Data loading ----
  useEffect(() => {
    const interval = setInterval(() => loadFeed(true), 5000);
    return () => clearInterval(interval);
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
      const [statsData, tasksData, timetableData, assignmentsData, subscriptionData] = await Promise.all([
        api.getDashboardStats(),
        api.getTodayTasks(),
        api.getTimetable().catch(() => []),
        api.getAssignments().catch(() => []),
        api.getSubscriptionStatus().catch(() => null),
      ]);

      // ─── FALLBACK: use auth user data if statsData.user is missing ──
      const userData = statsData.user || { 
        xp: user?.xp || 0, 
        streakDays: user?.streakDays || 0,
        rank: user?.rank || '#?',
        todayXP: 0,
        completed: 0,
      };

     setStats({
        totalXP: statsData.xp || 0,
        todayXP: statsData.todayXP || 0,
        streakDays: statsData.streakDays || 0,   // <- top-level
        rank: statsData.rank || '#?',
        completed: statsData.completed || 0,
      });
      setTasks(tasksData);
      setStudyTime(statsData.studyTimeMinutes || 0);
      setProgressPercent(statsData.progressPercent || 0);
      setAutoMood(statsData.user?.mood || 'neutral');
      setAcademicTimetable(timetableData || []);
      setAcademicAssignments(assignmentsData || []);
      if (subscriptionData) {
        setSubscriptionStatus(subscriptionData);
        setHasPremiumAccess(subscriptionData.isActive || subscriptionData.isInstitutional);
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
      setTimeout(() => setShowConfetti(false), 3000);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditXp(task.xp_reward || 30);
    setEditDueDate(task.due_date || '');
    setEditReminder(task.reminder || '');
    setEditPriority(task.priority || false);
    setShowEditModal(true);
  };

  const saveEditTask = async () => {
    if (!editTitle.trim()) return;
    try {
      const updated = await api.updateTask(editingTask.id, {
        title: editTitle,
        xp_reward: editXp,
        due_date: editDueDate || null,
        reminder: editReminder || null,
        priority: editPriority,
      });
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...updated } : t));
      showToast('Task updated!');
      setShowEditModal(false);
      setEditingTask(null);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleQuickAdd = async () => {
    if (!quickAddText.trim()) return;
    if (quickAddType === 'task') {
      try {
        const newTask = await api.createTask({ title: quickAddText, xp_reward: 30 });
        setTasks(prev => [...prev, { ...newTask, is_completed: false }]);
        showToast('Task added!');
      } catch (err) {
        showToast(err.message, 'error');
      }
    } else if (quickAddType === 'note') {
      const current = localStorage.getItem('brainDump') || '';
      localStorage.setItem('brainDump', current + '\n' + quickAddText);
      setBrainDump(prev => prev + '\n' + quickAddText);
      showToast('Note saved!');
    } else if (quickAddType === 'reminder') {
      showToast(`Reminder set: ${quickAddText}`);
    }
    setQuickAddText('');
    setShowQuickAdd(false);
  };

  const saveBrainDump = () => {
    localStorage.setItem('brainDump', brainDump);
    showToast('Brain dump saved!');
    setShowBrainDump(false);
  };

  // ---- Computed ----
  const displayName = user?.full_name || user?.username || 'Learner';
  const tasksDoneToday = tasks.filter(t => t.is_completed).length;
  const totalTasks = tasks.length;
  const today = new Date().getDay();
  const todayEntries = academicTimetable.filter(entry => entry.day_of_week === today);
  // Consistent level calculation
  const currentLevel = Math.floor(stats.totalXP / 500) + 1;

  // Format study time
  const formatStudyTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // ---- Focus mode ----
  if (focusMode) {
    return (
      <FocusSession
        topic={focusTopic}
        duration={selectedDuration}
        onEnd={handleFocusEnd}
        onCancel={cancelFocus}
      />
    );
  }

  if (loading) {
    return <div className="p-6 text-white text-center">Loading dashboard...</div>;
  }

  // ---- Subscription Banner ----
  const renderSubscriptionBanner = () => {
    let status = subscriptionStatus;
    if (!status && user) {
      const isInst = user?.institution_subscription_valid || false;
      const isTrial = user?.subscription?.plan === 'trial' && user?.subscription?.daysRemaining > 0;
      const days = user?.subscription?.daysRemaining || 0;
      if (isInst) {
        status = { plan: 'institutional', isInstitutional: true, isActive: true };
      } else if (isTrial) {
        status = { plan: 'trial', isInstitutional: false, isActive: true, daysRemaining: days };
      } else {
        status = { plan: 'none', isInstitutional: false, isActive: false };
      }
    }
    if (!status) return null;

    const isTrial = status.plan === 'trial';
    const daysRemaining = status.daysRemaining || 0;
    const isInstitutional = status.isInstitutional || user?.institution_subscription_valid || false;

    if (isInstitutional) {
      return (
        <div className="mb-4 px-4 py-3 bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-500/30 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown size={18} className="text-green-400" />
            <span className="text-white text-sm font-medium">🏫 Institutional</span>
          </div>
          <span className="text-green-400 text-xs font-medium">Active</span>
        </div>
      );
    }

    if (isTrial && daysRemaining > 0 && daysRemaining <= 3) {
      return (
        <div className="mb-4 px-4 py-3 bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/30 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift size={18} className="text-purple-400" />
            <span className="text-white text-sm font-medium">
              Trial: {daysRemaining}d left
            </span>
          </div>
          <button
            onClick={() => navigate('/settings/subscription')}
            className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-medium rounded-lg hover:opacity-90 transition"
          >
            Upgrade
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-fixed pb-16 lg:pb-0"
      style={{ backgroundImage: "url('/dashboard-bg.jpg.jpg')" }}
    >
      <div className="absolute inset-0 bg-black/60 z-0"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-4 lg:px-6 lg:py-6">
        {showConfetti && <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />}

        {/* ===== HEADER – with theme toggle ===== */}
        <div className="flex flex-wrap items-start justify-between mb-6 gap-2 pr-2 sm:pr-4 lg:pr-0">
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-xl lg:text-3xl font-bold text-white break-normal">
              {greeting}, {displayName} 👋
            </h1>
            <p className="text-xs lg:text-sm text-white/50 mt-0.5 flex items-center gap-2">
              <Calendar size={14} /> {formattedDate} · {formattedTime}
            </p>
            <p className="text-xs lg:text-sm text-white/40 italic mt-1">"{dailyQuote}"</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-1 sm:ml-2 z-20 relative">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/20 transition"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-slate-400" />}
            </button>

            {/* Mood badge - show autoMood */}
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-2.5 py-1 border border-white/10">
              <Smile size={14} className="text-yellow-400" />
              <span className="text-xs text-white/70 hidden xs:inline">
                {autoMood.charAt(0).toUpperCase() + autoMood.slice(1)}
              </span>
            </div>
            {/* Avatar – pass autoMood */}
            <div className="scale-90 sm:scale-100 transition-transform z-50 relative">
              <HolographicAvatar mood={autoMood} />
            </div>
          </div>
        </div>

        {/* ===== SUBSCRIPTION BANNER ===== */}
        {renderSubscriptionBanner()}

        {/* ============================================================= */}
        {/* MOBILE LAYOUT */}
        {/* ============================================================= */}
        <div className="lg:hidden">
          {/* Progress Card */}
          <Card className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-white">{currentLevel}</span>
                  <span className="text-sm text-white/40">Level</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-white/60">{stats.totalXP} XP</span>
                  <span className="text-sm text-white/30">•</span>
                  <span className="text-sm text-orange-400 flex items-center gap-1">
                    <Flame size={14} /> {stats.streakDays}d
                  </span>
                </div>
                <div className="w-48 h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-violet-500 rounded-full transition-all"
                    style={{ width: `${Math.min((stats.totalXP % 500) / 5, 100)}%` }}
                  />
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-white/40">Today's progress</div>
                <div className="text-2xl font-semibold text-white">{tasksDoneToday}/{totalTasks}</div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-cyan-400" />
                <span className="text-sm text-white/60">{formatStudyTime(studyTime)}</span>
                <span className="text-xs text-white/30">today</span>
              </div>
              <div className="flex items-center gap-2">
                <Award size={16} className="text-yellow-400" />
                <span className="text-sm text-white/60">#{stats.rank || 'N/A'}</span>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            <button onClick={() => navigate('/orbit')} className="bg-purple-500/20 backdrop-blur-sm border border-purple-500/20 rounded-xl py-3 flex flex-col items-center gap-0.5 hover:bg-purple-500/30 transition active:scale-95">
              <Rocket size={20} className="text-purple-400" />
              <span className="text-[10px] text-white/70">Orbit</span>
            </button>
            <button onClick={() => navigate('/momentum')} className="bg-pink-500/20 backdrop-blur-sm border border-pink-500/20 rounded-xl py-3 flex flex-col items-center gap-0.5 hover:bg-pink-500/30 transition active:scale-95">
              <Users size={20} className="text-pink-400" />
              <span className="text-[10px] text-white/70">Social</span>
            </button>
            <button onClick={() => document.getElementById('task-input')?.focus()} className="bg-green-500/20 backdrop-blur-sm border border-green-500/20 rounded-xl py-3 flex flex-col items-center gap-0.5 hover:bg-green-500/30 transition active:scale-95">
              <Plus size={20} className="text-green-400" />
              <span className="text-[10px] text-white/70">Task</span>
            </button>
            <button onClick={() => navigate('/studysphere')} className="bg-blue-500/20 backdrop-blur-sm border border-blue-500/20 rounded-xl py-3 flex flex-col items-center gap-0.5 hover:bg-blue-500/30 transition active:scale-95">
              <BookOpen size={20} className="text-blue-400" />
              <span className="text-[10px] text-white/70">Study</span>
            </button>
            <button onClick={() => navigate('/bridge')} className="bg-amber-500/20 backdrop-blur-sm border border-amber-500/20 rounded-xl py-3 flex flex-col items-center gap-0.5 hover:bg-amber-500/30 transition active:scale-95">
              <Users size={20} className="text-amber-400" />
              <span className="text-[10px] text-white/70">Bridge</span>
            </button>
          </div>

          {/* Focus Session */}
          <Card className="mb-4">
            <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2 mb-3">
              <Clock size={18} className="text-cyan-400" /> Focus Session
            </h3>
            <div className="flex gap-2 mb-3">
              {[10, 25, 45].map((mins) => (
                <button
                  key={mins}
                  onClick={() => selectDuration(mins)}
                  className={`flex-1 py-2 text-sm rounded-xl transition ${
                    selectedDuration === mins
                      ? 'bg-brand-500 text-white'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
            <input
              id="focus-input"
              type="text"
              className="w-full bg-white/10 text-white text-sm rounded-xl px-4 py-2.5 placeholder-white/30 outline-none border border-white/10 focus:border-brand-500/50 transition"
              placeholder="What do you want to focus on?"
              value={focusTopic}
              onChange={(e) => setFocusTopic(e.target.value)}
            />
            <button
              onClick={startFocusSession}
              disabled={!focusTopic.trim() || focusRemaining <= 0}
              className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-violet-600 text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              <Play size={16} className="inline mr-2" /> Start Focus Session
            </button>
            <p className="text-xs text-white/30 text-center mt-2">
              {focusRemaining > 0 ? `${focusRemaining} sessions left today` : 'Daily limit reached'}
            </p>
          </Card>

          {/* Today's Tasks */}
          <Card className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                <CheckCircle size={18} className="text-green-400" /> Today's Tasks
              </h3>
              <span className="text-sm text-white/30">{tasksDoneToday}/{totalTasks} done</span>
            </div>
            <form onSubmit={handleAddTask} className="flex gap-2 mb-3">
              <input
                id="task-input"
                type="text"
                className="flex-1 bg-white/10 text-white text-sm rounded-xl px-4 py-2.5 placeholder-white/30 outline-none border border-white/10 focus:border-brand-500/50 transition"
                placeholder="Add a task..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
              />
              <button type="submit" disabled={actionLoading} className="px-4 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition active:scale-95">
                <Plus size={18} />
              </button>
            </form>
            {tasks.length === 0 ? (
              <p className="text-sm text-white/40 text-center py-3">✨ No tasks for today</p>
            ) : (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {tasks.slice(0, 4).map((task) => (
                  <div key={task.id} className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
                    <button
                      onClick={() => !task.is_completed && handleTaskComplete(task)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        task.is_completed ? 'bg-green-500 border-green-500' : 'border-white/30'
                      }`}
                    >
                      {task.is_completed && <CheckCircle size={12} className="text-white" />}
                    </button>
                    <span className={`text-sm flex-1 truncate ${task.is_completed ? 'line-through text-white/30' : 'text-white/80'}`}>
                      {task.title}
                    </span>
                    <span className="text-xs text-white/30">{task.xp_reward}XP</span>
                  </div>
                ))}
                {tasks.length > 4 && (
                  <p className="text-xs text-white/30 text-center">+{tasks.length - 4} more</p>
                )}
              </div>
            )}
          </Card>

          {/* Social Buzz */}
          <Card className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                <Users size={18} className="text-brand-400" /> Social Buzz
              </h3>
              <Link to="/momentum" className="text-sm text-brand-400 hover:underline">View all →</Link>
            </div>
            <GlanceTicker posts={feedPosts} loading={feedLoading} />
          </Card>

          {/* Orbit */}
          <Card gradient className="mb-4 border-purple-500/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Rocket size={18} className="text-purple-400" /> Orbit
                </h3>
                <p className="text-xs text-white/50 mt-1">AI-powered interactive learning</p>
              </div>
              <Sparkles size={20} className="text-purple-400 animate-pulse" />
            </div>
            <Link
              to="/orbit"
              className="mt-3 inline-block w-full text-center py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium hover:opacity-90 transition active:scale-95"
            >
              Launch Orbit 🚀
            </Link>
          </Card>

          {/* Mood Card - use autoMood */}
          <Card className="mb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                <Smile size={18} className="text-yellow-400" /> Mood
              </h3>
              <span className="text-xs text-white/30">Today</span>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-4xl">
                {autoMood === 'happy' ? '😊' : 
                 autoMood === 'calm' ? '😌' : 
                 autoMood === 'tired' ? '😴' : 
                 autoMood === 'stressed' ? '😤' : '😐'}
              </span>
              <div className="flex-1">
                <p className="text-sm text-white font-medium">
                  {autoMood.charAt(0).toUpperCase() + autoMood.slice(1)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-white/40">Energy</span>
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full">
                    <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full" style={{ width: '65%' }} />
                  </div>
                </div>
              </div>
            </div>
            <button onClick={() => document.querySelector('.holographic-avatar')?.click()} className="mt-3 text-sm text-brand-400 hover:underline">
              Change Mood
            </button>
          </Card>

          {/* AI Suggestions Card */}
          <Card className="mb-4">
            <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2 mb-3">
              <Brain size={18} className="text-amber-400" /> AI Suggestions
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-white/70 flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                You haven't studied today. Start a focus session.
              </p>
              <p className="text-sm text-white/70 flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                Algebra seems weak – try Orbit Cortex mode.
              </p>
              <p className="text-sm text-white/70 flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                2 tasks are overdue. Complete them now.
              </p>
            </div>
            <button className="mt-2 text-sm text-brand-400 hover:underline">Refresh suggestions</button>
          </Card>

          {/* 🗑️ NOTIFICATIONS CARD REMOVED */}

          {/* Today's Schedule */}
          <Card className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                <Calendar size={18} className="text-violet-400" /> Today's Schedule
              </h3>
              <Link to="/studysphere" className="text-sm text-brand-400 hover:underline">View all →</Link>
            </div>
            {todayEntries.length === 0 ? (
              <p className="text-sm text-white/40 text-center py-3">No classes scheduled</p>
            ) : (
              <div className="space-y-2">
                {todayEntries.slice(0, 3).map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm bg-white/10 rounded-xl px-3 py-2">
                    <span className="text-white/40 w-16">{entry.start_time?.slice(0,5) || '—'}</span>
                    <span className="text-white/80">{entry.subject_name || entry.title || 'Class'}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* 🗑️ ORBIT PROGRESS CARD REMOVED */}

          {/* Brain Dump */}
          <Card className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                <PenTool size={18} className="text-green-400" /> Brain Dump
              </h3>
              <button onClick={() => setShowBrainDump(!showBrainDump)} className="text-white/40 hover:text-white transition">
                {showBrainDump ? <X size={16} /> : <Plus size={16} />}
              </button>
            </div>
            {showBrainDump ? (
              <div>
                <textarea
                  className="w-full bg-white/10 text-white text-sm rounded-xl px-4 py-3 h-28 placeholder-white/30 outline-none border border-white/10 focus:border-brand-500/50 transition"
                  placeholder="Write your thoughts..."
                  value={brainDump}
                  onChange={(e) => setBrainDump(e.target.value)}
                />
                <div className="flex gap-2 mt-3">
                  <button onClick={saveBrainDump} className="flex-1 py-2 bg-brand-500 text-white text-sm font-medium rounded-xl hover:opacity-90 transition active:scale-95">
                    Save
                  </button>
                  <button onClick={() => setShowBrainDump(false)} className="flex-1 py-2 bg-white/10 text-white text-sm font-medium rounded-xl hover:bg-white/20 transition active:scale-95">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-white/40">{brainDump ? brainDump.split('\n').slice(-1)[0] : 'No notes yet.'}</p>
            )}
          </Card>

          {/* Quick Add */}
          <Card className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                <Plus size={18} className="text-cyan-400" /> Quick Add
              </h3>
              <button onClick={() => setShowQuickAdd(!showQuickAdd)} className="text-white/40 hover:text-white transition">
                {showQuickAdd ? <X size={16} /> : <Plus size={16} />}
              </button>
            </div>
            {showQuickAdd && (
              <div>
                <div className="flex gap-2 mb-3">
                  {['task', 'note', 'reminder'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setQuickAddType(type)}
                      className={`flex-1 py-2 text-sm rounded-xl transition ${
                        quickAddType === type
                          ? 'bg-brand-500 text-white'
                          : 'bg-white/10 text-white/60 hover:bg-white/20'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  className="w-full bg-white/10 text-white text-sm rounded-xl px-4 py-2.5 placeholder-white/30 outline-none border border-white/10 focus:border-brand-500/50 transition"
                  placeholder={`Add a ${quickAddType}...`}
                  value={quickAddText}
                  onChange={(e) => setQuickAddText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
                />
                <button onClick={handleQuickAdd} className="w-full mt-3 py-2.5 bg-brand-500 text-white text-sm font-medium rounded-xl hover:opacity-90 transition active:scale-95">
                  Add
                </button>
              </div>
            )}
          </Card>
        </div>

        {/* ============================================================= */}
        {/* DESKTOP LAYOUT */}
        {/* ============================================================= */}
        <div className="hidden lg:block">
          {/* Daily Progress Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="flex items-center justify-between">
                <p className="text-white/40 text-sm">Level</p>
                <Zap size={20} className="text-brand-400" />
              </div>
              <p className="text-2xl font-bold text-white">{currentLevel}</p>
              <p className="text-xs text-white/40">{stats.totalXP} XP</p>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <p className="text-white/40 text-sm">Study Time</p>
                <Clock size={20} className="text-cyan-400" />
              </div>
              <p className="text-2xl font-bold text-white">{formatStudyTime(studyTime)}</p>
              <p className="text-xs text-white/40">Today</p>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <p className="text-white/40 text-sm">Streak</p>
                <Flame size={20} className="text-orange-400" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.streakDays}</p>
              <p className="text-xs text-white/40">Keep going!</p>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <p className="text-white/40 text-sm">Today's Progress</p>
                <CheckCircle size={20} className="text-green-400" />
              </div>
              <p className="text-2xl font-bold text-white">{Math.round(progressPercent)}%</p>
              <div className="w-full h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-brand-500 to-violet-500 rounded-full" style={{ width: `${progressPercent}%` }} />
              </div>
            </Card>
          </div>

          {/* Desktop Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Focus + Tasks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                    <Clock size={20} className="text-cyan-400" /> Focus Session
                  </h2>
                  <div className="flex gap-2 mb-4">
                    {[10, 25, 45].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => selectDuration(mins)}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
                          selectedDuration === mins
                            ? 'bg-brand-500 text-white'
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    className="w-full bg-white/10 text-white text-sm rounded-xl px-4 py-2.5 placeholder-white/30 outline-none border border-white/10 focus:border-brand-500/50 transition"
                    placeholder="What do you want to focus on?"
                    value={focusTopic}
                    onChange={(e) => setFocusTopic(e.target.value)}
                  />
                  <button
                    onClick={startFocusSession}
                    disabled={!focusTopic.trim() || focusRemaining <= 0}
                    className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-violet-600 text-white font-medium hover:opacity-90 transition disabled:opacity-50"
                  >
                    <Play size={16} className="inline mr-2" /> Start Focus Session
                  </button>
                  <p className="text-xs text-white/40 text-center mt-2">
                    {focusRemaining > 0 ? `${focusRemaining} sessions left today` : 'Daily limit reached'}
                  </p>
                </Card>

                <Card>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                    <CheckCircle size={20} className="text-green-400" /> Today's Tasks
                  </h2>
                  <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
                    <input
                      type="text"
                      className="flex-1 bg-white/10 text-white text-sm rounded-xl px-4 py-2.5 placeholder-white/30 outline-none border border-white/10 focus:border-brand-500/50 transition"
                      placeholder="Add a task..."
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                    />
                    <input
                      type="number"
                      className="w-20 bg-white/10 text-white text-sm rounded-xl px-3 py-2.5 placeholder-white/30 outline-none border border-white/10 focus:border-brand-500/50 transition"
                      placeholder="XP"
                      value={newTaskXp}
                      onChange={(e) => setNewTaskXp(parseInt(e.target.value) || 0)}
                    />
                    <button type="submit" disabled={actionLoading} className="px-4 py-2.5 bg-brand-500 text-white rounded-xl hover:opacity-90 transition active:scale-95">
                      <Plus size={18} />
                    </button>
                  </form>
                  {tasks.length === 0 ? (
                    <p className="text-white/40 text-sm">No tasks for today.</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className={`flex items-center gap-3 p-3 bg-white/10 rounded-xl border ${
                            task.is_completed ? 'border-green-500/30 opacity-60' : 'border-white/10'
                          }`}
                        >
                          <button
                            onClick={() => !task.is_completed && handleTaskComplete(task)}
                            disabled={task.is_completed}
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              task.is_completed ? 'bg-green-500 border-green-500' : 'border-white/30 hover:border-brand-400'
                            }`}
                          >
                            {task.is_completed && <CheckCircle size={12} className="text-white" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${task.is_completed ? 'line-through text-white/40' : 'text-white/90'}`}>
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-white/30 mt-0.5">
                              {task.xp_reward && <span>+{task.xp_reward} XP</span>}
                              {task.due_date && (
                                <span className="flex items-center gap-1">
                                  <CalendarIcon size={10} /> {new Date(task.due_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => openEditModal(task)} className="text-white/30 hover:text-blue-400 transition" title="Edit task">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDeleteTask(task.id)} className="text-white/30 hover:text-red-400 transition" title="Delete task">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* Social Buzz */}
              <Card>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                    <Users size={20} className="text-brand-400" /> Social Buzz
                  </h2>
                  <Link to="/momentum" className="text-sm text-brand-400 hover:underline">View all →</Link>
                </div>
                <GlanceTicker posts={feedPosts} loading={feedLoading} />
              </Card>

              {/* Orbit */}
              <Card gradient className="border-purple-500/30">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                      <Rocket size={20} className="text-purple-400" /> Orbit
                    </h2>
                    <p className="text-sm text-white/60 mt-1">AI-powered interactive learning space</p>
                    <p className="text-xs text-white/40 mt-1">
                      Explore topics through Cortex, CluePath, Pathfinder & Reflex.
                    </p>
                  </div>
                  <Sparkles size={24} className="text-purple-400 animate-pulse" />
                </div>
                <Link
                  to="/orbit"
                  className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 transition text-white font-medium"
                >
                  Launch Orbit <Rocket size={16} />
                </Link>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Mood */}
              <Card>
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold">Mood</h3>
                  <span className="text-sm text-white/40">Today</span>
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-4xl">
                    {autoMood === 'happy' ? '😊' : 
                     autoMood === 'calm' ? '😌' : 
                     autoMood === 'tired' ? '😴' : 
                     autoMood === 'stressed' ? '😤' : '😐'}
                  </span>
                  <div>
                    <p className="text-white font-medium">
                      {autoMood.charAt(0).toUpperCase() + autoMood.slice(1)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-white/40">Energy</span>
                      <div className="w-24 h-2 bg-white/10 rounded-full">
                        <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full" style={{ width: '65%' }} />
                      </div>
                    </div>
                  </div>
                </div>
                <button onClick={() => document.querySelector('.holographic-avatar')?.click()} className="mt-3 text-sm text-brand-400 hover:underline">
                  Change Mood
                </button>
              </Card>

              {/* AI Suggestions */}
              <Card>
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Brain size={18} className="text-amber-400" /> AI Suggestions
                </h3>
                <div className="mt-3 space-y-2">
                  <p className="text-sm text-white/80">• You haven't studied today. Start a focus session.</p>
                  <p className="text-sm text-white/80">• Algebra seems weak – try Orbit Cortex mode.</p>
                  <p className="text-sm text-white/80">• 2 tasks are overdue. Complete them now.</p>
                </div>
                <button className="mt-3 text-xs text-brand-400 hover:underline">Refresh</button>
              </Card>

              {/* 🗑️ NOTIFICATIONS CARD REMOVED */}

              {/* 🗑️ ORBIT PROGRESS CARD REMOVED */}

              {/* Today's Schedule */}
              <Card>
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Calendar size={18} className="text-violet-400" /> Today's Schedule
                </h3>
                {todayEntries.length === 0 ? (
                  <p className="text-sm text-white/40 mt-3">No classes scheduled for today</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {todayEntries.map((entry, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-sm p-2 bg-white/10 rounded-xl">
                        <span className="text-white/40 w-16">{entry.start_time?.slice(0,5) || '—'}</span>
                        <span className="text-white/90">{entry.subject_name || entry.title || 'Class'}</span>
                      </div>
                    ))}
                  </div>
                )}
                <Link to="/studysphere" className="text-xs text-brand-400 hover:underline mt-3 block">
                  View full timetable →
                </Link>
              </Card>

              {/* Brain Dump */}
              <Card>
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <PenTool size={18} className="text-green-400" /> Brain Dump
                  </h3>
                  <button onClick={() => setShowBrainDump(!showBrainDump)} className="text-white/40 hover:text-white transition">
                    {showBrainDump ? <X size={16} /> : <Plus size={16} />}
                  </button>
                </div>
                {showBrainDump ? (
                  <div className="mt-3">
                    <textarea
                      className="w-full bg-white/10 text-white text-sm rounded-xl px-4 py-3 h-24 placeholder-white/30 outline-none border border-white/10 focus:border-brand-500/50 transition"
                      placeholder="Write your thoughts..."
                      value={brainDump}
                      onChange={(e) => setBrainDump(e.target.value)}
                    />
                    <div className="flex gap-2 mt-3">
                      <button onClick={saveBrainDump} className="flex-1 py-2 bg-brand-500 text-white text-sm font-medium rounded-xl hover:opacity-90 transition">
                        Save
                      </button>
                      <button onClick={() => setShowBrainDump(false)} className="flex-1 py-2 bg-white/10 text-white text-sm font-medium rounded-xl hover:bg-white/20 transition">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-white/40 mt-3">{brainDump ? brainDump.split('\n').slice(-1)[0] : 'No notes yet.'}</p>
                )}
              </Card>

              {/* Quick Add */}
              <Card>
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Plus size={18} className="text-cyan-400" /> Quick Add
                  </h3>
                  <button onClick={() => setShowQuickAdd(!showQuickAdd)} className="text-white/40 hover:text-white transition">
                    {showQuickAdd ? <X size={16} /> : <Plus size={16} />}
                  </button>
                </div>
                {showQuickAdd && (
                  <div className="mt-3">
                    <div className="flex gap-2 mb-3">
                      {['task', 'note', 'reminder'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setQuickAddType(type)}
                          className={`flex-1 py-2 text-sm rounded-xl transition ${
                            quickAddType === type
                              ? 'bg-brand-500 text-white'
                              : 'bg-white/10 text-white/60 hover:bg-white/20'
                          }`}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      className="w-full bg-white/10 text-white text-sm rounded-xl px-4 py-2.5 placeholder-white/30 outline-none border border-white/10 focus:border-brand-500/50 transition"
                      placeholder={`Add a ${quickAddType}...`}
                      value={quickAddText}
                      onChange={(e) => setQuickAddText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
                    />
                    <button onClick={handleQuickAdd} className="w-full mt-3 py-2.5 bg-brand-500 text-white text-sm font-medium rounded-xl hover:opacity-90 transition">
                      Add
                    </button>
                  </div>
                )}
              </Card>
            </div>
          </div>

          {/* Study Groups */}
          <div className="mt-6 card p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                <Users size={20} className="text-brand-400" /> My Study Groups
              </h2>
              <Link to="/study-groups" className="text-sm text-brand-400 hover:underline">View all →</Link>
            </div>
            <ActiveStudyGroups />
          </div>
        </div>

        {/* ===== Mobile Bottom Navigation ===== */}
        <MobileNav active="home" navigate={navigate} />

        {/* ===== Modals ===== */}
        {showEditModal && editingTask && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-xl font-bold text-white mb-4">Edit Task</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  className="w-full bg-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none border border-white/10 focus:border-brand-500/50 transition"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Task title"
                />
                <input
                  type="number"
                  className="w-full bg-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none border border-white/10 focus:border-brand-500/50 transition"
                  value={editXp}
                  onChange={(e) => setEditXp(parseInt(e.target.value) || 0)}
                  placeholder="XP reward"
                />
                <input
                  type="datetime-local"
                  className="w-full bg-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none border border-white/10 focus:border-brand-500/50 transition"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editPriority}
                    onChange={(e) => setEditPriority(e.target.checked)}
                    className="w-4 h-4 accent-brand-500"
                  />
                  <label className="text-white/80 text-sm">Priority</label>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setShowEditModal(false)} className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition">
                  Cancel
                </button>
                <button onClick={saveEditTask} className="px-4 py-2 bg-brand-500 text-white rounded-xl hover:opacity-90 transition">
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {showQuizModal && (
          <QuizModal
            questions={quizQuestions}
            onSubmit={() => {}}
            onClose={() => {
              setShowQuizModal(false);
              setQuizQuestions([]);
              setQuizResult(null);
            }}
            loading={quizLoading}
            result={quizResult}
            onRetry={() => {}}
          />
        )}
      </div>
    </div>
  );
}