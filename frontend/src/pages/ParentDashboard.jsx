// frontend/src/pages/ParentDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Loader2, User, BookOpen, FileText, MessageCircle, TrendingUp, TrendingDown, Minus, Heart, Bell, Send, ChevronRight } from 'lucide-react';
import PageBackground from '../components/PageBackground';
import { Link } from 'react-router-dom';

export default function ParentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [encouragementText, setEncouragementText] = useState('');
  const [sendingEncouragement, setSendingEncouragement] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // ✅ Use the new endpoint
      const progressData = await api.getParentChildProgress();
      console.log('Parent child progress data:', progressData);
      setData(progressData);
      // Also fetch notifications
      const notifData = await api.getNotifications();
      setNotifications(notifData);
    } catch (err) {
      console.error(err);
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
      // Refresh encouragement wall
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

  if (loading) {
    return (
      <PageBackground imageUrl="/parent-bg.jpg">
        <div className="p-6 flex justify-center items-center h-64"><Loader2 className="animate-spin text-brand-400" size={40} /></div>
      </PageBackground>
    );
  }

  if (!data || !data.student) {
    return (
      <PageBackground imageUrl="/parent-bg.jpg">
        <div className="p-6 max-w-4xl mx-auto text-center py-16">
          <h2 className="text-2xl font-bold mb-2">No child linked</h2>
          <p className="text-white/40">Connect with your child using their connection code.</p>
          <Link to="/bridge" className="mt-4 inline-block btn-primary">Go to Bridge</Link>
        </div>
      </PageBackground>
    );
  }

  const { student, assignments, feedback, reportCards, encouragement, trends } = data;

  return (
    <PageBackground imageUrl="/parent-bg.jpg">
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold">👨‍👩‍👧 Bridge</h1>
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
        <div className="card p-5 mb-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-white text-xl font-bold">
            {(student.full_name?.[0] || 'S').toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{student.full_name}</h2>
            <p className="text-white/40">Level {student.level} • {student.xp} XP</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm text-white/40">Streak</p>
            <p className="text-amber-400">🔥 {student.streak_days || 0} days</p>
          </div>
        </div>

        {/* Trends */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {trends.map((t, i) => (
            <div key={i} className="card p-3 flex items-center justify-between">
              <span className="font-medium">{t.subject}</span>
              <span className="flex items-center gap-1">{getTrendIcon(t.trend)} {t.trend}</span>
            </div>
          ))}
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column: Assignments & Feedback */}
          <div className="space-y-6">
            <div className="card p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2"><BookOpen size={18} className="text-brand-400" /> Recent Assignments</h3>
              {assignments.length === 0 ? (
                <p className="text-white/40 text-sm">No assignments yet.</p>
              ) : (
                <ul className="space-y-2">
                  {assignments.map(a => (
                    <li key={a.id} className="flex justify-between text-sm border-b border-white/5 pb-1">
                      <span>{a.title}</span>
                      <span className="text-white/40 capitalize">{a.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2"><MessageCircle size={18} className="text-cyan-400" /> Teacher Feedback</h3>
              {feedback.length === 0 ? (
                <p className="text-white/40 text-sm">No feedback yet.</p>
              ) : (
                <ul className="space-y-2">
                  {feedback.map(f => (
                    <li key={f.id} className="text-sm border-b border-white/5 pb-1">
                      <p><span className="font-medium">{f.subject}</span>: {f.content}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Right column: Report Cards & Encouragement */}
          <div className="space-y-6">
            <div className="card p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2"><FileText size={18} className="text-green-400" /> Report Cards</h3>
              {reportCards.length === 0 ? (
                <p className="text-white/40 text-sm">No report cards uploaded.</p>
              ) : (
                <ul className="space-y-2">
                  {reportCards.map(r => (
                    <li key={r.id} className="flex justify-between text-sm border-b border-white/5 pb-1">
                      <span>{r.title}</span>
                      <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline text-xs">View</a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2"><Heart size={18} className="text-red-400" /> Encouragement Wall</h3>
              {encouragement.length === 0 ? (
                <p className="text-white/40 text-sm">No messages yet. Send one below!</p>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {encouragement.map(e => (
                    <div key={e.id} className="text-sm border-b border-white/5 pb-1">
                      <p><span className="font-medium">{e.sender_name}</span>: {e.content}</p>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={sendEncouragement} className="mt-3 flex gap-2">
                <input
                  type="text"
                  className="flex-1 input text-sm"
                  placeholder="Send encouragement..."
                  value={encouragementText}
                  onChange={(e) => setEncouragementText(e.target.value)}
                  disabled={sendingEncouragement}
                />
                <button type="submit" disabled={sendingEncouragement} className="btn-primary px-3">
                  {sendingEncouragement ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </PageBackground>
  );
}