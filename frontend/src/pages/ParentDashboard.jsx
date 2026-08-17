// frontend/src/pages/ParentDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { 
  Loader2, User, BookOpen, FileText, MessageCircle, 
  TrendingUp, TrendingDown, Minus, Heart, Bell, Send, 
  ChevronRight, Download, Eye, Calendar, Award, 
  File, CheckCircle, Clock, AlertCircle
} from 'lucide-react';
import PageBackground from '../components/PageBackground';
import { Link } from 'react-router-dom';

export default function ParentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [encouragementText, setEncouragementText] = useState('');
  const [sendingEncouragement, setSendingEncouragement] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedReportCard, setSelectedReportCard] = useState(null);
  const [showReportCardModal, setShowReportCardModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // First, get the child using the same API that Bridge page uses
      const child = await api.getBridgeChild();
      console.log('Child data from getBridgeChild:', child);
      
      if (child && child.id) {
        console.log('Child found:', child.full_name);
        
        // Child exists, now get all the progress data
        try {
          const progressData = await api.getParentChildProgress();
          console.log('Progress data:', progressData);
          
          // If progressData has student, use it, otherwise construct it
          if (progressData && progressData.student) {
            setData(progressData);
          } else {
            // Construct data with the child we fetched
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
          console.error('Error fetching progress:', progressErr);
          // Still show the child even if progress fails
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
        console.log('No child linked');
        // No child linked
        setData({ 
          student: null, 
          assignments: [], 
          feedback: [], 
          reportCards: [], 
          encouragement: [], 
          trends: [] 
        });
      }
      
      // Fetch notifications
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
    <PageBackground imageUrl="/parent-bg.jpg">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold">👨‍👩‍👧 Parent Dashboard</h1>
            <p className="text-white/40">Support your child's academic journey</p>
          </div>
          <div className="relative">
            <Bell className="text-white/60 hover:text-white cursor-pointer" size={24} />
            {notifications.some(n => !n.is_read) && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
            )}
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

        {/* Rest of the component remains the same... */}
        {/* (Keep all the tab content from the previous version) */}
      </div>
    </PageBackground>
  );
}