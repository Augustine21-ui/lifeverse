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

// ---- Reusable Compact Stat Card – now even smaller on mobile ----
const StatCard = ({ icon: Icon, label, value, subtext, color = 'text-brand-400' }) => (
  <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-1.5 sm:p-2.5 text-center hover:border-white/20 transition">
    <div className={`flex items-center justify-center gap-0.5 sm:gap-1 ${color}`}>
      <Icon size={12} className="sm:hidden" />
      <Icon size={14} className="hidden sm:block" />
      <span className="text-[8px] xs:text-[10px] sm:text-[10px] text-white/60 uppercase tracking-wide">{label}</span>
    </div>
    <div className="text-sm xs:text-base sm:text-lg font-bold text-white">{value}</div>
    {subtext && <div className="text-[8px] xs:text-[10px] text-white/30">{subtext}</div>}
  </div>
);

// ---- Reusable Card (for larger content) ----
const Card = ({ children, className = '', noPadding = false, gradient = false }) => (
  <div className={`bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:border-white/20 transition ${noPadding ? '' : 'p-3 sm:p-4'} ${gradient ? 'bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-500/30' : ''} ${className}`}>
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

  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [currentQuizId, setCurrentQuizId] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  const [progressPercent, setProgressPercent] = useState(0);
  const [autoMood, setAutoMood] = useState('neutral');

  const [focusRemaining, setFocusRemaining] = useState(4);
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [focusTopic, setFocusTopic] = useState('');
  const [focusMode, setFocusMode] = useState(false);
  const [focusCompleted, setFocusCompleted] = useState(false);

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
  const [brainDump, setBrainDump] = useState(() => localStorage.getItem('brainDump') || '');
  const [showBrainDump, setShowBrainDump] = useState(false);
  const [quickAddType, setQuickAddType] = useState('task');
  const [quickAddText, setQuickAddText] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);

  const [currentTime, setCurrentTime] = useState(new Date());
  const dailyQuote = getDailyQuote();

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
      setProgressPercent(statsData.progressPercent ?? 0);
      setAutoMood(userData.mood ?? 'neutral');
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
  const currentLevel = stats.totalXP > 0 ? Math.floor(stats.totalXP / 500) + 1 : (user?.level || 1);

  const formatStudyTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // ---- Render ----
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
        <div className="mb-3 px-4 py-1.5 bg-green-900/40 border border-green-500/30 rounded-xl flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Crown size={16} className="text-green-400" />
            <span className="text-white font-medium">🏫 Institutional</span>
          </div>
          <span className="text-green-400 text-xs">Active</span>
        </div>
      );
    }

    if (isTrial && daysRemaining > 0 && daysRemaining <= 3) {
      return (
        <div className="mb-3 px-4 py-1.5 bg-purple-900/40 border border-purple-500/30 rounded-xl flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Gift size={16} className="text-purple-400" />
            <span className="text-white font-medium">Trial: {daysRemaining}d left</span>
          </div>
          <button
            onClick={() => navigate('/settings/subscription')}
            className="px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs rounded-lg hover:opacity-90"
          >
            Upgrade
          </button>
        </div>
      );
    }
    return null;
  };

  // ---- Main render ----
  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-fixed pb-16 lg:pb-0"
      style={{ backgroundImage: "" }}
    >
      <div className="absolute inset-0 bg-black/60 z-0"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-4 lg:px-6 lg:py-6">
        {showConfetti && <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />}

        {/* ===== HEADER – condensed ===== */}
        <div className="flex flex-wrap items-start justify-between mb-2 gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-white break-normal">
              {greeting}, {displayName} 👋
            </h1>
            <p className="text-xs lg:text-sm text-white/50 mt-0.5 flex items-center gap-2">
              <Calendar size={14} /> {formattedDate} · {formattedTime}
            </p>
            <p className="text-xs lg:text-sm text-white/40 italic mt-0.5">"{dailyQuote}"</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-1 sm:ml-2 z-20 relative">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/20 transition"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-slate-400" />}
            </button>
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-2.5 py-1 border border-white/10">
              <Smile size={14} className="text-yellow-400" />
              <span className="text-xs text-white/70 hidden xs:inline">
                {autoMood.charAt(0).toUpperCase() + autoMood.slice(1)}
              </span>
            </div>
            <div className="scale-90 sm:scale-100 transition-transform z-50 relative">
              <HolographicAvatar mood={autoMood} />
            </div>
          </div>
        </div>

        {renderSubscriptionBanner()}

        {/* ===== STAT CARDS – Compact Grid ===== */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 sm:gap-2 mb-4">
          <StatCard
            icon={Zap}
            label="Level"
            value={currentLevel}
            subtext={`${stats.totalXP} XP`}
            color="text-brand-400"
          />
          <StatCard
            icon={Clock}
            label="Study"
            value={formatStudyTime(studyTime)}
            subtext="Today"
            color="text-cyan-400"
          />
          <StatCard
            icon={Flame}
            label="Streak"
            value={stats.streakDays}
            subtext={stats.streakDays > 0 ? 'Keep going!' : 'Start today'}
            color="text-orange-400"
          />
          <StatCard
            icon={Smile}
            label="Mood"
            value={autoMood.charAt(0).toUpperCase() + autoMood.slice(1)}
            subtext={autoMood === 'happy' ? '😊' : autoMood === 'calm' ? '😌' : autoMood === 'tired' ? '😴' : autoMood === 'stressed' ? '😤' : '😐'}
            color="text-yellow-400"
          />
          <StatCard
            icon={CheckCircle}
            label="Progress"
            value={`${Math.round(progressPercent)}%`}
            subtext="Today"
            color="text-green-400"
          />
        </div>

        {/* ===== MAIN 2-COLUMN LAYOUT ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ---- Left Column (2/3) – Engine ---- */}
          <div className="lg:col-span-2 space-y-5">
            {/* Focus Session Card */}
            <Card>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={18} className="text-cyan-400" />
                    <h3 className="text-sm font-semibold text-white/80">Focus Session</h3>
                  </div>
                  <div className="flex gap-2 mb-2">
                    {[10, 25, 45].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => selectDuration(mins)}
                        className={`flex-1 py-1.5 text-xs rounded-lg transition ${
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
                    className="w-full bg-white/10 text-white text-sm rounded-xl px-3 py-1.5 placeholder-white/30 outline-none border border-white/10 focus:border-brand-500/50 transition"
                    placeholder="What to focus on?"
                    value={focusTopic}
                    onChange={(e) => setFocusTopic(e.target.value)}
                  />
                  <div className="mt-1.5 text-xs text-white/30">
                    {focusRemaining > 0 ? `${focusRemaining} sessions left today` : 'Daily limit reached'}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <button
                    onClick={startFocusSession}
                    disabled={!focusTopic.trim() || focusRemaining <= 0}
                    className="px-6 py-2.5 bg-gradient-to-r from-brand-500 to-violet-600 text-white font-medium rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    <Play size={16} /> Start Focus
                  </button>
                </div>
              </div>
            </Card>

            {/* Tasks Card */}
            <Card>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                  <CheckCircle size={18} className="text-green-400" /> Today's Tasks
                </h3>
                <span className="text-xs text-white/30">{tasksDoneToday}/{totalTasks}</span>
              </div>

              <form onSubmit={handleAddTask} className="flex gap-2 mb-3">
                <input
                  id="task-input"
                  type="text"
                  className="flex-1 bg-white/10 text-white text-sm rounded-xl px-3 py-1.5 placeholder-white/30 outline-none border border-white/10 focus:border-brand-500/50 transition"
                  placeholder="Add a task..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                />
                <input
                  type="number"
                  className="w-16 bg-white/10 text-white text-sm rounded-xl px-2 py-1.5 placeholder-white/30 outline-none border border-white/10 focus:border-brand-500/50 transition"
                  placeholder="XP"
                  value={newTaskXp}
                  onChange={(e) => setNewTaskXp(parseInt(e.target.value) || 0)}
                />
                <button
                  type="submit"
                  disabled={actionLoading || !newTaskTitle.trim()}
                  className="px-3 py-1.5 bg-brand-500 text-white rounded-xl text-sm hover:opacity-90 transition active:scale-95 disabled:opacity-50"
                >
                  <Plus size={16} />
                </button>
              </form>

              {tasks.length === 0 ? (
                <p className="text-sm text-white/40 text-center py-2">✨ No tasks for today</p>
              ) : (
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {tasks.slice(0, 4).map((task) => (
                    <div key={task.id} className="flex items-center gap-2 bg-white/10 rounded-xl px-2 py-1.5">
                      <button
                        onClick={() => !task.is_completed && handleTaskComplete(task)}
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          task.is_completed ? 'bg-green-500 border-green-500' : 'border-white/30'
                        }`}
                      >
                        {task.is_completed && <CheckCircle size={10} className="text-white" />}
                      </button>
                      <span className={`text-xs flex-1 truncate ${task.is_completed ? 'line-through text-white/30' : 'text-white/80'}`}>
                        {task.title}
                      </span>
                      <span className="text-[10px] text-white/30">{task.xp_reward}XP</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Social Buzz */}
            <Card>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                  <Users size={18} className="text-brand-400" /> Social Buzz
                </h3>
                <Link to="/momentum" className="text-xs text-brand-400 hover:underline">View all →</Link>
              </div>
              <GlanceTicker posts={feedPosts} loading={feedLoading} />
            </Card>

            {/* Orbit Card */}
            <Card gradient>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Rocket size={18} className="text-purple-400" /> Orbit
                  </h3>
                  <p className="text-xs text-white/50 mt-1">AI-powered interactive learning</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    Explore topics through Cortex, CluePath, Pathfinder & Reflex.
                  </p>
                </div>
                <Sparkles size={20} className="text-purple-400 animate-pulse" />
              </div>
              <Link
                to="/orbit"
                className="mt-3 inline-block w-full text-center py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium hover:opacity-90 transition active:scale-95"
              >
                Launch Orbit 🚀
              </Link>
            </Card>
          </div>

          {/* ---- Right Column (1/3) – Overview ---- */}
          <div className="space-y-4">
            {/* Smart Suggestions (AI) */}
            <Card>
              <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2 mb-2">
                <Brain size={18} className="text-amber-400" /> Smart Suggestions
              </h3>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2 text-sm text-white/70">
                  <span className="text-amber-400 mt-0.5">•</span>
                  <span>You haven't studied today. Start a focus session.</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-white/70">
                  <span className="text-amber-400 mt-0.5">•</span>
                  <span>Algebra seems weak – try Orbit Cortex.</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-white/70">
                  <span className="text-amber-400 mt-0.5">•</span>
                  <span>2 tasks are overdue. Complete them now.</span>
                </div>
              </div>
              <button className="mt-2 text-xs text-brand-400 hover:underline">Refresh</button>
            </Card>

            {/* Your Path (Skills & Opportunities) */}
            <Card>
              <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2 mb-2">
                <Target size={18} className="text-purple-400" /> Your Path
              </h3>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-white/60">Career Readiness</span>
                <span className="text-white font-medium">{Math.round(progressPercent)}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="mt-2 text-xs text-white/40">
                {stats.totalXP > 500 ? '🌟 You\'re on track!' : 'Complete tasks & challenges to grow.'}
              </div>
            </Card>

            {/* Up Next (Timetable) */}
            <Card>
              <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2 mb-2">
                <Calendar size={18} className="text-violet-400" /> Up Next
              </h3>
              {todayEntries.length === 0 ? (
                <p className="text-sm text-white/40">No classes scheduled</p>
              ) : (
                <div className="space-y-1.5">
                  {todayEntries.slice(0, 2).map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <span className="text-white/40 w-14">{entry.start_time?.slice(0,5) || '—'}</span>
                      <span className="text-white/80">{entry.subject_name || entry.title || 'Class'}</span>
                    </div>
                  ))}
                </div>
              )}
              <Link to="/studysphere" className="mt-2 text-xs text-brand-400 hover:underline block">View full timetable →</Link>
            </Card>

            {/* Quick Capture (Brain Dump) */}
            <Card>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                  <PenTool size={18} className="text-green-400" /> Quick Capture
                </h3>
                <button onClick={() => setShowBrainDump(!showBrainDump)} className="text-white/40 hover:text-white transition">
                  {showBrainDump ? <X size={16} /> : <Plus size={16} />}
                </button>
              </div>
              {showBrainDump ? (
                <div className="mt-2">
                  <textarea
                    className="w-full bg-white/10 text-white text-sm rounded-xl px-3 py-2 h-16 placeholder-white/30 outline-none border border-white/10 focus:border-brand-500/50 transition"
                    placeholder="Write your thoughts..."
                    value={brainDump}
                    onChange={(e) => setBrainDump(e.target.value)}
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={saveBrainDump} className="flex-1 py-1.5 bg-brand-500 text-white text-xs font-medium rounded-xl hover:opacity-90 transition">
                      Save
                    </button>
                    <button onClick={() => setShowBrainDump(false)} className="flex-1 py-1.5 bg-white/10 text-white text-xs font-medium rounded-xl hover:bg-white/20 transition">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-white/40 mt-1">{brainDump ? brainDump.split('\n').slice(-1)[0] : 'No notes yet.'}</p>
              )}
            </Card>
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