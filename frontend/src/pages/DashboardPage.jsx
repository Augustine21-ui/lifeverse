import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Flame, Calendar, CheckCircle, Clock, Zap, Trophy, Loader2, Heart, MessageCircle, Send, Plus, Trash2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import MoodAvatar from '../components/MoodAvatar';
import QuizModal from '../components/QuizModal';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  if (hour < 22) return 'Good evening';
  return 'Good night';
};

const SkeletonCard = () => <div className="card p-4 h-24 animate-pulse bg-white/5" />;
const SkeletonTask = () => <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/10 animate-pulse h-12" />;

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState({ totalXP: 0, todayXP: 0, streakDays: 0, rank: '#?', completed: 0 });
  const [tasks, setTasks] = useState([]);
  const [todayChallenges, setTodayChallenges] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [greeting, setGreeting] = useState(getGreeting());

  // Quiz states
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [currentQuizId, setCurrentQuizId] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  // Focus timer states
  const [focusRemaining, setFocusRemaining] = useState(4);
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerInterval, setTimerInterval] = useState(null);

  // Feed states
  const [feedPosts, setFeedPosts] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [commentsMap, setCommentsMap] = useState({});
  const feedEndRef = useRef(null);

  // Task creation states
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskXp, setNewTaskXp] = useState(30);

  // Auto-scroll feed
  useEffect(() => {
    if (feedEndRef.current) feedEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [feedPosts]);

  // Poll feed every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => loadFeed(true), 5000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsData, tasksData, todayChallengesData] = await Promise.all([
        api.getDashboardStats(),
        api.getTodayTasks(),
        api.getTodayChallenges(),
      ]);
      console.log('✅ Tasks from API:', tasksData);
      setStats(statsData);
      setTasks(tasksData);
      setTodayChallenges(todayChallengesData.count);
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
      setFeedPosts(data.posts || data);
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
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, []);

  // --- Quiz generation and submission ---
  const generateQuizForTask = async (task) => {
    setGeneratingQuiz(true);
    setQuizResult(null);
    try {
      console.log('🔍 Generating quiz for task:', task.id, task.title);
      const topic = task.title;
      const token = localStorage.getItem('token');
      const res = await fetch('/api/tasks/quiz/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ taskId: task.id, topic }),
      });
      const data = await res.json();
      if (data.quizId && data.questions) {
        setCurrentQuizId(data.quizId);
        setQuizQuestions(data.questions);
        setCurrentTaskId(task.id);
        setShowQuizModal(true);
      } else {
        throw new Error(data.error || 'Failed to generate quiz');
      }
    } catch (err) {
      console.error(err);
      showToast('Could not generate quiz. Please try again.', 'error');
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleQuizSubmit = async (answers) => {
  setQuizLoading(true);
  try {
    console.log('📤 Submitting quiz:', { quizId: currentQuizId, taskId: currentTaskId, userId: user?.id });
    const token = localStorage.getItem('token');
    const res = await fetch('/api/tasks/quiz/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        quizId: currentQuizId,
        answers,
        userId: user?.id,
      }),
    });
    const result = await res.json();
    console.log('📥 Quiz result:', result);

    // Show a toast notification with the result
    if (result.passed) {
      showToast(result.message || `✅ You passed! Earned ${result.xpEarned} XP!`);
    } else {
      showToast(result.message || `❌ You scored ${result.percentage}%. Need at least 50% to pass.`);
    }

    if (result.passed) {
      await loadDashboard();
      await refreshUser();
      setShowQuizModal(false);
      setQuizQuestions([]);
      setCurrentQuizId(null);
      setQuizResult(null);
    } else {
      // Keep modal open and display the result
      setQuizResult(result);
      setQuizLoading(false);
    }
  } catch (err) {
    console.error(err);
    showToast('Quiz submission failed', 'error');
    setQuizLoading(false);
  }
};

  const handleRetryQuiz = () => {
    const task = tasks.find(t => t.id === currentTaskId);
    if (task) {
      generateQuizForTask(task);
    } else {
      showToast('Task not found. Please try again.', 'error');
    }
  };

  // ---------- CRITICAL FIX: Handle milestone tasks with negative IDs ----------
  const handleTaskComplete = async (task) => {
    console.log('✅ Task completion requested:', task);
    let taskId = task.id;
    // If the task has a negative ID (milestone or placeholder), create a real task first
    if (taskId < 0) {
      try {
        console.log('🔄 Creating real task for milestone:', task.title);
        const newTask = await api.createTask({
          title: task.title,
          xp_reward: task.xp_reward || 30,
        });
        taskId = newTask.id;
        // Update the task list with the new positive ID
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, id: taskId } : t));
        console.log('✅ Real task created with ID:', taskId);
      } catch (err) {
        showToast('Failed to create task for milestone', 'error');
        return;
      }
    }
    // Now call quiz generation with the validated positive ID
    await generateQuizForTask({ ...task, id: taskId });
  };
  // ------------------------------------------------------------------------

  // Add new task
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setActionLoading(true);
    try {
      const newTask = await api.createTask({ title: newTaskTitle, xp_reward: newTaskXp });
      console.log('➕ Created new task:', newTask);
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

  // Delete task
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

  // Focus timer logic
  const startTimer = async () => {
    if (focusRemaining <= 0) {
      showToast('Daily focus session limit reached (4 per day).', 'error');
      return;
    }
    if (timerActive) return;
    setTimerActive(true);
    let seconds = 25 * 60;
    setTimerSeconds(seconds);
    const interval = setInterval(async () => {
      if (seconds <= 1) {
        clearInterval(interval);
        setTimerActive(false);
        setTimerSeconds(25 * 60);
        try {
          const res = await api.completeFocusSession(25);
          showToast(`+${res.xpAwarded} XP for completing focus session! ${res.remaining} left today`);
          setFocusRemaining(res.remaining);
          await loadDashboard();
          await refreshUser();
        } catch (err) {
          showToast(err.message, 'error');
        }
      } else {
        seconds--;
        setTimerSeconds(seconds);
      }
    }, 1000);
    setTimerInterval(interval);
  };

  const cancelTimer = () => {
    if (timerInterval) clearInterval(timerInterval);
    setTimerActive(false);
    setTimerSeconds(25 * 60);
  };

  // Feed interactions
  const handleLike = async (postId) => {
    try {
      const result = await api.likePost(postId);
      setFeedPosts(prev =>
        prev.map(p =>
          p.id === postId ? { ...p, likes_count: p.likes_count + (result.liked ? 1 : -1), user_liked: result.liked } : p
        )
      );
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    }
  };

  const loadComments = async (postId) => {
    try {
      const comments = await api.getComments(postId);
      setCommentsMap(prev => ({ ...prev, [postId]: comments }));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleComments = async (postId) => {
    if (!expandedComments[postId]) {
      if (!commentsMap[postId]) await loadComments(postId);
      setExpandedComments({ ...expandedComments, [postId]: true });
    } else {
      setExpandedComments({ ...expandedComments, [postId]: false });
    }
  };

  const handleComment = async (postId) => {
    const content = commentInputs[postId];
    if (!content?.trim()) return;
    try {
      const newComment = await api.addComment(postId, content);
      setCommentsMap(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment]
      }));
      setFeedPosts(prev =>
        prev.map(p =>
          p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
        )
      );
      setCommentInputs({ ...commentInputs, [postId]: '' });
      showToast('Comment added!');
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Delete this post?')) return;
    try {
      await api.deletePost(postId);
      setFeedPosts(prev => prev.filter(p => p.id !== postId));
      showToast('Post deleted');
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    setSubmitting(true);
    try {
      await api.createPost(newPostContent, newPostImage || null);
      setNewPostContent('');
      setNewPostImage('');
      showToast('Post created! +10 XP');
      await loadFeed();
      await loadDashboard();
      await refreshUser();
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const tasksDoneToday = tasks.filter(t => t.is_completed).length;
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6 space-y-2">
          <div className="h-4 w-32 bg-white/10 animate-pulse rounded" />
          <div className="h-8 w-64 bg-white/10 animate-pulse rounded" />
          <div className="h-4 w-96 bg-white/10 animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <div className="h-6 w-32 bg-white/10 animate-pulse rounded mb-4" />
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <SkeletonTask key={i} />)}
            </div>
          </div>
          <div className="card p-5 h-32 animate-pulse bg-white/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start mb-6 gap-4">
        <div>
          <p className="text-white/40 text-sm uppercase tracking-wide">{today}</p>
          <h1 className="text-3xl font-display font-bold mt-1">
            {greeting}, {user?.fullName?.split(' ')[0] || 'Learner'} 🥳
          </h1>
          <p className="text-amber-400 text-sm mt-1">
            🔥 You're on a {stats.streakDays}-day streak! Complete today's challenges to unlock your weekly achievement badge.
          </p>
        </div>
        <MoodAvatar
          streak={stats.streakDays}
          todayXP={stats.todayXP}
          tasksDone={tasksDoneToday}
          challengesDone={todayChallenges}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-4 flex items-center justify-between">
          <div><p className="text-white/40 text-sm">XP EARNED</p><p className="text-2xl font-bold text-white">{stats.totalXP.toLocaleString()}</p><p className="text-green-400 text-xs">+{stats.todayXP} today</p></div>
          <Zap size={32} className="text-brand-400" />
        </div>
        <div className="card p-4 flex items-center justify-between">
          <div><p className="text-white/40 text-sm">DAY STREAK</p><p className="text-2xl font-bold text-white">{stats.streakDays}</p><p className="text-white/40 text-xs">Keep going!</p></div>
          <Flame size={32} className="text-orange-400" />
        </div>
        <div className="card p-4 flex items-center justify-between">
          <div><p className="text-white/40 text-sm">RANK</p><p className="text-2xl font-bold text-white">{stats.rank}</p><p className="text-white/40 text-xs">Top 5%</p></div>
          <Trophy size={32} className="text-yellow-400" />
        </div>
        <div className="card p-4 flex items-center justify-between">
          <div><p className="text-white/40 text-sm">COMPLETED</p><p className="text-2xl font-bold text-white">{stats.completed}</p><p className="text-white/40 text-xs">challenges</p></div>
          <CheckCircle size={32} className="text-green-400" />
        </div>
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Today's Tasks */}
        <div className="card p-5">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Calendar size={18} className="text-brand-400" />Today's Tasks
          </h2>

          <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
            <input
              type="text"
              className="flex-1 input text-sm"
              placeholder="New task title..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
            <input
              type="number"
              className="w-20 input text-sm"
              placeholder="XP"
              value={newTaskXp}
              onChange={(e) => setNewTaskXp(parseInt(e.target.value) || 0)}
            />
            <button type="submit" disabled={actionLoading} className="btn-primary px-3">Add</button>
          </form>

          {tasks.length === 0 ? (
            <p className="text-white/40">No tasks for today. Add one above!</p>
          ) : (
            <div className="space-y-2">
              {tasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/10">
                  <button
                    onClick={() => !task.is_completed && handleTaskComplete(task)}
                    disabled={task.is_completed || generatingQuiz}
                    className={`w-5 h-5 rounded-full border ${task.is_completed ? 'bg-green-500 border-green-500' : 'border-white/30 hover:border-brand-400'} flex items-center justify-center`}
                  >
                    {task.is_completed && <CheckCircle size={12} className="text-white" />}
                  </button>
                  <span className={`flex-1 ${task.is_completed ? 'line-through text-white/40' : 'text-white/90'}`}>{task.title}</span>
                  {!task.is_completed && <span className="text-xs text-amber-400">+{task.xp_reward} XP</span>}
                  <button onClick={() => handleDeleteTask(task.id)} className="text-white/30 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Live Feed + Focus Timer */}
        <div className="space-y-6">
          {/* Live Momentum Feed Card */}
          <div className="card p-5">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">🔥 Live Momentum Feed</h2>
            <form onSubmit={handleCreatePost} className="mb-4 flex gap-2">
              <input
                type="text"
                className="flex-1 input text-sm"
                placeholder="Share something..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
              />
              <input
                type="text"
                className="w-24 input text-sm"
                placeholder="Image URL"
                value={newPostImage}
                onChange={(e) => setNewPostImage(e.target.value)}
              />
              <button type="submit" disabled={submitting} className="btn-primary px-3">
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              </button>
            </form>

            {feedLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white/5 animate-pulse rounded" />)}
              </div>
            ) : feedPosts.length === 0 ? (
              <p className="text-white/40 text-center py-4">No posts yet. Be the first to share!</p>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {feedPosts.map(post => (
                  <div key={post.id} className="border-b border-white/10 pb-3">
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-xs font-bold">
                        {(post.full_name?.[0] || post.username?.[0] || 'U').toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-sm">{post.full_name || post.username}</p>
                            <p className="text-xs text-white/40">{new Date(post.created_at).toLocaleString()}</p>
                          </div>
                          {post.user_id === user?.id && (
                            <button onClick={() => handleDeletePost(post.id)} className="text-white/30 hover:text-red-400 text-xs">Delete</button>
                          )}
                        </div>
                        <p className="text-sm mt-1">{post.content}</p>
                        {post.image_url && <img src={post.image_url} className="mt-2 rounded max-h-40 object-cover w-full" alt="" />}
                        <div className="flex gap-3 mt-2">
                          <button onClick={() => handleLike(post.id)} className={`flex items-center gap-1 text-xs ${post.user_liked ? 'text-red-500' : 'text-white/40'}`}>
                            <Heart size={14} /> {post.likes_count}
                          </button>
                          <button onClick={() => toggleComments(post.id)} className="flex items-center gap-1 text-xs text-white/40">
                            <MessageCircle size={14} /> {post.comments_count}
                          </button>
                        </div>
                        {expandedComments[post.id] && (
                          <div className="mt-2 pl-2 border-l-2 border-white/20">
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {(commentsMap[post.id] || []).map(comment => (
                                <div key={comment.id} className="text-xs"><span className="font-semibold">{comment.full_name}:</span> {comment.content}</div>
                              ))}
                            </div>
                            <div className="flex gap-1 mt-1">
                              <input
                                type="text"
                                className="flex-1 text-xs p-1 rounded bg-white/5 border border-white/10"
                                placeholder="Write a comment..."
                                value={commentInputs[post.id] || ''}
                                onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                                onKeyPress={(e) => e.key === 'Enter' && handleComment(post.id)}
                              />
                              <button onClick={() => handleComment(post.id)} className="text-brand-400 text-xs">Send</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={feedEndRef} />
              </div>
            )}
          </div>

          {/* Focus Timer Card */}
          <div className="card p-5">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Clock size={18} className="text-cyan-400" />Focus Timer</h2>
            {timerActive ? (
              <div className="text-center">
                <p className="text-2xl font-mono mb-2">{Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}</p>
                <button onClick={cancelTimer} className="btn-secondary">Cancel</button>
              </div>
            ) : (
              <button
                onClick={startTimer}
                disabled={focusRemaining <= 0}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-violet-600 text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition"
              >
                <Zap size={16} />
                Start focus session (+30 XP) {focusRemaining > 0 && `(${focusRemaining} left today)`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quiz Modal */}
      {showQuizModal && (
        <QuizModal
          questions={quizQuestions}
          onSubmit={handleQuizSubmit}
          onClose={() => {
            setShowQuizModal(false);
            setQuizQuestions([]);
            setCurrentQuizId(null);
            setQuizResult(null);
          }}
          loading={quizLoading}
          result={quizResult}
          onRetry={handleRetryQuiz}
        />
      )}
    </div>
  );
}