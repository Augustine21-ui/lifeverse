// frontend/src/pages/ParentDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { 
  Loader2, User, BookOpen, FileText, MessageCircle, 
  TrendingUp, TrendingDown, Minus, Heart, Bell, Send, 
  ChevronRight, Download, Eye, Calendar, Award, 
  ExternalLink, File, CheckCircle, Clock, AlertCircle
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

  const { student, assignments, feedback, reportCards, encouragement, trends } = data;

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
            <p className="text-white/40">Level {student.level} • {student.xp} XP</p>
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

        {/* ===================== OVERVIEW TAB ===================== */}
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
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

            {/* Subject Trends */}
            {trends && trends.length > 0 && (
              <div className="card p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-400" />
                  Subject Performance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

            {/* Recent Activity */}
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
                      <button 
                        onClick={() => viewReportCard(rc)}
                        className="text-brand-400 hover:text-brand-300"
                      >
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

        {/* ===================== REPORT CARDS TAB ===================== */}
        {selectedTab === 'report-cards' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">📄 Report Cards</h2>
              <span className="text-sm text-white/40">{reportCards?.length || 0} total</span>
            </div>
            
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
                          {rc.uploaded_by_name && (
                            <>
                              <span>•</span>
                              <span>By: {rc.uploaded_by_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => viewReportCard(rc)}
                      className="btn-secondary text-sm flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    {rc.file_url && (
                      <button 
                        onClick={() => downloadReportCard(rc.file_url)}
                        className="btn-primary text-sm flex items-center gap-1"
                      >
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

        {/* ===================== ASSIGNMENTS TAB ===================== */}
        {selectedTab === 'assignments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">📚 Assignments</h2>
              <span className="text-sm text-white/40">{assignments?.length || 0} total</span>
            </div>
            
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
                              Due: {new Date(assignment.due_date).toLocaleDateString()}
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
                      {getStatusBadge(assignment.due_date)}
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

        {/* ===================== FEEDBACK TAB ===================== */}
        {selectedTab === 'feedback' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">💬 Teacher Feedback</h2>
              <span className="text-sm text-white/40">{feedback?.length || 0} total</span>
            </div>
            
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

        {/* ===================== ENCOURAGEMENT TAB ===================== */}
        {selectedTab === 'encouragement' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">❤️ Encouragement Wall</h2>
              <span className="text-sm text-white/40">{encouragement?.length || 0} messages</span>
            </div>
            
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
                <button type="submit" disabled={sendingEncouragement || !encouragementText.trim()} className="btn-primary px-4">
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
      </div>

      {/* ===================== REPORT CARD MODAL ===================== */}
      {showReportCardModal && selectedReportCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowReportCardModal(false)}>
          <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
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
    </PageBackground>
  );
}