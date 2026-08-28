// frontend/src/pages/StudySpherePage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import {
  Calendar, Clock, BookOpen, FileText, Megaphone, Loader2,
  Home, Users, GraduationCap, ClipboardList, Notebook, ArrowRight,
  CheckCircle, Circle, AlertCircle, TrendingUp, Star,
  ChevronLeft, ChevronRight, MapPin, User, Repeat
} from 'lucide-react';

export default function StudySpherePage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  
  // Timetable state
  const [timetableView, setTimetableView] = useState('today'); // today, week, month
  const [timetableDate, setTimetableDate] = useState(new Date());
  const [timetableEntries, setTimetableEntries] = useState([]);
  const [loadingTimetable, setLoadingTimetable] = useState(false);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Load all data
  useEffect(() => {
    loadData();
  }, []);

  // Load timetable when date or view changes
  useEffect(() => {
    if (activeTab === 'timetable') {
      fetchTimetable();
    }
  }, [timetableDate, timetableView, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sphereData, subjectsData] = await Promise.all([
        api.getStudentStudySphere(),
        api.getStudentSubjects ? api.getStudentSubjects() : Promise.resolve({ subjects: [] })
      ]);
      setData(sphereData);
      setSubjects(subjectsData.subjects || []);
      
      // Set initial timetable entries if available
      if (sphereData.timetable) {
        setTimetableEntries(sphereData.timetable);
      }
    } catch (err) {
      console.error('Error loading StudySphere:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimetable = async () => {
    setLoadingTimetable(true);
    try {
      let url = '';
      const dateStr = timetableDate.toISOString().split('T')[0];
      
      if (timetableView === 'today') {
        url = `/timetable/my/day/${dateStr}`;
      } else if (timetableView === 'week') {
        const start = new Date(timetableDate);
        const day = start.getDay() || 7;
        start.setDate(start.getDate() - day + 1);
        const startStr = start.toISOString().split('T')[0];
        url = `/timetable/my/week/${startStr}`;
      } else {
        const year = timetableDate.getFullYear();
        const month = timetableDate.getMonth() + 1;
        url = `/timetable/my/month/${year}/${month}`;
      }
      
      const res = await api.get(url);
      setTimetableEntries(res);
    } catch (err) {
      console.error('Error fetching timetable:', err);
      // Fallback to existing data
      if (data?.timetable) {
        setTimetableEntries(data.timetable);
      }
    } finally {
      setLoadingTimetable(false);
    }
  };

  const changeTimetableDate = (days) => {
    const newDate = new Date(timetableDate);
    if (timetableView === 'today') newDate.setDate(newDate.getDate() + days);
    else if (timetableView === 'week') newDate.setDate(newDate.getDate() + days * 7);
    else newDate.setMonth(newDate.getMonth() + days);
    setTimetableDate(newDate);
  };

  const getTodayEntries = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return timetableEntries.filter(t => t.day_of_week === today);
  };

  const getWeekEntries = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    // Group by day
    const grouped = {};
    days.forEach(day => {
      grouped[day] = timetableEntries.filter(t => t.day_of_week === day);
    });
    return grouped;
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-400" size={40} /></div>;
  if (!data) return <div className="p-6 text-center text-white/60">No study data available.</div>;

  const { resources, announcements, assignments = [] } = data;
  const todayEntries = getTodayEntries();

  // ----- Sidebar navigation items -----
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'timetable', label: 'Timetable', icon: Calendar },
    { id: 'subjects', label: 'My Subjects', icon: BookOpen },
    { id: 'resources', label: 'Materials', icon: FileText },
    { id: 'assignments', label: 'Assignments', icon: ClipboardList },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'studyspace', label: 'StudySpace', icon: Notebook },
  ];

  // ----- Render functions for each tab -----

  // Home tab
  const renderHome = () => (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.full_name || 'Student'} 👋</h2>
        <p className="text-white/60">Your learning space. Everything you need, organized in one place.</p>
      </div>

      {/* Today's Classes */}
      <div className="card p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar size={18} className="text-brand-400" />
            Today's Classes
          </h3>
          <button 
            onClick={() => { setActiveTab('timetable'); setTimetableView('today'); }}
            className="text-sm text-brand-400 hover:underline"
          >
            View Full Timetable →
          </button>
        </div>
        {todayEntries.length === 0 ? (
          <p className="text-white/40">No classes scheduled for today. Enjoy your free time! 🎉</p>
        ) : (
          <div className="space-y-2">
            {todayEntries.map((t, index) => (
              <div key={t.id || index} className="flex flex-wrap items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition">
                <div className="min-w-[60px] text-sm font-medium text-brand-400">
                  {t.start_time?.slice(0,5) || '--:--'}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{t.subject || t.course_name || 'Class'}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-white/40">
                    {t.teacher_name && <span className="flex items-center gap-1"><User size={12} /> {t.teacher_name}</span>}
                    {t.room_name && <span className="flex items-center gap-1"><MapPin size={12} /> {t.room_name}</span>}
                    {t.end_time && <span className="flex items-center gap-1"><Clock size={12} /> until {t.end_time?.slice(0,5)}</span>}
                  </div>
                </div>
                <span className="px-2 py-1 bg-brand-500/20 text-brand-400 rounded-full text-xs">
                  {t.is_recurring ? '🔄 Recurring' : '📅 Once'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Continue Learning */}
      <div className="card p-4">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <TrendingUp size={18} className="text-green-400" />
          Continue Learning
        </h3>
        {subjects.length === 0 ? (
          <p className="text-white/40">No subjects yet. Check back after your institution assigns courses.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {subjects.slice(0, 4).map(s => (
              <Link key={s.id} to={`/studysphere/subject/${s.id}`} className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition flex items-center justify-between group">
                <div>
                  <span className="font-medium">{s.name}</span>
                  <p className="text-xs text-white/40">{s.code || 'Course'}</p>
                </div>
                <ArrowRight size={16} className="text-white/30 group-hover:text-brand-400 transition" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-brand-400">{subjects.length}</p>
          <p className="text-xs text-white/40">Subjects</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-green-400">{resources.length}</p>
          <p className="text-xs text-white/40">Resources</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-yellow-400">{assignments.length || 0}</p>
          <p className="text-xs text-white/40">Assignments</p>
        </div>
      </div>

      {/* Upcoming Assignments */}
      <div className="card p-4">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <ClipboardList size={18} className="text-purple-400" />
          Upcoming Assignments
        </h3>
        {assignments.length === 0 ? (
          <p className="text-white/40">No upcoming assignments. Great job staying on track! 🎯</p>
        ) : (
          <div className="space-y-2">
            {assignments.slice(0, 3).map(a => (
              <div key={a.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-sm text-white/40">{a.subject} • Due: {new Date(a.due_date).toLocaleDateString()}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  a.status === 'Not Started' ? 'bg-red-500/20 text-red-400' :
                  a.status === 'In Progress' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {a.status || 'Pending'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Materials */}
      <div className="card p-4">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <FileText size={18} className="text-blue-400" />
          Recent Materials
        </h3>
        {resources.length === 0 ? (
          <p className="text-white/40">No materials available yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {resources.slice(0, 4).map(r => (
              <div key={r.id} className="p-2 bg-white/5 rounded-lg flex items-center gap-3">
                <FileText size={16} className="text-brand-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{r.title}</p>
                  <p className="text-xs text-white/40">{r.resource_type}</p>
                </div>
                {r.file_url && (
                  <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline text-xs flex-shrink-0">
                    Open
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/momentum" className="card p-4 text-center hover:border-brand-400/30 transition">
          <Users className="w-6 h-6 text-brand-400 mx-auto mb-1" />
          <p className="text-sm font-medium">Study Groups</p>
          <p className="text-xs text-white/40">Connect with peers</p>
        </Link>
        <Link to="/orbit" className="card p-4 text-center hover:border-brand-400/30 transition">
          <RocketIcon className="w-6 h-6 text-purple-400 mx-auto mb-1" />
          <p className="text-sm font-medium">Orbit Learning</p>
          <p className="text-xs text-white/40">AI-powered practice</p>
        </Link>
      </div>
    </div>
  );

  // Timetable tab with today/week/month views
  const renderTimetable = () => {
    const weekEntries = getWeekEntries();
    const dateStr = timetableDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });

    const getWeekRange = () => {
      const start = new Date(timetableDate);
      const day = start.getDay() || 7;
      start.setDate(start.getDate() - day + 1);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    };

    return (
      <div>
        <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
          <h2 className="text-xl font-semibold">📅 My Timetable</h2>
          <div className="flex flex-wrap gap-2">
            <div className="flex bg-white/5 rounded-lg p-1">
              <button 
                onClick={() => setTimetableView('today')}
                className={`px-3 py-1 text-sm rounded-lg transition ${timetableView === 'today' ? 'bg-brand-500 text-white' : 'hover:bg-white/10'}`}
              >
                Today
              </button>
              <button 
                onClick={() => setTimetableView('week')}
                className={`px-3 py-1 text-sm rounded-lg transition ${timetableView === 'week' ? 'bg-brand-500 text-white' : 'hover:bg-white/10'}`}
              >
                Week
              </button>
              <button 
                onClick={() => setTimetableView('month')}
                className={`px-3 py-1 text-sm rounded-lg transition ${timetableView === 'month' ? 'bg-brand-500 text-white' : 'hover:bg-white/10'}`}
              >
                Month
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => changeTimetableDate(-1)}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-medium">
            {timetableView === 'today' && dateStr}
            {timetableView === 'week' && getWeekRange()}
            {timetableView === 'month' && timetableDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button 
            onClick={() => changeTimetableDate(1)}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {loadingTimetable ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-brand-400" size={32} /></div>
        ) : (
          <>
            {timetableView === 'today' && (
              <div className="space-y-3">
                {todayEntries.length === 0 ? (
                  <div className="card p-8 text-center text-white/40">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No classes today</p>
                    <p className="text-sm">Enjoy your free time or catch up on studies! 📚</p>
                  </div>
                ) : (
                  todayEntries.map((t, index) => (
                    <div key={t.id || index} className="card p-4 hover:border-white/20 transition">
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="min-w-[70px]">
                          <p className="text-lg font-bold text-brand-400">{t.start_time?.slice(0,5)}</p>
                          <p className="text-xs text-white/40">to {t.end_time?.slice(0,5)}</p>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-lg">{t.subject || t.course_name}</p>
                          <div className="flex flex-wrap gap-4 text-sm text-white/60">
                            <span className="flex items-center gap-1"><User size={14} /> {t.teacher_name || 'TBD'}</span>
                            <span className="flex items-center gap-1"><MapPin size={14} /> {t.room_name || 'TBD'}</span>
                            {t.is_recurring && <span className="flex items-center gap-1"><Repeat size={14} /> Weekly</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs ${t.is_recurring ? 'bg-brand-500/20 text-brand-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {t.is_recurring ? 'Recurring' : 'Once'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {timetableView === 'week' && (
              <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                {days.map(day => {
                  const entries = weekEntries[day] || [];
                  return (
                    <div key={day} className={`card p-3 ${day === new Date().toLocaleDateString('en-US', { weekday: 'long' }) ? 'border-brand-400/50' : ''}`}>
                      <h4 className={`font-semibold text-sm mb-2 ${day === new Date().toLocaleDateString('en-US', { weekday: 'long' }) ? 'text-brand-400' : 'text-white/60'}`}>
                        {day.slice(0, 3)}
                        {day === new Date().toLocaleDateString('en-US', { weekday: 'long' }) && ' 🎯'}
                      </h4>
                      {entries.length === 0 ? (
                        <p className="text-xs text-white/20">—</p>
                      ) : (
                        <div className="space-y-2">
                          {entries.map((t, i) => (
                            <div key={t.id || i} className="bg-white/5 p-2 rounded-lg text-xs">
                              <p className="font-medium text-brand-400">{t.start_time?.slice(0,5)}</p>
                              <p className="font-medium truncate">{t.subject || t.course_name}</p>
                              <p className="text-white/40 truncate">{t.room_name || '—'}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {timetableView === 'month' && (
              <div className="card p-4">
                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                    <div key={d} className="font-semibold text-white/40 py-2">{d}</div>
                  ))}
                  {Array.from({ length: new Date(timetableDate.getFullYear(), timetableDate.getMonth(), 1).getDay() || 7 }, (_, i) => (
                    <div key={`empty-${i}`} className="py-2 text-white/10">—</div>
                  ))}
                  {Array.from({ length: new Date(timetableDate.getFullYear(), timetableDate.getMonth() + 1, 0).getDate() }, (_, i) => {
                    const dayNum = i + 1;
                    const date = new Date(timetableDate.getFullYear(), timetableDate.getMonth(), dayNum);
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                    const entries = timetableEntries.filter(t => t.day_of_week === dayName);
                    const isToday = date.toDateString() === new Date().toDateString();
                    return (
                      <div key={dayNum} className={`p-2 rounded-lg ${isToday ? 'bg-brand-500/20 border border-brand-400/30' : 'hover:bg-white/5'} transition`}>
                        <p className={`font-medium ${isToday ? 'text-brand-400' : 'text-white/80'}`}>{dayNum}</p>
                        {entries.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {entries.slice(0, 2).map((t, idx) => (
                              <div key={idx} className="text-[10px] bg-brand-500/20 text-brand-400 rounded px-1 truncate">
                                {t.start_time?.slice(0,5)} {t.subject}
                              </div>
                            ))}
                            {entries.length > 2 && (
                              <div className="text-[10px] text-white/40">+{entries.length - 2} more</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // Subjects tab
  const renderSubjects = () => (
    <div>
      <h2 className="text-xl font-semibold mb-4">📚 My Subjects</h2>
      {subjects.length === 0 ? (
        <div className="card p-8 text-center text-white/40">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No subjects yet</p>
          <p className="text-sm">You haven't been enrolled in any subjects.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map(s => (
            <Link key={s.id} to={`/studysphere/subject/${s.id}`} className="card p-4 hover:border-white/20 transition group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{s.name}</h3>
                  {s.code && <p className="text-sm text-white/40">{s.code}</p>}
                  {s.description && <p className="text-sm text-white/60 mt-1 line-clamp-2">{s.description}</p>}
                </div>
                <ArrowRight size={16} className="text-white/30 group-hover:text-brand-400 transition flex-shrink-0 mt-1" />
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-white/40">
                <span className="px-2 py-0.5 bg-brand-500/20 text-brand-400 rounded">Active</span>
                {s.progress && <span>Progress: {s.progress}%</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  // Resources tab
  const renderResources = () => (
    <div>
      <h2 className="text-xl font-semibold mb-4">📄 Learning Materials</h2>
      {resources.length === 0 ? (
        <div className="card p-8 text-center text-white/40">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No materials yet</p>
          <p className="text-sm">Your institution will upload resources soon.</p>
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
                  {r.description && <p className="text-sm text-white/60 line-clamp-2">{r.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                    <span className="capitalize px-2 py-0.5 bg-white/5 rounded">{r.resource_type}</span>
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
  );

  // Assignments tab
  const renderAssignments = () => {
    const getStatusIcon = (status) => {
      if (status === 'Completed' || status === 'Submitted') return <CheckCircle size={16} className="text-green-400" />;
      if (status === 'In Progress' || status === 'In Progress') return <AlertCircle size={16} className="text-yellow-400" />;
      return <Circle size={16} className="text-red-400" />;
    };

    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">📝 Assignments</h2>
          <span className="text-sm text-white/40">{assignments.length} total</span>
        </div>
        {assignments.length === 0 ? (
          <div className="card p-8 text-center text-white/40">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No assignments yet</p>
            <p className="text-sm">Check back later for new assignments from your teachers.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map(a => (
              <div key={a.id} className="card p-4 hover:border-white/20 transition">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(a.status)}
                      <h4 className="font-semibold">{a.title}</h4>
                    </div>
                    <p className="text-sm text-white/60 mt-1">{a.description || 'No description provided'}</p>
                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-white/40">
                      <span>Subject: {a.subject || 'General'}</span>
                      <span>Due: {new Date(a.due_date).toLocaleDateString()}</span>
                      {a.submitted_at && <span className="text-green-400">Submitted: {new Date(a.submitted_at).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      a.status === 'Completed' || a.status === 'Submitted' ? 'bg-green-500/20 text-green-400' :
                      a.status === 'In Progress' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {a.status || 'Not Started'}
                    </span>
                    {a.grade !== undefined && (
                      <p className="text-sm font-bold text-brand-400 mt-1">Grade: {a.grade}%</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Announcements tab
  const renderAnnouncements = () => (
    <div>
      <h2 className="text-xl font-semibold mb-4">📢 Academic Announcements</h2>
      {announcements.length === 0 ? (
        <div className="card p-8 text-center text-white/40">
          <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No announcements yet</p>
          <p className="text-sm">Stay tuned for updates from your institution.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map(a => (
            <div key={a.id} className="card p-4 border-l-4 border-brand-500">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{a.title}</h4>
                  <p className="text-sm text-white/70 mt-1 whitespace-pre-wrap">{a.content}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-white/40">
                    <span>📅 {new Date(a.created_at).toLocaleDateString()}</span>
                    <span>·</span>
                    <span>👤 {a.author_name || 'Admin'}</span>
                    {a.target_roles && <span>· 🎯 For: {a.target_roles.join(', ')}</span>}
                  </div>
                </div>
                {a.is_priority && (
                  <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs flex-shrink-0 ml-2">
                    ⚡ Priority
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // StudySpace tab
  const renderStudySpace = () => (
    <div>
      <h2 className="text-xl font-semibold mb-4">📓 My StudySpace</h2>
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Notebook className="w-8 h-8 text-brand-400" />
          <div>
            <h3 className="font-semibold">Your Personal Study Workspace</h3>
            <p className="text-sm text-white/40">Organize your notes, highlights, and bookmarks.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 p-4 rounded-lg">
            <p className="text-sm font-medium text-brand-400">📝 Quick Notes</p>
            <p className="text-xs text-white/40 mt-1">Jot down ideas and key concepts.</p>
            <textarea 
              className="input w-full mt-2 text-sm" 
              rows="3" 
              placeholder="Write a quick note..."
            />
          </div>
          <div className="bg-white/5 p-4 rounded-lg">
            <p className="text-sm font-medium text-yellow-400">⭐ Highlights</p>
            <p className="text-xs text-white/40 mt-1">Save important passages from your materials.</p>
            <div className="mt-2 space-y-1">
              <p className="text-xs text-white/60 border-l-2 border-yellow-400 pl-2">"Key concept: The mitochondria is the powerhouse of the cell."</p>
              <p className="text-xs text-white/60 border-l-2 border-yellow-400 pl-2">"Important formula: E = mc²"</p>
            </div>
          </div>
          <div className="bg-white/5 p-4 rounded-lg">
            <p className="text-sm font-medium text-green-400">🔖 Bookmarks</p>
            <p className="text-xs text-white/40 mt-1">Quick access to important resources.</p>
            <div className="mt-2 space-y-1">
              <p className="text-xs text-brand-400 hover:underline cursor-pointer">📄 Chapter 4 Study Guide</p>
              <p className="text-xs text-brand-400 hover:underline cursor-pointer">🎥 Video: Introduction to Genetics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ----- Main render -----
  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 max-w-7xl mx-auto">
      {/* Sidebar (desktop) */}
      <aside className="md:w-56 flex-shrink-0">
        <div className="sticky top-6 space-y-1">
          <h2 className="text-xl font-bold mb-4 px-3">📚 StudySphere</h2>
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-left ${
                  activeTab === item.id
                    ? 'bg-brand-500/20 text-brand-400 font-medium'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={18} />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'timetable' && renderTimetable()}
        {activeTab === 'subjects' && renderSubjects()}
        {activeTab === 'resources' && renderResources()}
        {activeTab === 'assignments' && renderAssignments()}
        {activeTab === 'announcements' && renderAnnouncements()}
        {activeTab === 'studyspace' && renderStudySpace()}
      </main>
    </div>
  );
}

// Helper icon component
const RocketIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);