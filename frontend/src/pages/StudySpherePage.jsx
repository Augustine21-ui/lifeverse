// frontend/src/pages/StudySpherePage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import {
  Calendar, Clock, BookOpen, FileText, Megaphone, Loader2,
  Home, Users, GraduationCap, ClipboardList, Notebook, ArrowRight,
  CheckCircle, Circle, AlertCircle, TrendingUp, Star
} from 'lucide-react';

export default function StudySpherePage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');

  // Load all data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sphereData, subjectsData] = await Promise.all([
        api.getStudentStudySphere(),
        api.getStudentSubjects ? api.getStudentSubjects() : Promise.resolve({ subjects: [] })
      ]);
      setData(sphereData);
      setSubjects(subjectsData.subjects || []);
    } catch (err) {
      console.error('Error loading StudySphere:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-400" size={40} /></div>;
  if (!data) return <div className="p-6 text-center text-white/60">No study data available.</div>;

  const { timetable, resources, announcements } = data;

  // ----- Helper: group timetable by day -----
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayEntries = timetable.filter(t => t.day_of_week === today);

  // ----- Helper: get recent resources (latest 4) -----
  const recentResources = resources.slice(0, 4);

  // ----- Helper: get upcoming assignments (mock for now) -----
  const upcomingAssignments = [
    { id: 1, subject: 'Mathematics', title: 'Quadratic Equations Worksheet', due: '2025-02-28', status: 'Not Started' },
    { id: 2, subject: 'Biology', title: 'Genetics Lab Report', due: '2025-03-05', status: 'In Progress' },
  ];

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
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Calendar size={18} className="text-brand-400" />
          Today's Classes
        </h3>
        {todayEntries.length === 0 ? (
          <p className="text-white/40">No classes scheduled for today.</p>
        ) : (
          <div className="space-y-2">
            {todayEntries.map(t => (
              <div key={t.id} className="flex flex-wrap items-center gap-4 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition cursor-pointer">
                <span className="text-sm text-white/60 w-16">{t.start_time?.slice(0,5)}</span>
                <span className="font-medium flex-1">{t.subject}</span>
                <span className="text-sm text-white/40">{t.room || '—'}</span>
                {t.teacher_name && <span className="text-sm text-white/40">👨‍🏫 {t.teacher_name}</span>}
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
          <p className="text-white/40">No subjects yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {subjects.slice(0, 4).map(s => (
              <Link key={s.id} to={`/studysphere/subject/${s.id}`} className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition flex items-center justify-between">
                <span>{s.name}</span>
                <ArrowRight size={16} className="text-brand-400" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Today's Learning */}
      <div className="card p-4 border-l-4 border-brand-500">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Star size={18} className="text-yellow-400" />
          Today's Learning
        </h3>
        {subjects.length > 0 ? (
          <>
            <p className="text-white/80 font-medium">{subjects[0].name}</p>
            <p className="text-sm text-white/60 mt-1">Today's topic: <span className="text-white">Getting started</span></p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="px-3 py-1 bg-brand-500/20 text-brand-400 rounded-full text-xs">Read Chapter 1</span>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Practice Quiz</span>
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">Watch Video</span>
            </div>
          </>
        ) : (
          <p className="text-white/40">No learning activities yet.</p>
        )}
      </div>

      {/* Upcoming Assignments */}
      <div className="card p-4">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <ClipboardList size={18} className="text-purple-400" />
          Upcoming Assignments
        </h3>
        {upcomingAssignments.length === 0 ? (
          <p className="text-white/40">No upcoming assignments.</p>
        ) : (
          <div className="space-y-2">
            {upcomingAssignments.map(a => (
              <div key={a.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                <div>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-sm text-white/40">{a.subject} • Due: {new Date(a.due).toLocaleDateString()}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  a.status === 'Not Started' ? 'bg-red-500/20 text-red-400' :
                  a.status === 'In Progress' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {a.status}
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
        {recentResources.length === 0 ? (
          <p className="text-white/40">No recent materials.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {recentResources.map(r => (
              <div key={r.id} className="p-2 bg-white/5 rounded-lg flex items-center gap-3">
                <FileText size={16} className="text-brand-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{r.title}</p>
                  <p className="text-xs text-white/40">{r.resource_type}</p>
                </div>
                {r.file_url && (
                  <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline text-xs">
                    Open
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Integration: Momentum & Challenges */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/momentum" className="card p-4 text-center hover:border-brand-400/30 transition">
          <Users className="w-6 h-6 text-brand-400 mx-auto mb-1" />
          <p className="text-sm font-medium">Connect with Study Groups</p>
          <p className="text-xs text-white/40">→ Momentum</p>
        </Link>
        <Link to="/challenges" className="card p-4 text-center hover:border-brand-400/30 transition">
          <ClipboardList className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
          <p className="text-sm font-medium">Test Yourself</p>
          <p className="text-xs text-white/40">→ Challenges</p>
        </Link>
      </div>
    </div>
  );

  // Timetable tab (existing)
  const renderTimetable = () => (
    <div>
      <h2 className="text-xl font-semibold mb-4">📅 My Timetable</h2>
      {timetable.length === 0 ? (
        <div className="card p-8 text-center text-white/40">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No timetable yet</p>
          <p className="text-sm">Your institution will upload a timetable soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {days.map(day => {
            const entries = timetable.filter(t => t.day_of_week === day);
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
                      <div className="min-w-[60px] text-sm text-white/60">{t.start_time?.slice(0,5)}</div>
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
  );

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
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{s.name}</h3>
                <ArrowRight size={16} className="text-white/30 group-hover:text-brand-400 transition" />
              </div>
              <p className="text-sm text-white/40 mt-1">Click to view details</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  // Resources tab (existing)
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
  );

  // Assignments tab
  const renderAssignments = () => (
    <div>
      <h2 className="text-xl font-semibold mb-4">📝 Assignments</h2>
      <div className="card p-8 text-center text-white/40">
        <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">Assignments feature coming soon</p>
        <p className="text-sm">Teachers will be able to create and manage assignments here.</p>
      </div>
    </div>
  );

  // Announcements tab (existing)
  const renderAnnouncements = () => (
    <div>
      <h2 className="text-xl font-semibold mb-4">📢 Academic Announcements</h2>
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
  );

  // StudySpace tab (placeholder)
  const renderStudySpace = () => (
    <div>
      <h2 className="text-xl font-semibold mb-4">📓 My StudySpace</h2>
      <div className="card p-8 text-center text-white/40">
        <Notebook className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">Your personal study workspace</p>
        <p className="text-sm">Soon you'll be able to take notes, highlight, and bookmark.</p>
        <div className="mt-4 p-4 bg-white/5 rounded-lg text-left max-w-sm mx-auto">
          <p className="text-xs text-white/60">💡 Quick Note</p>
          <p className="text-sm text-white/80 mt-1">Remember to review Chapter 4 before the test.</p>
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