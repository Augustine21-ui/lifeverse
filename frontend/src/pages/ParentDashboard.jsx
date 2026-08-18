// frontend/src/pages/ParentDashboard.jsx
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { 
  Loader2, User, BookOpen, FileText, MessageCircle, 
  TrendingUp, TrendingDown, Minus, Heart, Bell, Send, 
  Download, Eye, Calendar, Award, File, Settings, 
  Sun, Moon, LogOut, RefreshCw, AlertCircle, Link2,
  Users, Plus, X
} from 'lucide-react';
import PageBackground from '../components/PageBackground';
import { Link, useNavigate } from 'react-router-dom';

export default function ParentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [encouragementText, setEncouragementText] = useState('');
  const [sendingEncouragement, setSendingEncouragement] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedReportCard, setSelectedReportCard] = useState(null);
  const [showReportCardModal, setShowReportCardModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Messaging state
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const pollInterval = useRef(null);
  const [peerContacts, setPeerContacts] = useState([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [selectedPeer, setSelectedPeer] = useState(null);

  // Load data on mount
  useEffect(() => {
    loadData();
    loadThemePreference();
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      startPolling();
    }
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [selectedConversation]);

  // Load theme preference
  const loadThemePreference = () => {
    try {
      const savedTheme = localStorage.getItem('parentDashboardTheme');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
        applyTheme(savedTheme === 'dark');
      } else {
        setIsDarkMode(true);
        applyTheme(true);
      }
    } catch (err) {
      console.log('Theme loading error:', err);
    }
  };

  // Apply theme
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

  // Toggle theme
  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('parentDashboardTheme', newTheme ? 'dark' : 'light');
    try {
      const settings = await api.getPrivacySettings() || {};
      settings.theme = newTheme ? 'dark' : 'light';
      await api.updatePrivacySettings(settings);
    } catch (err) {
      console.log('Could not save theme to server:', err);
    }
  };

  const startPolling = () => {
    if (pollInterval.current) clearInterval(pollInterval.current);
    pollInterval.current = setInterval(() => {
      if (selectedConversation) loadMessages(selectedConversation.id);
      loadConversations();
    }, 5000);
  };

  const loadConversations = async () => {
    try {
      const convs = await api.getBridgeConversations();
      if (!Array.isArray(convs)) return;
      // For parent, show all conversations (with students and teachers)
      const mapped = convs.map(conv => ({
        id: conv.id,
        partnerId: parseInt(conv.partner_id, 10),
        partnerName: `${conv.partner_name} (${conv.partner_role})`,
        partnerRole: conv.partner_role,
        last_message: conv.last_message,
        unread_count: conv.unread_count || 0,
      }));
      setConversations(mapped);
      if (mapped.length > 0 && !selectedConversation) {
        setSelectedConversation(mapped[0]);
        await loadMessages(mapped[0].id);
      } else if (selectedConversation) {
        const stillExists = mapped.find(c => c.id === selectedConversation.id);
        if (!stillExists && mapped.length > 0) {
          setSelectedConversation(mapped[0]);
          await loadMessages(mapped[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const msgs = await api.getBridgeMessages(conversationId);
      setMessages(Array.isArray(msgs) ? msgs : []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error('Error loading messages:', err);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;
    const toUserId = selectedConversation.partnerId;
    if (!toUserId || isNaN(toUserId)) {
      alert('Invalid recipient');
      return;
    }
    setSending(true);
    try {
      await api.sendBridgeMessage(toUserId, messageText);
      setMessageText('');
      await loadMessages(selectedConversation.id);
      await loadConversations();
    } catch (err) {
      console.error(err);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const loadPeerContacts = async () => {
    try {
      const contacts = await api.getBridgePeerContacts();
      console.log('🔍 Peer contacts:', contacts);
      setPeerContacts(Array.isArray(contacts) ? contacts : []);
    } catch (err) {
      console.error('❌ Error loading peer contacts:', err);
      setPeerContacts([]);
    }
  };

  const startNewChat = async (peerId) => {
    try {
      // Get or create conversation with peer
      const data = await api.getOrCreatePeerConversation(peerId);
      const conv = {
        id: data.conversationId,
        partnerId: peerId,
        partnerName: peerContacts.find(p => p.id === peerId)?.full_name || 'Unknown',
        partnerRole: peerContacts.find(p => p.id === peerId)?.role || 'teacher',
        last_message: '',
        unread_count: 0,
      };
      // Add to conversations if not exists
      if (!conversations.find(c => c.id === conv.id)) {
        setConversations(prev => [conv, ...prev]);
      }
      setSelectedConversation(conv);
      await loadMessages(conv.id);
      setShowNewChatModal(false);
    } catch (err) {
      console.error(err);
      alert('Could not start chat');
    }
  };

  // Main data loading function with timeout
  const loadData = async () => {
    setLoading(true);
    setError(null);
    setLoadingTimeout(false);

    const timeoutId = setTimeout(() => {
      setLoadingTimeout(true);
      setLoading(false);
      setError('Loading is taking longer than expected. Please try again.');
    }, 15000);

    try {
      // Get child
      let child = null;
      try {
        child = await api.getBridgeChild();
      } catch (childErr) {
        if (childErr.response?.status === 404 || childErr.status === 404) {
          setData({ student: null, assignments: [], feedback: [], reportCards: [], encouragement: [], trends: [] });
          await loadConversations();
          await loadPeerContacts();
          setLoading(false);
          clearTimeout(timeoutId);
          return;
        }
        throw childErr;
      }

      if (!child || !child.id) {
        setData({ student: null, assignments: [], feedback: [], reportCards: [], encouragement: [], trends: [] });
      } else {
        // Get progress data
        let progressData = null;
        try {
          progressData = await api.getParentChildProgress();
        } catch (progressErr) {
          console.error('Progress fetch error:', progressErr);
          progressData = null;
        }

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
      }

      // Fetch notifications
      try {
        const notifData = await api.getNotifications();
        setNotifications(notifData || []);
      } catch (notifErr) {
        console.error('Notifications error:', notifErr);
        setNotifications([]);
      }

      // Load conversations and peer contacts
      await loadConversations();
      await loadPeerContacts();

      clearTimeout(timeoutId);
      setLoading(false);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      clearTimeout(timeoutId);
      setLoading(false);
      setError(err.message || 'Failed to load dashboard data. Please try again.');
    }
  };

  // Send encouragement
  const sendEncouragement = async (e) => {
    e.preventDefault();
    if (!encouragementText.trim() || !data?.student) return;
    setSendingEncouragement(true);
    try {
      await api.sendEncouragement(data.student.id, encouragementText);
      setEncouragementText('');
      const progressData = await api.getParentChildProgress();
      if (progressData) {
        setData(prev => ({
          ...prev,
          encouragement: progressData.encouragement || []
        }));
      }
    } catch (err) {
      console.error('Error sending encouragement:', err);
    } finally {
      setSendingEncouragement(false);
    }
  };

  // Helper functions
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
    if (!dueDate) return null;
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

  const viewStudentProgress = async (studentId) => {
    try {
      const progress = await api.getBridgeStudentProgress(studentId);
      setSelectedReportCard(null); // reuse modal or create new state? For simplicity, we'll just show an alert with data.
      // Or we can open a modal with progress details.
      // Let's use the existing progress modal from BridgePage but we'll create a simple one.
      // For now, we'll navigate to a progress page or show in a modal.
      // Since we don't have a dedicated progress modal in ParentDashboard, we can use the studentProgress state.
      // I'll add a new state for studentProgress.
      setStudentProgress(progress);
      setSelectedStudent(data.student);
    } catch (err) {
      alert('Failed to load progress');
    }
  };

  // Add new state for progress modal
  const [studentProgress, setStudentProgress] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Loading State
  if (loading) {
    return (
      <PageBackground imageUrl="/parent-bg.jpg">
        <div className="p-6 flex flex-col justify-center items-center min-h-[60vh]">
          <Loader2 className="animate-spin text-brand-400" size={48} />
          <p className="text-white/60 mt-4 text-lg">Loading dashboard...</p>
          <p className="text-white/30 text-sm mt-1">Please wait</p>
          {loadingTimeout && (
            <p className="text-yellow-400/60 text-sm mt-4">
              Taking longer than expected...
            </p>
          )}
        </div>
      </PageBackground>
    );
  }

  // Error State
  if (error) {
    return (
      <PageBackground imageUrl="/parent-bg.jpg">
        <div className="p-6 flex flex-col justify-center items-center min-h-[60vh]">
          <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Something went wrong</h3>
          <p className="text-white/60 text-center max-w-md">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              loadData();
            }}
            className="mt-6 btn-primary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </PageBackground>
    );
  }

  // No child linked state
  if (!data || !data.student) {
    return (
      <PageBackground imageUrl="/parent-bg.jpg">
        <div className="p-6 max-w-4xl mx-auto text-center py-16">
          <div className="text-6xl mb-4">👶</div>
          <h2 className="text-2xl font-bold mb-2">No child linked</h2>
          <p className="text-white/60">Connect with your child using their connection code.</p>
          <Link to="/bridge" className="mt-4 inline-block btn-primary">Go to Bridge</Link>
        </div>
      </PageBackground>
    );
  }

  const { student, assignments = [], feedback = [], reportCards = [], encouragement = [], trends = [] } = data;

  // Settings Modal
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

        <div className="mb-6">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Sun className="w-4 h-4" />
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

  // New Chat Modal
  const NewChatModal = () => {
    const teachers = peerContacts.filter(p => p.role === 'teacher' || p.role === 'parent');
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowNewChatModal(false)}>
        <div className={`rounded-xl max-w-md w-full p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} border ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`} onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">New Conversation</h3>
            <button onClick={() => setShowNewChatModal(false)} className="text-white/40 hover:text-white">
              <X size={20} />
            </button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {teachers.length === 0 ? (
              <p className="text-white/40 text-center py-4">No contacts available</p>
            ) : (
              teachers.map(peer => (
                <button
                  key={peer.id}
                  onClick={() => startNewChat(peer.id)}
                  className="w-full text-left p-3 rounded-lg hover:bg-white/5 transition flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold">
                    {peer.full_name?.[0] || '?'}
                  </div>
                  <div>
                    <p className="font-medium">{peer.full_name}</p>
                    <p className="text-xs text-white/40 capitalize">{peer.role}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  // Progress Modal
  const ProgressModal = () => {
    if (!studentProgress || !selectedStudent) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setStudentProgress(null)}>
        <div className={`rounded-xl max-w-md w-full p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} border ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`} onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">📊 {selectedStudent.full_name}'s Progress</h3>
            <button onClick={() => setStudentProgress(null)} className="text-white/40 hover:text-white">
              <X size={20} />
            </button>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between p-3 bg-white/5 rounded">
              <span className="text-white/60">XP</span>
              <span className="text-xl font-bold text-yellow-400">{studentProgress.xp || 0}</span>
            </div>
            <div className="flex justify-between p-3 bg-white/5 rounded">
              <span className="text-white/60">Level</span>
              <span className="text-xl font-bold text-brand-400">{studentProgress.level || 1}</span>
            </div>
            <div className="flex justify-between p-3 bg-white/5 rounded">
              <span className="text-white/60">Tasks</span>
              <span className="text-xl font-bold text-green-400">{studentProgress.tasks || 0}</span>
            </div>
            <div className="flex justify-between p-3 bg-white/5 rounded">
              <span className="text-white/60">Challenges</span>
              <span className="text-xl font-bold text-purple-400">{studentProgress.challenges || 0}</span>
            </div>
            <button className="w-full btn-secondary mt-2" onClick={() => setStudentProgress(null)}>Close</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : 'light'}`}>
      <PageBackground imageUrl="/parent-bg.jpg">
        <div className="p-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold">👨‍👩‍👧 Parent Dashboard</h1>
              <p className="text-white/60">Support your child's academic journey</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/bridge"
                className="p-2 rounded-lg bg-brand-500/20 hover:bg-brand-500/30 transition border border-brand-500/30 flex items-center gap-2 text-brand-400 hover:text-brand-300"
                title="Go to Bridge"
              >
                <Link2 className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-medium">Bridge</span>
              </Link>
              <button
                onClick={() => setShowSettingsModal(true)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition border border-white/10"
                title="Settings"
              >
                <Settings className="w-5 h-5 text-white/60 hover:text-white" />
              </button>
              <div className="relative">
                <Bell className="text-white/60 hover:text-white cursor-pointer" size={24} />
                {notifications.some(n => !n.is_read) && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                )}
              </div>
            </div>
          </div>

          {/* Student Summary with View Progress */}
          <div className="card p-5 mb-6 flex flex-wrap items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-white text-xl font-bold">
              {(student.full_name?.[0] || 'S').toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{student.full_name}</h2>
              <p className="text-white/60">Level {student.level || 1} • {student.xp || 0} XP</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-sm text-white/60">Streak</p>
                <p className="text-amber-400 font-semibold">🔥 {student.streak_days || 0} days</p>
              </div>
              <button
                onClick={() => viewStudentProgress(student.id)}
                className="btn-primary text-sm"
              >
                <Eye className="w-4 h-4 inline mr-1" />
                View Progress
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-white/10 overflow-x-auto">
            {['overview', 'report-cards', 'assignments', 'feedback', 'encouragement', 'messages'].map((tab) => (
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
                {tab === 'messages' && '💬 Messages'}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {selectedTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card p-4 text-center">
                  <FileText className="w-5 h-5 text-brand-400 mx-auto mb-1" />
                  <div className="text-2xl font-bold">{reportCards?.length || 0}</div>
                  <div className="text-xs text-white/40">Report Cards</div>
                </div>
                <div className="card p-4 text-center">
                  <BookOpen className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                  <div className="text-2xl font-bold">{assignments?.length || 0}</div>
                  <div className="text-xs text-white/40">Assignments</div>
                </div>
                <div className="card p-4 text-center">
                  <MessageCircle className="w-5 h-5 text-green-400 mx-auto mb-1" />
                  <div className="text-2xl font-bold">{feedback?.length || 0}</div>
                  <div className="text-xs text-white/40">Feedback</div>
                </div>
                <div className="card p-4 text-center">
                  <Heart className="w-5 h-5 text-red-400 mx-auto mb-1" />
                  <div className="text-2xl font-bold">{encouragement?.length || 0}</div>
                  <div className="text-xs text-white/40">Encouragement</div>
                </div>
              </div>

              {/* Trends */}
              {trends && trends.length > 0 && (
                <div className="card p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-yellow-400" />
                    Subject Performance
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {trends.map((t, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-white/5 rounded">
                        <span className="font-medium">{t.subject}</span>
                        <span className="flex items-center gap-1 text-sm">
                          {getTrendIcon(t.trend)} {t.trend}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Items */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-400" />
                    Recent Report Cards
                  </h3>
                  {reportCards?.length > 0 ? (
                    reportCards.slice(0, 3).map((rc) => (
                      <div key={rc.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <div>
                          <div className="font-medium">{rc.title}</div>
                          <div className="text-xs text-white/40">
                            {rc.subject || 'General'} • {new Date(rc.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <button onClick={() => viewReportCard(rc)} className="text-brand-400 hover:text-brand-300">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-white/40 text-sm">No report cards yet</p>
                  )}
                </div>

                <div className="card p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-400" />
                    Recent Feedback
                  </h3>
                  {feedback?.length > 0 ? (
                    feedback.slice(0, 3).map((fb) => (
                      <div key={fb.id} className="py-2 border-b border-white/5 last:border-0">
                        <div className="font-medium">{fb.subject || 'General'}</div>
                        <div className="text-sm text-white/60 line-clamp-2">{fb.content}</div>
                        <div className="text-xs text-white/40 mt-1">
                          {fb.teacher_name} • {new Date(fb.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-white/40 text-sm">No feedback yet</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Report Cards Tab - unchanged */}
          {selectedTab === 'report-cards' && (
            <div className="space-y-4">
              {reportCards?.length > 0 ? (
                reportCards.map((rc) => (
                  <div key={rc.id} className="card p-4 flex items-center justify-between hover:border-white/20 transition">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <File className="w-5 h-5 text-brand-400" />
                        <div>
                          <h4 className="font-semibold">{rc.title}</h4>
                          <p className="text-sm text-white/60 line-clamp-1">{rc.description || 'No description'}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-white/40">
                            <span>{rc.subject || 'General'}</span>
                            <span>•</span>
                            <span>{new Date(rc.created_at).toLocaleDateString()}</span>
                            {rc.grade && (
                              <>
                                <span>•</span>
                                <span className="text-yellow-400 font-semibold">Grade: {rc.grade}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => viewReportCard(rc)} className="btn-secondary text-sm flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      {rc.file_url && (
                        <button onClick={() => downloadReportCard(rc.file_url)} className="btn-primary text-sm flex items-center gap-1">
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="card p-12 text-center text-white/40">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium text-white/60">No Report Cards</p>
                  <p className="text-sm">Report cards will appear here when uploaded by teachers.</p>
                </div>
              )}
            </div>
          )}

          {/* Assignments Tab - unchanged */}
          {selectedTab === 'assignments' && (
            <div className="space-y-4">
              {assignments?.length > 0 ? (
                assignments.map((assignment) => (
                  <div key={assignment.id} className="card p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <BookOpen className="w-5 h-5 text-blue-400" />
                          <div>
                            <h4 className="font-semibold">{assignment.title}</h4>
                            <p className="text-sm text-white/60 mt-1">{assignment.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No due date'}
                              </span>
                              {assignment.teacher_name && (
                                <>
                                  <span>•</span>
                                  <span>Teacher: {assignment.teacher_name}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        {assignment.due_date && getStatusBadge(assignment.due_date)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="card p-12 text-center text-white/40">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium text-white/60">No Assignments</p>
                  <p className="text-sm">Assignments will appear here when created by teachers.</p>
                </div>
              )}
            </div>
          )}

          {/* Feedback Tab - unchanged */}
          {selectedTab === 'feedback' && (
            <div className="space-y-4">
              {feedback?.length > 0 ? (
                feedback.map((fb) => (
                  <div key={fb.id} className="card p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{fb.subject || 'General Feedback'}</h4>
                          {fb.grade && (
                            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                              Grade: {fb.grade}
                            </span>
                          )}
                        </div>
                        <p className="text-white/80 mt-1">{fb.content}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                          <span>From: {fb.teacher_name || 'Teacher'}</span>
                          <span>•</span>
                          <span>{new Date(fb.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="card p-12 text-center text-white/40">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium text-white/60">No Feedback</p>
                  <p className="text-sm">Feedback from teachers will appear here.</p>
                </div>
              )}
            </div>
          )}

          {/* Encouragement Tab - unchanged */}
          {selectedTab === 'encouragement' && (
            <div className="space-y-4">
              <div className="card p-4">
                <form onSubmit={sendEncouragement} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    className="flex-1 input"
                    placeholder="Write an encouragement message..."
                    value={encouragementText}
                    onChange={(e) => setEncouragementText(e.target.value)}
                    disabled={sendingEncouragement}
                  />
                  <button 
                    type="submit" 
                    disabled={sendingEncouragement || !encouragementText.trim()} 
                    className="btn-primary px-4"
                  >
                    {sendingEncouragement ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </form>

                {encouragement?.length > 0 ? (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {encouragement.map((e) => (
                      <div key={e.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                          <Heart className="w-4 h-4 text-red-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{e.sender_name}</span>
                            <span className="text-xs text-white/40">
                              {new Date(e.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-white/80">{e.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-white/40 py-8">
                    <Heart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No encouragement messages yet.</p>
                    <p className="text-sm">Be the first to send encouragement!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Messages Tab */}
          {selectedTab === 'messages' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">💬 Messages</h2>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="btn-primary text-sm flex items-center gap-1"
                >
                  <Plus size={16} />
                  New Chat
                </button>
              </div>

              <div className="card p-4">
                {conversations.length === 0 ? (
                  <div className="text-center text-white/40 py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium text-white/60">No conversations yet</p>
                    <p className="text-sm">Start a new chat with a teacher or parent.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="border-r border-white/10 pr-3 space-y-2 max-h-96 overflow-y-auto">
                      {conversations.map(conv => (
                        <button
                          key={`conv-${conv.id}`}
                          onClick={() => setSelectedConversation(conv)}
                          className={`w-full text-left p-2 rounded-lg transition ${
                            selectedConversation?.id === conv.id ? 'bg-brand-500/20 border border-brand-500/30' : 'hover:bg-white/5'
                          }`}
                        >
                          <p className="font-medium">{conv.partnerName}</p>
                          <p className="text-xs text-white/40 truncate">{conv.last_message || 'No messages yet'}</p>
                          {conv.unread_count > 0 && (
                            <span className="text-xs text-brand-400">({conv.unread_count} unread)</span>
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="md:col-span-2 flex flex-col h-96">
                      {selectedConversation ? (
                        <>
                          <div className="flex-1 overflow-y-auto mb-3 space-y-2 p-2 border border-white/10 rounded-lg">
                            {messages.length === 0 && <p className="text-white/40 text-center">No messages yet. Send a message to start a conversation.</p>}
                            {messages.map(msg => (
                              <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] p-2 rounded-lg ${msg.sender_id === user?.id ? 'bg-brand-500/30 text-white' : 'bg-white/10 text-white'}`}>
                                  <p className="text-xs text-white/60">{msg.sender_name} ({msg.sender_role})</p>
                                  <p className="text-sm">{msg.content}</p>
                                  <p className="text-xs text-white/40 text-right">{new Date(msg.created_at).toLocaleString()}</p>
                                </div>
                              </div>
                            ))}
                            <div ref={messagesEndRef} />
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              className="flex-1 input"
                              placeholder="Type a message..."
                              value={messageText}
                              onChange={(e) => setMessageText(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            />
                            <button onClick={sendMessage} disabled={sending} className="btn-primary">
                              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center text-white/40 mt-32">Select a conversation to start messaging.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modals */}
          {showSettingsModal && <SettingsModal />}
          {showNewChatModal && <NewChatModal />}
          {studentProgress && selectedStudent && <ProgressModal />}

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

                <button className="mt-4 w-full btn-secondary" onClick={() => setShowReportCardModal(false)}>
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