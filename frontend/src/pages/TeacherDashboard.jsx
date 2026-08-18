// frontend/src/pages/TeacherDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { 
  Loader2, Users, BookOpen, TrendingUp, Award, 
  User, Settings, Bell, LogOut, Link2, Plus, 
  ChevronRight, MessageCircle, Megaphone, 
  Star, Activity, ClipboardCheck, Clock,
  Sun, Moon, Palette
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import PageBackground from '../components/PageBackground';

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [progress, setProgress] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Load theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = () => {
    try {
      const savedTheme = localStorage.getItem('teacherDashboardTheme');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
        applyTheme(savedTheme === 'dark');
      } else {
        // Default to dark
        setIsDarkMode(true);
        applyTheme(true);
      }
    } catch (err) {
      console.log('Theme loading error:', err);
    }
  };

  const applyTheme = (dark) => {
    const root = document.documentElement;
    if (dark) {
      root.style.setProperty('--bg-primary', '#0a0a0f');
      root.style.setProperty('--bg-secondary', '#1a1a2e');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#a0a0b0');
      root.style.setProperty('--border-color', 'rgba(255,255,255,0.1)');
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.style.setProperty('--bg-primary', '#f0f0f5');
      root.style.setProperty('--bg-secondary', '#ffffff');
      root.style.setProperty('--text-primary', '#1a1a2e');
      root.style.setProperty('--text-secondary', '#4a4a5e');
      root.style.setProperty('--border-color', 'rgba(0,0,0,0.1)');
      root.classList.add('light');
      root.classList.remove('dark');
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('teacherDashboardTheme', newTheme ? 'dark' : 'light');
    
    try {
      const settings = await api.getPrivacySettings() || {};
      settings.theme = newTheme ? 'dark' : 'light';
      await api.updatePrivacySettings(settings);
    } catch (err) {
      console.log('Could not save theme to server:', err);
    }
  };

  const handleLogout = () => {
    logout();
    // navigate to login handled by auth context
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentsData, summaryData] = await Promise.all([
        api.getTeacherStudents(),
        api.getTeacherClassSummary(),
      ]);
      setStudents(studentsData);
      setSummary(summaryData);
      if (studentsData.length > 0 && !selectedStudent) setSelectedStudent(studentsData[0]);
      
      try {
        const notifData = await api.getNotifications();
        setNotifications(Array.isArray(notifData) ? notifData : []);
      } catch (err) {}

      setRecentActivity([
        { id: 1, type: 'assignment', title: 'New assignment: Math Quiz', date: new Date().toISOString() },
        { id: 2, type: 'feedback', title: 'Feedback given to Sarah', date: new Date().toISOString() },
        { id: 3, type: 'announcement', title: 'Posted: Study tips', date: new Date().toISOString() },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentProgress = async (studentId) => {
    try {
      const data = await api.getTeacherStudentProgress(studentId);
      setProgress(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedStudent) loadStudentProgress(selectedStudent.id);
  }, [selectedStudent]);

  if (loading) return (
    <div className="p-6 flex justify-center items-center min-h-[60vh]">
      <Loader2 className="animate-spin text-brand-400" size={40} />
    </div>
  );

  // Settings Modal Component
  const SettingsModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowSettingsModal(false)}>
      <div className={`rounded-xl max-w-md w-full p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} border ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </h3>
          <button onClick={() => setShowSettingsModal(false)} className="text-white/40 hover:text-white">
            ✕
          </button>
        </div>

        {/* Theme Toggle */}
        <div className="mb-6">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Appearance
          </h4>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setIsDarkMode(true);
                applyTheme(true);
                localStorage.setItem('teacherDashboardTheme', 'dark');
              }}
              className={`flex-1 p-3 rounded-lg border-2 transition ${
                isDarkMode 
                  ? 'border-brand-500 bg-brand-500/20' 
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              <Moon className="w-6 h-6 mx-auto mb-1" />
              <div className="text-sm">Dark</div>
            </button>
            <button
              onClick={() => {
                setIsDarkMode(false);
                applyTheme(false);
                localStorage.setItem('teacherDashboardTheme', 'light');
              }}
              className={`flex-1 p-3 rounded-lg border-2 transition ${
                !isDarkMode 
                  ? 'border-brand-500 bg-brand-500/20' 
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              <Sun className="w-6 h-6 mx-auto mb-1" />
              <div className="text-sm">Light</div>
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="border-t border-white/10 pt-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold">
              {user?.full_name?.[0] || 'U'}
            </div>
            <div>
              <div className="font-medium">{user?.full_name || 'User'}</div>
              <div className="text-sm text-white/40">{user?.email || ''}</div>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full btn-secondary flex items-center justify-center gap-2 text-red-400 hover:text-red-300 border-red-400/20 hover:border-red-400/40"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : 'light'}`}>
      <PageBackground imageUrl="/teacher-bg.jpg">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Header with Bridge and Settings */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">👨‍🏫 Teacher Dashboard</h1>
              <p className="text-white/40 mt-1">Welcome back, {user?.full_name || 'Teacher'}!</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Bridge Button */}
              <Link
                to="/bridge"
                className="p-2 rounded-lg bg-brand-500/20 hover:bg-brand-500/30 transition border border-brand-500/30 flex items-center gap-2 text-brand-400 hover:text-brand-300"
                title="Go to Bridge"
              >
                <Link2 className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-medium">Bridge</span>
              </Link>
              {/* Settings Button */}
              <button
                onClick={() => setShowSettingsModal(true)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition border border-white/10"
                title="Settings"
              >
                <Settings className="w-5 h-5 text-white/60 hover:text-white" />
              </button>
              {/* Notifications */}
              <div className="relative">
                <Bell className="text-white/60 hover:text-white cursor-pointer" size={24} />
                {notifications.some(n => !n.is_read) && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                )}
              </div>
            </div>
          </div>

          {/* Quick Action: Connect Student */}
          <div className="card p-4 border-brand-500/30 bg-brand-500/5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-brand-400" />
                  Connect a Student
                </h2>
                <p className="text-sm text-white/60">Use a student's connection code to link them to your class.</p>
              </div>
              <Link to="/bridge" className="btn-primary flex items-center gap-2">
                <Plus size={18} />
                Connect Student
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4 text-center">
              <Users className="w-6 h-6 text-brand-400 mx-auto mb-1" />
              <div className="text-2xl font-bold">{summary?.total_students || 0}</div>
              <div className="text-xs text-white/40">Total Students</div>
            </div>
            <div className="card p-4 text-center">
              <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-1" />
              <div className="text-2xl font-bold">{Math.round(summary?.avg_xp || 0)}</div>
              <div className="text-xs text-white/40">Avg XP</div>
            </div>
            <div className="card p-4 text-center">
              <Award className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
              <div className="text-2xl font-bold">{Math.round(summary?.avg_level || 1)}</div>
              <div className="text-xs text-white/40">Avg Level</div>
            </div>
            <div className="card p-4 text-center">
              <Activity className="w-6 h-6 text-blue-400 mx-auto mb-1" />
              <div className="text-2xl font-bold">{summary?.active_7d || 0}</div>
              <div className="text-xs text-white/40">Active (7d)</div>
            </div>
          </div>

          {/* Main Content: Student List + Progress */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Students List and Quick Actions */}
            <div className="lg:col-span-1 space-y-6">
              {/* Students List */}
              <div className="card p-4">
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Users size={20} className="text-brand-400" /> My Students
                </h2>
                {students.length === 0 ? (
                  <div className="text-center text-white/40 py-8">
                    <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium text-white/60">No students yet</p>
                    <p className="text-sm">Connect with students using the Bridge page.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {students.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedStudent(s)}
                        className={`w-full text-left p-3 rounded-lg transition ${
                          selectedStudent?.id === s.id
                            ? 'bg-brand-500/20 border border-brand-500/30'
                            : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-sm">
                            {s.full_name?.[0] || 'S'}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{s.full_name}</p>
                            <p className="text-xs text-white/40">Level {s.level} • {s.xp} XP</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Class Summary */}
              {summary && (
                <div className="card p-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <BookOpen size={18} className="text-blue-400" /> Class Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-white/40">Total:</span> {summary.total_students}</div>
                    <div><span className="text-white/40">Avg XP:</span> {Math.round(summary.avg_xp)}</div>
                    <div><span className="text-white/40">Avg Level:</span> {Math.round(summary.avg_level)}</div>
                    <div><span className="text-white/40">Active 7d:</span> {summary.active_7d}</div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="card p-4">
                <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
                <div className="space-y-2">
                  <Link to="/bridge" className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition w-full text-left">
                    <Users className="w-5 h-5 text-brand-400" />
                    <span>Manage Students</span>
                  </Link>
                  <Link to="/bridge?tab=announcements" className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition w-full text-left">
                    <Megaphone className="w-5 h-5 text-yellow-400" />
                    <span>Post Announcement</span>
                  </Link>
                  <Link to="/bridge?tab=messages" className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition w-full text-left">
                    <MessageCircle className="w-5 h-5 text-green-400" />
                    <span>Send Message</span>
                  </Link>
                  <Link to="/parent-dashboard" className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition w-full text-left">
                    <User className="w-5 h-5 text-purple-400" />
                    <span>Parent Dashboard</span>
                  </Link>
                </div>
              </div>

              {/* Encouragement Tip */}
              <div className="card p-4 border-green-500/20 bg-green-500/5">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Star className="w-5 h-5 text-green-400" />
                  Encouragement Tip
                </h2>
                <p className="text-sm text-white/60 mt-1">
                  "A little encouragement goes a long way. Send a message to a student today!"
                </p>
                <Link to="/bridge" className="mt-3 inline-block text-sm text-brand-400 hover:text-brand-300">
                  Send Encouragement
                </Link>
              </div>
            </div>

            {/* Right: Student Progress */}
            <div className="lg:col-span-2">
              {selectedStudent && progress ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="card p-4 text-center">
                      <p className="text-white/40 text-sm">XP</p>
                      <p className="text-2xl font-bold">{progress.xp}</p>
                    </div>
                    <div className="card p-4 text-center">
                      <p className="text-white/40 text-sm">Level</p>
                      <p className="text-2xl font-bold">{progress.level}</p>
                    </div>
                    <div className="card p-4 text-center">
                      <p className="text-white/40 text-sm">Tasks</p>
                      <p className="text-2xl font-bold">{progress.tasks}</p>
                    </div>
                    <div className="card p-4 text-center">
                      <p className="text-white/40 text-sm">Challenges</p>
                      <p className="text-2xl font-bold">{progress.challenges}</p>
                    </div>
                  </div>
                  <div className="card p-5">
                    <h3 className="font-semibold mb-3">Weekly XP Activity</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={progress.weekly || []}>
                        <XAxis dataKey="date" stroke="#fff" />
                        <YAxis stroke="#fff" />
                        <Tooltip contentStyle={{ background: '#1a1a20', border: 'none' }} />
                        <Line type="monotone" dataKey="xp" stroke="#8b5cf6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="card p-6 text-center text-white/40">
                  <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Select a student to view progress.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </PageBackground>

      {/* Settings Modal */}
      {showSettingsModal && <SettingsModal />}
    </div>
  );
}