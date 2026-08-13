import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { 
  BookOpen, Clock, Calendar, FileText, Users, ChevronRight, 
  Zap, Target, Award, BarChart2, Bell, Coffee, Plus, X,
  ExternalLink, Download, Play, File
} from 'lucide-react';

export default function AcademicHubPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [academicInfo, setAcademicInfo] = useState(null);
  
  // ---- Timetable add state ----
  const [showAddTimetable, setShowAddTimetable] = useState(false);
  const [newTime, setNewTime] = useState('');
  const [newActivity, setNewActivity] = useState('');
  const [newLocation, setNewLocation] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subjectsRes, assignmentsRes, timetableRes, materialsRes, infoRes] = await Promise.all([
        api.getSubjects(),
        api.getAssignments(),
        api.getTimetable(),
        api.getMaterials(),
        api.getAcademicInfo(),
      ]);

      setSubjects(subjectsRes || []);
      setAssignments(assignmentsRes || []);
      setTimetable(timetableRes || []);
      setMaterials(materialsRes || []);
      setAcademicInfo(infoRes);
    } catch (err) {
      console.error(err);
      showToast('Failed to load academic data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ---- Add timetable entry ----
  const handleAddTimetable = async () => {
    if (!newTime || !newActivity) {
      showToast('Please fill in time and activity', 'error');
      return;
    }
    try {
      // For MVP, we'll store it locally – in real app, POST to /api/academic/timetable
      const newEntry = {
        id: Date.now(),
        start_time: newTime,
        subject_name: newActivity,
        location: newLocation || '',
        day_of_week: new Date().getDay(),
        is_recurring: true,
      };
      setTimetable(prev => [...prev, newEntry]);
      setNewTime('');
      setNewActivity('');
      setNewLocation('');
      setShowAddTimetable(false);
      showToast('Timetable entry added!', 'success');
    } catch (err) {
      showToast('Failed to add entry', 'error');
    }
  };

  const handleResourceClick = (material) => {
    // For now, open the file in a new tab or show a modal
    if (material.file_path) {
      window.open(material.file_path, '_blank');
    } else {
      // If no file path, show a toast or navigate to material detail
      showToast(`Opening: ${material.title}`, 'info');
      // You could navigate to a material viewer page:
      // navigate(`/studysphere/material/${material.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-700 p-6 flex items-center justify-center">
        <div className="text-white text-xl">Loading Academic Hub...</div>
      </div>
    );
  }

  const today = new Date().getDay();
  const todayEntries = timetable.filter(entry => entry.day_of_week === today);
  const upcomingAssignments = assignments.filter(a => new Date(a.due_date) > new Date()).slice(0, 3);
  const recentMaterials = materials.slice(0, 5);

  return (
    <div className="relative min-h-screen bg-cover bg-center bg-fixed" style={{ backgroundImage: "url('/dashboard-bg.jpg.jpg')" }}>
      <div className="absolute inset-0 bg-black/60 z-0"></div>
      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">📚 StudySphere</h1>
            <p className="text-white/60 text-sm">Personalized learning hub with AI-powered resources</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/40 text-sm">{academicInfo?.education_level || 'Student'}</span>
            <span className="text-white/40 text-sm">|</span>
            <span className="text-white/40 text-sm">{academicInfo?.institution_name || 'Independent'}</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-4 flex items-center gap-3">
            <BookOpen size={24} className="text-brand-400" />
            <div>
              <p className="text-white/40 text-sm">Subjects</p>
              <p className="text-white font-bold text-xl">{subjects.length}</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <FileText size={24} className="text-blue-400" />
            <div>
              <p className="text-white/40 text-sm">Resources</p>
              <p className="text-white font-bold text-xl">{materials.length}</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <Calendar size={24} className="text-cyan-400" />
            <div>
              <p className="text-white/40 text-sm">Today's Classes</p>
              <p className="text-white font-bold text-xl">{todayEntries.length}</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <Clock size={24} className="text-yellow-400" />
            <div>
              <p className="text-white/40 text-sm">Due Assignments</p>
              <p className="text-white font-bold text-xl">{upcomingAssignments.length}</p>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Subjects & Materials (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Subjects */}
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BookOpen size={18} className="text-brand-400" /> Your Subjects
              </h2>
              {subjects.length === 0 ? (
                <p className="text-white/40 text-sm">No subjects added yet. Complete your academic setup.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {subjects.map((subject) => (
                    <button
                      key={subject.id}
                      onClick={() => navigate(`/studysphere/subject/${subject.id}`)}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition flex items-center gap-2"
                    >
                      {subject.name}
                      <ChevronRight size={14} className="text-white/40" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Resources */}
            <div className="card p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FileText size={18} className="text-blue-400" /> Recent Resources
                </h2>
                <Link to="/studysphere/resources" className="text-sm text-brand-400 hover:underline">View all</Link>
              </div>
              {recentMaterials.length === 0 ? (
                <p className="text-white/40 text-sm">No resources uploaded yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentMaterials.map((material) => (
                    <div
                      key={material.id}
                      onClick={() => handleResourceClick(material)}
                      className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition"
                    >
                      <div className="flex items-center gap-3">
                        <File size={16} className="text-white/40" />
                        <div>
                          <p className="text-white/90 text-sm">{material.title}</p>
                          <p className="text-white/40 text-xs">{material.type || 'Resource'} · {material.subject_name || 'General'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white/30 text-xs">{material.file_name}</span>
                        <ExternalLink size={14} className="text-white/30 hover:text-white cursor-pointer" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Timetable & Assignments (1/3) */}
          <div className="space-y-6">
            {/* Timetable */}
            <div className="card p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Clock size={16} className="text-cyan-400" /> My Study Timetable
                </h3>
                <button
                  onClick={() => setShowAddTimetable(!showAddTimetable)}
                  className="text-white/40 hover:text-white transition"
                >
                  <Plus size={16} />
                </button>
              </div>

              {showAddTimetable && (
                <div className="mb-4 p-3 bg-white/5 rounded-lg space-y-2">
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full input text-sm"
                    placeholder="Time"
                  />
                  <input
                    type="text"
                    value={newActivity}
                    onChange={(e) => setNewActivity(e.target.value)}
                    className="w-full input text-sm"
                    placeholder="Activity (e.g., Study Mathematics)"
                  />
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full input text-sm"
                    placeholder="Location (optional)"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleAddTimetable} className="btn-primary text-sm px-4 py-1">Add</button>
                    <button onClick={() => setShowAddTimetable(false)} className="btn-secondary text-sm px-4 py-1">Cancel</button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {todayEntries.length === 0 ? (
                  <p className="text-white/40 text-sm">No entries for today. Add one!</p>
                ) : (
                  todayEntries.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm">
                      <span className="text-white/40 w-16">{entry.start_time?.slice(0,5)}</span>
                      <span className="text-white/90">{entry.subject_name}</span>
                      {entry.location && <span className="text-white/40 text-xs">({entry.location})</span>}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Upcoming Assignments */}
            <div className="card p-5">
              <h3 className="text-white font-semibold flex items-center gap-2 mb-3">
                <Calendar size={16} className="text-yellow-400" /> Upcoming Assignments
              </h3>
              {upcomingAssignments.length === 0 ? (
                <p className="text-white/40 text-sm">No upcoming assignments.</p>
              ) : (
                <div className="space-y-2">
                  {upcomingAssignments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between text-sm">
                      <span className="text-white/90">{a.title}</span>
                      <span className="text-white/40 text-xs">{new Date(a.due_date).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="card p-5">
              <h3 className="text-white font-semibold mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/orbit')}
                  className="w-full text-left px-3 py-2 bg-purple-600/30 hover:bg-purple-600/50 rounded-lg text-white text-sm flex items-center gap-2 transition"
                >
                  <Zap size={16} className="text-purple-400" />
                  Launch Orbit
                </button>
                <button
                  onClick={() => navigate('/academic-onboarding')}
                  className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 text-sm flex items-center gap-2 transition"
                >
                  <Users size={16} />
                  Update Academic Info
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}