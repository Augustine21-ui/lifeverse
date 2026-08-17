// frontend/src/pages/ParentDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { 
  Loader2, User, BookOpen, FileText, MessageCircle, 
  TrendingUp, TrendingDown, Minus, Heart, Bell, Send, 
  ChevronRight, Download, Eye, Calendar, Award, 
  File, CheckCircle, Clock, AlertCircle, Settings, 
  Sun, Moon, LogOut, Palette, Save
} from 'lucide-react';
import PageBackground from '../components/PageBackground';
import { Link, useNavigate } from 'react-router-dom';

export default function ParentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [encouragementText, setEncouragementText] = useState('');
  const [sendingEncouragement, setSendingEncouragement] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedReportCard, setSelectedReportCard] = useState(null);
  const [showReportCardModal, setShowReportCardModal] = useState(false);
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Load theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      // Try to get from localStorage first (for performance)
      const savedTheme = localStorage.getItem('parentDashboardTheme');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
        applyTheme(savedTheme === 'dark');
        return;
      }

      // If not in localStorage, try to get from user settings
      if (user?.id) {
        try {
          const settings = await api.getPrivacySettings();
          if (settings?.theme) {
            setIsDarkMode(settings.theme === 'dark');
            applyTheme(settings.theme === 'dark');
            localStorage.setItem('parentDashboardTheme', settings.theme || 'dark');
          }
        } catch (err) {
          console.log('Could not load theme from server, using default');
        }
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
    localStorage.setItem('parentDashboardTheme', newTheme ? 'dark' : 'light');
    
    // Save to user settings
    try {
      const settings = await api.getPrivacySettings() || {};
      settings.theme = newTheme ? 'dark' : 'light';
      await api.updatePrivacySettings(settings);
    } catch (err) {
      console.log('Could not save theme to server:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Get child
      const child = await api.getBridgeChild();
      console.log('Child data from getBridgeChild:', child);
      
      if (child && child.id) {
        try {
          const progressData = await api.getParentChildProgress();
          if (progressData && progressData.student) {
            setData(progressData);
          } else {
            setData({
              student: child,
              assignments: progressData?.assignments || [],
              feedback: progressData?.feedback || [],
              reportCards: progressData?.reportCards || [],
              encouragement: progressData?.encouragement || [],
              trends: progressData?.trends || []
            });
          }
        } catch (progressErr) {
          setData({
            student: child,
            assignments: [],
            feedback: [],
            reportCards: [],
            encouragement: [],
            trends: []
          });
        }
      } else {
        setData({ 
          student: null, 
          assignments: [], 
          feedback: [], 
          reportCards: [], 
          encouragement: [], 
          trends: [] 
        });
      }
      
      try {
        const notifData = await api.getNotifications();
        setNotifications(notifData || []);
      } catch (notifErr) {
        console.error('Error fetching notifications:', notifErr);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setData({ 
        student: null, 
        assignments: [], 
        feedback: [], 
        reportCards: [], 
        encouragement: [], 
        trends: [] 
      });
    } finally {
      setLoading(false);
    }
  };

  // Rest of your existing functions...
  const sendEncouragement = async (e) => {
    e.preventDefault();
    if (!encouragementText.trim() || !data?.student) return;
    setSendingEncouragement(true);
    try {
      await api.sendEncouragement(data.student.id, encouragementText);
      setEncouragementText('');
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSendingEncouragement(false);
    }
  };

  const getTrendIcon = (trend) => {
    if (trend === 'Improving') return <TrendingUp size={16} className="text-green-400" />;
    if (trend === 'Needs Attention') return <TrendingDown size={16} className="text-red-400" />;
    return <Minus size={16} className="text-yellow-400" />;
  };

  const downloadReportCard = (fileUrl) => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

  const viewReportCard = (reportCard) => {
    setSelectedReportCard(reportCard);
    setShowReportCardModal(true);
  };

  const getStatusBadge = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    if (due < now) {
      return <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">Overdue</span>;
    }
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    if (diff <= 3) {
      return <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">Due Soon</span>;
    }
    return <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">Upcoming</span>;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
                localStorage.setItem('parentDashboardTheme', 'dark');
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
                localStorage.setItem('parentDashboardTheme', 'light');
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

  if (loading) {
    return (
      <PageBackground imageUrl="/parent-bg.jpg">
        <div className="p-6 flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-brand-400" size={40} />
        </div>
      </PageBackground>
    );
  }

  if (!data || !data.student) {
    return (
      <PageBackground imageUrl="/parent-bg.jpg">
        <div className="p-6 max-w-4xl mx-auto text-center py-16">
          <div className="text-6xl mb-4">👶</div>
          <h2 className="text-2xl font-bold mb-2">No child linked</h2>
          <p className="text-white/40">Connect with your child using their connection code.</p>
          <Link to="/bridge" className="mt-4 inline-block btn-primary">Go to Bridge</Link>
        </div>
      </PageBackground>
    );
  }

  const { student, assignments = [], feedback = [], reportCards = [], encouragement = [], trends = [] } = data;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : 'light'}`}>
      <PageBackground imageUrl="/parent-bg.jpg">
        <div className="p-6 max-w-6xl mx-auto">
          {/* Header with Settings Button */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold">👨‍👩‍👧 Parent Dashboard</h1>
              <p className="text-white/40">Support your child's academic journey</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Settings Button */}
              <button
                onClick={() => setShowSettingsModal(true)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition border border-white/10"
                title="Settings"
              >
                <Settings className="w-5 h-5 text-white/60 hover:text-white" />
              </button>
              
              {/* Notification Bell */}
              <div className="relative">
                <Bell className="text-white/60 hover:text-white cursor-pointer" size={24} />
                {notifications.some(n => !n.is_read) && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                )}
              </div>
            </div>
          </div>

          {/* Student Summary */}
          <div className="card p-5 mb-6 flex flex-wrap items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-white text-xl font-bold">
              {(student.full_name?.[0] || 'S').toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{student.full_name}</h2>
              <p className="text-white/40">Level {student.level || 1} • {student.xp || 0} XP</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-sm text-white/40">Streak</p>
                <p className="text-amber-400 font-semibold">🔥 {student.streak_days || 0} days</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-white/40">Report Cards</p>
                <p className="text-brand-400 font-semibold">{reportCards?.length || 0}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-white/10 overflow-x-auto">
            {['overview', 'report-cards', 'assignments', 'feedback', 'encouragement'].map((tab) => (
              <button
                key={tab}
                className={`px-4 py-2 capitalize transition whitespace-nowrap ${
                  selectedTab === tab 
                    ? 'border-b-2 border-brand-500 text-white' 
                    : 'text-white/40 hover:text-white'
                }`}
                onClick={() => setSelectedTab(tab)}
              >
                {tab === 'overview' && '📊 Overview'}
                {tab === 'report-cards' && '📄 Report Cards'}
                {tab === 'assignments' && '📚 Assignments'}
                {tab === 'feedback' && '💬 Feedback'}
                {tab === 'encouragement' && '❤️ Encouragement'}
              </button>
            ))}
          </div>

          {/* Tab Content - Keep your existing tab content here */}
          {/* ... (rest of your existing tab content) ... */}

          {/* Settings Modal */}
          {showSettingsModal && <SettingsModal />}

          {/* Report Card Modal */}
          {showReportCardModal && selectedReportCard && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowReportCardModal(false)}>
              <div className={`rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} border ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`} onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold">{selectedReportCard.title}</h3>
                    <p className="text-white/40 mt-1">
                      {selectedReportCard.subject || 'General'} • {new Date(selectedReportCard.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button onClick={() => setShowReportCardModal(false)} className="text-white/40 hover:text-white">
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  {selectedReportCard.description && (
                    <div className="card p-4">
                      <h4 className="font-semibold mb-1">Description</h4>
                      <p className="text-white/60">{selectedReportCard.description}</p>
                    </div>
                  )}

                  {selectedReportCard.grade && (
                    <div className="card p-4 flex items-center justify-between">
                      <span className="font-semibold">Grade</span>
                      <span className="text-2xl font-bold text-yellow-400">{selectedReportCard.grade}</span>
                    </div>
                  )}

                  {selectedReportCard.uploaded_by_name && (
                    <div className="text-sm text-white/40">
                      Uploaded by: {selectedReportCard.uploaded_by_name}
                    </div>
                  )}

                  {selectedReportCard.file_url && (
                    <button 
                      onClick={() => downloadReportCard(selectedReportCard.file_url)}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download Report Card
                    </button>
                  )}
                </div>

                <button 
                  className="mt-4 w-full btn-secondary" 
                  onClick={() => setShowReportCardModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </PageBackground>
    </div>
  );
}