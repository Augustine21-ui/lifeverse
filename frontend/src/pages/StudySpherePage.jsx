// frontend/src/pages/StudySpherePage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Calendar, Clock, BookOpen, FileText, Megaphone, Loader2, Plus } from 'lucide-react';

export default function StudySpherePage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timetable');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getStudentStudySphere();
      setData(res);
    } catch (err) {
      console.error('Error loading StudySphere:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-400" size={40} /></div>;
  if (!data) return <div className="p-6 text-center text-white/60">No study data available.</div>;

  const { timetable, resources, announcements } = data;

  // Group timetable by day
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timetableByDay = {};
  days.forEach(day => { timetableByDay[day] = timetable.filter(t => t.day_of_week === day); });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">📚 StudySphere</h1>
          <p className="text-white/60">Personalized learning hub with AI-powered resources</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/40">{user?.full_name || user?.username}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 mb-6 overflow-x-auto">
        {['timetable', 'resources', 'announcements'].map(tab => (
          <button
            key={tab}
            className={`px-4 py-2 capitalize transition whitespace-nowrap ${activeTab === tab ? 'border-b-2 border-brand-500 text-white' : 'text-white/40 hover:text-white'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'timetable' && '📅 Timetable'}
            {tab === 'resources' && '📄 Resources'}
            {tab === 'announcements' && '📢 Announcements'}
          </button>
        ))}
      </div>

      {/* ============ TIMETABLE TAB ============ */}
      {activeTab === 'timetable' && (
        <div>
          {timetable.length === 0 ? (
            <div className="card p-8 text-center text-white/40">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No timetable yet</p>
              <p className="text-sm">Your institution will upload a timetable soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {days.map(day => {
                const entries = timetableByDay[day] || [];
                if (entries.length === 0) return null;
                return (
                  <div key={day} className="card p-4 hover:border-white/20 transition">
                    <h3 className="font-semibold text-brand-400 mb-3 flex items-center gap-2">
                      <Calendar size={16} />
                      {day}
                    </h3>
                    <div className="space-y-2">
                      {entries.map(t => (
                        <div key={t.id} className="flex items-start gap-3 p-2 bg-white/5 rounded-lg">
                          <div className="min-w-[60px] text-sm text-white/60">
                            {t.start_time?.slice(0,5)}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{t.subject}</p>
                            <div className="flex flex-wrap gap-3 text-xs text-white/40">
                              {t.teacher_name && <span>👨‍🏫 {t.teacher_name}</span>}
                              {t.room && <span>📍 {t.room}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============ RESOURCES TAB ============ */}
      {activeTab === 'resources' && (
        <div>
          {resources.length === 0 ? (
            <div className="card p-8 text-center text-white/40">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No resources yet</p>
              <p className="text-sm">Check back later – your institution will upload materials.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resources.map(r => (
                <div key={r.id} className="card p-4 hover:border-white/20 transition">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                      <FileText size={18} className="text-brand-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{r.title}</h4>
                      <p className="text-sm text-white/60 line-clamp-2">{r.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                        <span className="capitalize">{r.resource_type}</span>
                        <span>·</span>
                        <span>{new Date(r.created_at).toLocaleDateString()}</span>
                        {r.file_url && (
                          <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline">
                            Open →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============ ANNOUNCEMENTS TAB ============ */}
      {activeTab === 'announcements' && (
        <div>
          {announcements.length === 0 ? (
            <div className="card p-8 text-center text-white/40">
              <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No announcements yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map(a => (
                <div key={a.id} className="card p-4 border-l-4 border-brand-500">
                  <h4 className="font-semibold">{a.title}</h4>
                  <p className="text-sm text-white/70 mt-1">{a.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                    <span>{new Date(a.created_at).toLocaleDateString()}</span>
                    <span>·</span>
                    <span>Target: {a.target_roles?.join(', ') || 'All'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}