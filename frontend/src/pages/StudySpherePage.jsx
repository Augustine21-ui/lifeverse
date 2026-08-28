// frontend/src/pages/StudySpherePage.jsx
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import {
  Calendar, Clock, BookOpen, FileText, Megaphone, Loader2,
  Home, Users, GraduationCap, ClipboardList, Notebook, ArrowRight,
  CheckCircle, Circle, AlertCircle, TrendingUp, Star,
  ChevronLeft, ChevronRight, MapPin, User, Repeat,
  Plus, Edit, Trash2, Pin, Search, Filter, Bookmark, Highlighter,
  Save, X, MoreVertical
} from 'lucide-react';

export default function StudySpherePage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // default to overview

  // ---- Timetable state ----
  const [timetableView, setTimetableView] = useState('today');
  const [timetableDate, setTimetableDate] = useState(new Date());
  const [timetableEntries, setTimetableEntries] = useState([]);
  const [loadingTimetable, setLoadingTimetable] = useState(false);

  // ---- Notes state ----
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteForm, setNoteForm] = useState({ title: '', content: '', subject: '', topic: '', tags: '', pinned: false, material_id: null });
  const [submittingNote, setSubmittingNote] = useState(false);
  const [searchNotes, setSearchNotes] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [quickNote, setQuickNote] = useState('');
  const quickNoteInputRef = useRef(null);

  // ---- Highlights and Bookmarks ----
  const [highlights, setHighlights] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Load all data
  useEffect(() => {
    loadData();
    loadNotes();
    loadHighlights();
    loadBookmarks();
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
      if (sphereData.timetable) {
        setTimetableEntries(sphereData.timetable);
      }
    } catch (err) {
      console.error('Error loading StudySphere:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Notes CRUD ──────────────────────────────────────────────────────
  const loadNotes = async () => {
    setLoadingNotes(true);
    try {
      const res = await api.getStudyNotes();
      setNotes(res || []);
    } catch (err) {
      console.error('Error loading notes:', err);
      setNotes([]);
    } finally {
      setLoadingNotes(false);
    }
  };

  const loadHighlights = async () => {
    try {
      const res = await api.getHighlights();
      setHighlights(res || []);
    } catch (err) {
      console.error('Error loading highlights:', err);
      setHighlights([]);
    }
  };

  const loadBookmarks = async () => {
    try {
      const res = await api.getBookmarks();
      setBookmarks(res || []);
    } catch (err) {
      console.error('Error loading bookmarks:', err);
      setBookmarks([]);
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    setSubmittingNote(true);
    try {
      const payload = {
        title: noteForm.title,
        content: noteForm.content,
        subject: noteForm.subject,
        topic: noteForm.topic,
        tags: noteForm.tags.split(',').map(s => s.trim()).filter(Boolean),
        pinned: noteForm.pinned,
        material_id: noteForm.material_id || null,
      };
      if (editingNote) {
        await api.updateStudyNote(editingNote.id, payload);
      } else {
        await api.createStudyNote(payload);
      }
      await loadNotes();
      setShowNoteModal(false);
      resetNoteForm();
    } catch (err) {
      alert('Failed to save note');
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleDeleteNote = async (id) => {
    if (!confirm('Delete this note?')) return;
    try {
      await api.deleteStudyNote(id);
      await loadNotes();
    } catch (err) {
      alert('Failed to delete note');
    }
  };

  const handlePinNote = async (id, pinned) => {
    try {
      await api.pinStudyNote(id, { pinned: !pinned });
      await loadNotes();
    } catch (err) {
      alert('Failed to update pin status');
    }
  };

  const resetNoteForm = () => {
    setNoteForm({ title: '', content: '', subject: '', topic: '', tags: '', pinned: false, material_id: null });
    setEditingNote(null);
  };

  const openEditNote = (note) => {
    setEditingNote(note);
    setNoteForm({
      title: note.title,
      content: note.content,
      subject: note.subject || '',
      topic: note.topic || '',
      tags: (note.tags || []).join(', '),
      pinned: note.pinned || false,
      material_id: note.material_id || null,
    });
    setShowNoteModal(true);
  };

  const handleQuickNoteSave = async () => {
    if (!quickNote.trim()) return;
    try {
      await api.createStudyNote({
        title: `Quick note ${new Date().toLocaleString()}`,
        content: quickNote,
        subject: '',
        topic: '',
        tags: [],
        pinned: false,
      });
      setQuickNote('');
      await loadNotes();
      if (quickNoteInputRef.current) quickNoteInputRef.current.focus();
    } catch (err) {
      alert('Failed to save quick note');
    }
  };

  // ── Timetable ────────────────────────────────────────────────────────
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
      if (data?.timetable) setTimetableEntries(data.timetable);
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
  const isStudent = user?.role === 'student';

  // ── Navigation items ──
  const navItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'timetable', label: 'Timetable', icon: Calendar },
    { id: 'subjects', label: 'My Subjects', icon: BookOpen },
    { id: 'materials', label: 'Materials', icon: FileText },
    { id: 'assignments', label: 'Assignments', icon: ClipboardList },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'studytools', label: 'Study Tools', icon: Notebook },
  ];

  // ── Helper: get unique subjects for filter ──
  const uniqueSubjects = [...new Set(notes.map(n => n.subject).filter(Boolean))];

  // ── Filter notes ──
  const filteredNotes = notes.filter(n => {
    const matchSearch = n.title.toLowerCase().includes(searchNotes.toLowerCase()) ||
                        n.content.toLowerCase().includes(searchNotes.toLowerCase()) ||
                        (n.tags && n.tags.join(' ').toLowerCase().includes(searchNotes.toLowerCase()));
    const matchSubject = filterSubject === 'all' || n.subject === filterSubject;
    return matchSearch && matchSubject;
  });

  // Sort: pinned first, then by updated_at desc
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updated_at) - new Date(a.updated_at);
  });

  // ── Render functions ──────────────────────────────────────────────

  // ---- Overview tab ----
  const renderOverview = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">📊 Academic Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <BookOpen className="text-brand-400" size={24} />
            <div>
              <p className="text-sm text-white/40">Subjects</p>
              <p className="text-2xl font-bold">{subjects.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <ClipboardList className="text-yellow-400" size={24} />
            <div>
              <p className="text-sm text-white/40">Assignments</p>
              <p className="text-2xl font-bold">{assignments.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <Notebook className="text-green-400" size={24} />
            <div>
              <p className="text-sm text-white/40">Notes</p>
              <p className="text-2xl font-bold">{notes.length}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h3 className="font-semibold mb-2">📚 Curriculum</h3>
          {subjects.length === 0 ? (
            <p className="text-white/40">No subjects enrolled.</p>
          ) : (
            <ul className="space-y-1">
              {subjects.map(s => (
                <li key={s.id} className="flex justify-between items-center text-sm">
                  <span>{s.name}</span>
                  <span className="text-xs text-white/40">{s.code || ''}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card p-4">
          <h3 className="font-semibold mb-2">📝 Recent Activity</h3>
          <p className="text-white/40 text-sm">No recent activity yet.</p>
        </div>
      </div>
      <div className="card p-4">
        <h3 className="font-semibold mb-2">📈 Progress</h3>
        <div className="space-y-2">
          {subjects.slice(0, 4).map(s => (
            <div key={s.id}>
              <div className="flex justify-between text-sm">
                <span>{s.name}</span>
                <span>{s.progress || 0}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full">
                <div className="h-full bg-brand-500 rounded-full" style={{ width: `${s.progress || 0}%` }} />
              </div>
            </div>
          ))}
          {subjects.length === 0 && <p className="text-white/40">No progress data.</p>}
        </div>
      </div>
      <div className="card p-4">
        <h3 className="font-semibold mb-2">📄 Resources</h3>
        {resources.length === 0 ? (
          <p className="text-white/40">No resources available.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {resources.slice(0, 6).map(r => (
              <span key={r.id} className="px-2 py-1 bg-white/5 rounded text-xs">{r.title}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ---- Study Tools tab (renamed from StudySpace) ----
  const renderStudyTools = () => (
    <div>
      <h2 className="text-2xl font-bold mb-4">📓 Study Tools</h2>

      {/* Quick Note */}
      <div className="card p-4 mb-6">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Plus size={18} className="text-brand-400" />
          Quick Note
        </h3>
        <div className="flex gap-2">
          <input
            ref={quickNoteInputRef}
            type="text"
            className="input flex-1"
            placeholder="Write a quick note..."
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuickNoteSave()}
          />
          <button onClick={handleQuickNoteSave} className="btn-primary text-sm">Save</button>
        </div>
      </div>

      {/* My Notes Section */}
      <div className="card p-4">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Notebook size={18} className="text-yellow-400" />
            My Notes
          </h3>
          <button
            onClick={() => { resetNoteForm(); setShowNoteModal(true); }}
            className="btn-primary text-sm flex items-center gap-1"
          >
            <Plus size={16} /> New Note
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              className="input w-full pl-9 text-sm"
              placeholder="Search notes..."
              value={searchNotes}
              onChange={(e) => setSearchNotes(e.target.value)}
            />
          </div>
          <select
            className="input w-40 text-sm"
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
          >
            <option value="all">All Subjects</option>
            {uniqueSubjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
          </select>
        </div>

        {loadingNotes ? (
          <Loader2 className="animate-spin mx-auto text-brand-400" size={24} />
        ) : sortedNotes.length === 0 ? (
          <p className="text-white/40 text-center">No notes yet. Create one!</p>
        ) : (
          <div className="space-y-3">
            {sortedNotes.map(n => (
              <div key={n.id} className={`p-3 bg-white/5 rounded-lg hover:bg-white/10 transition ${n.pinned ? 'border-l-2 border-brand-400' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {n.pinned && <Pin size={14} className="text-brand-400" />}
                      <h4 className="font-semibold">{n.title}</h4>
                    </div>
                    <p className="text-sm text-white/60 line-clamp-2">{n.content}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-white/40">
                      {n.subject && <span>📚 {n.subject}</span>}
                      {n.topic && <span>· {n.topic}</span>}
                      {n.tags && n.tags.length > 0 && <span>🏷️ {n.tags.join(', ')}</span>}
                      <span>· {new Date(n.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2 flex-shrink-0">
                    <button onClick={() => handlePinNote(n.id, n.pinned)} className="text-white/30 hover:text-brand-400" title={n.pinned ? 'Unpin' : 'Pin'}>
                      <Pin size={16} />
                    </button>
                    <button onClick={() => openEditNote(n)} className="text-white/30 hover:text-brand-400" title="Edit">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDeleteNote(n.id)} className="text-white/30 hover:text-red-400" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Highlights */}
      <div className="card p-4 mt-6">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Highlighter size={18} className="text-blue-400" />
          Highlights
        </h3>
        {highlights.length === 0 ? (
          <p className="text-white/40">No highlights yet. Highlight text in materials to save them here.</p>
        ) : (
          <div className="space-y-2">
            {highlights.slice(0, 5).map(h => (
              <div key={h.id} className="p-2 bg-white/5 rounded border-l-2 border-blue-400">
                <p className="text-sm italic">"{h.content}"</p>
                <p className="text-xs text-white/40 mt-1">From: {h.material_title || 'Unknown'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bookmarks */}
      <div className="card p-4 mt-6">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Bookmark size={18} className="text-green-400" />
          Bookmarks
        </h3>
        {bookmarks.length === 0 ? (
          <p className="text-white/40">No bookmarks yet. Bookmark materials for quick access.</p>
        ) : (
          <div className="space-y-2">
            {bookmarks.slice(0, 5).map(b => (
              <div key={b.id} className="flex justify-between items-center p-2 bg-white/5 rounded">
                <span className="text-sm">{b.material_title || 'Bookmark'}</span>
                <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-brand-400 text-xs hover:underline">Open</a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setShowNoteModal(false)}>
          <div className="w-full max-w-lg card p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingNote ? 'Edit Note' : 'New Note'}</h2>
              <button onClick={() => { setShowNoteModal(false); resetNoteForm(); }} className="text-white/40 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateNote} className="space-y-3">
              <input className="input w-full" placeholder="Title *" value={noteForm.title} onChange={(e) => setNoteForm({...noteForm, title: e.target.value})} required />
              <textarea className="input w-full" rows="4" placeholder="Content" value={noteForm.content} onChange={(e) => setNoteForm({...noteForm, content: e.target.value})} required />
              <input className="input w-full" placeholder="Subject (optional)" value={noteForm.subject} onChange={(e) => setNoteForm({...noteForm, subject: e.target.value})} />
              <input className="input w-full" placeholder="Topic (optional)" value={noteForm.topic} onChange={(e) => setNoteForm({...noteForm, topic: e.target.value})} />
              <input className="input w-full" placeholder="Tags (comma separated)" value={noteForm.tags} onChange={(e) => setNoteForm({...noteForm, tags: e.target.value})} />
              <label className="flex items-center gap-2 text-sm text-white/60">
                <input type="checkbox" checked={noteForm.pinned} onChange={(e) => setNoteForm({...noteForm, pinned: e.target.checked})} />
                Pin this note
              </label>
              <button type="submit" disabled={submittingNote} className="btn-primary w-full">{submittingNote ? 'Saving...' : 'Save Note'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // ---- Timetable tab (existing) ----
  const renderTimetable = () => {
    const weekEntries = getWeekEntries();
    const dateStr = timetableDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
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
              <button onClick={() => setTimetableView('today')} className={`px-3 py-1 text-sm rounded-lg transition ${timetableView === 'today' ? 'bg-brand-500 text-white' : 'hover:bg-white/10'}`}>Today</button>
              <button onClick={() => setTimetableView('week')} className={`px-3 py-1 text-sm rounded-lg transition ${timetableView === 'week' ? 'bg-brand-500 text-white' : 'hover:bg-white/10'}`}>Week</button>
              <button onClick={() => setTimetableView('month')} className={`px-3 py-1 text-sm rounded-lg transition ${timetableView === 'month' ? 'bg-brand-500 text-white' : 'hover:bg-white/10'}`}>Month</button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <button onClick={() => changeTimetableDate(-1)} className="p-2 hover:bg-white/10 rounded-lg transition"><ChevronLeft size={20} /></button>
          <span className="font-medium">
            {timetableView === 'today' && dateStr}
            {timetableView === 'week' && getWeekRange()}
            {timetableView === 'month' && timetableDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={() => changeTimetableDate(1)} className="p-2 hover:bg-white/10 rounded-lg transition"><ChevronRight size={20} /></button>
        </div>

        {loadingTimetable ? (
          <Loader2 className="animate-spin mx-auto text-brand-400" size={32} />
        ) : (
          <>
            {timetableView === 'today' && (
              <div className="space-y-3">
                {todayEntries.length === 0 ? (
                  <div className="card p-8 text-center text-white/40"><Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No classes today</p></div>
                ) : (
                  todayEntries.map((t, idx) => (
                    <div key={t.id || idx} className="card p-4 hover:border-white/20 transition">
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="min-w-[70px]"><p className="text-lg font-bold text-brand-400">{t.start_time?.slice(0,5)}</p><p className="text-xs text-white/40">to {t.end_time?.slice(0,5)}</p></div>
                        <div className="flex-1"><p className="font-semibold text-lg">{t.subject || t.course_name}</p><div className="flex flex-wrap gap-4 text-sm text-white/60"><span className="flex items-center gap-1"><User size={14} /> {t.teacher_name || 'TBD'}</span><span className="flex items-center gap-1"><MapPin size={14} /> {t.room_name || 'TBD'}</span>{t.is_recurring && <span className="flex items-center gap-1"><Repeat size={14} /> Weekly</span>}</div></div>
                        <div className="text-right"><span className={`px-2 py-1 rounded-full text-xs ${t.is_recurring ? 'bg-brand-500/20 text-brand-400' : 'bg-blue-500/20 text-blue-400'}`}>{t.is_recurring ? 'Recurring' : 'Once'}</span></div>
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
                      <h4 className={`font-semibold text-sm mb-2 ${day === new Date().toLocaleDateString('en-US', { weekday: 'long' }) ? 'text-brand-400' : 'text-white/60'}`}>{day.slice(0,3)}{day === new Date().toLocaleDateString('en-US', { weekday: 'long' }) && ' 🎯'}</h4>
                      {entries.length === 0 ? <p className="text-xs text-white/20">—</p> : entries.slice(0, 3).map((t, i) => (
                        <div key={t.id || i} className="bg-white/5 p-2 rounded-lg text-xs mb-1"><p className="font-medium text-brand-400">{t.start_time?.slice(0,5)}</p><p className="truncate">{t.subject || t.course_name}</p></div>
                      ))}
                      {entries.length > 3 && <p className="text-xs text-white/40">+{entries.length - 3} more</p>}
                    </div>
                  );
                })}
              </div>
            )}
            {timetableView === 'month' && (
              <div className="card p-4 overflow-x-auto">
                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                  {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <div key={d} className="font-semibold text-white/40 py-2">{d}</div>)}
                  {Array.from({ length: new Date(timetableDate.getFullYear(), timetableDate.getMonth(), 1).getDay() || 7 }, (_, i) => <div key={`empty-${i}`} className="py-2 text-white/10">—</div>)}
                  {Array.from({ length: new Date(timetableDate.getFullYear(), timetableDate.getMonth() + 1, 0).getDate() }, (_, i) => {
                    const dayNum = i + 1;
                    const date = new Date(timetableDate.getFullYear(), timetableDate.getMonth(), dayNum);
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                    const entries = timetableEntries.filter(t => t.day_of_week === dayName);
                    const isToday = date.toDateString() === new Date().toDateString();
                    return (
                      <div key={dayNum} className={`p-2 rounded-lg ${isToday ? 'bg-brand-500/20 border border-brand-400/30' : 'hover:bg-white/5'} transition`}>
                        <p className={`font-medium ${isToday ? 'text-brand-400' : 'text-white/80'}`}>{dayNum}</p>
                        {entries.length > 0 && <div className="mt-1 space-y-0.5">{entries.slice(0,2).map((t, idx) => <div key={idx} className="text-[10px] bg-brand-500/20 text-brand-400 rounded px-1 truncate">{t.start_time?.slice(0,5)}</div>)}</div>}
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

  // ---- Subjects tab (existing) ----
  const renderSubjects = () => (
    <div>
      <h2 className="text-xl font-semibold mb-4">📚 My Subjects</h2>
      {subjects.length === 0 ? (
        <div className="card p-8 text-center text-white/40"><BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" /><p className="font-medium">No subjects yet</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map(s => (
            <Link key={s.id} to={`/studysphere/subject/${s.id}`} className="card p-4 hover:border-white/20 transition group">
              <div className="flex items-start justify-between"><div className="flex-1"><h3 className="font-semibold text-lg">{s.name}</h3>{s.code && <p className="text-sm text-white/40">{s.code}</p>}</div><ArrowRight size={16} className="text-white/30 group-hover:text-brand-400 transition flex-shrink-0 mt-1" /></div>
              <div className="mt-3 flex items-center gap-2 text-xs text-white/40"><span className="px-2 py-0.5 bg-brand-500/20 text-brand-400 rounded">Active</span>{s.progress && <span>Progress: {s.progress}%</span>}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  // ---- Materials tab (existing) ----
  const renderMaterials = () => (
    <div>
      <h2 className="text-xl font-semibold mb-4">📄 Learning Materials</h2>
      {resources.length === 0 ? (
        <div className="card p-8 text-center text-white/40"><FileText className="w-12 h-12 mx-auto mb-3 opacity-50" /><p className="font-medium">No materials yet</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map(r => (
            <div key={r.id} className="card p-4 hover:border-white/20 transition">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-500/20 flex items-center justify-center flex-shrink-0"><FileText size={18} className="text-brand-400" /></div>
                <div className="flex-1 min-w-0"><h4 className="font-semibold truncate">{r.title}</h4>{r.description && <p className="text-sm text-white/60 line-clamp-2">{r.description}</p>}<div className="flex items-center gap-3 mt-2 text-xs text-white/40"><span className="capitalize px-2 py-0.5 bg-white/5 rounded">{r.resource_type}</span><span>{new Date(r.created_at).toLocaleDateString()}</span>{r.file_url && <a href={r.file_url} target="_blank" className="text-brand-400 hover:underline">Open →</a>}</div></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ---- Assignments tab (existing) ----
  const renderAssignments = () => {
    const getStatusIcon = (status) => {
      if (status === 'Completed' || status === 'Submitted') return <CheckCircle size={16} className="text-green-400" />;
      if (status === 'In Progress') return <AlertCircle size={16} className="text-yellow-400" />;
      return <Circle size={16} className="text-red-400" />;
    };
    return (
      <div>
        <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-semibold">📝 Assignments</h2><span className="text-sm text-white/40">{assignments.length} total</span></div>
        {assignments.length === 0 ? (
          <div className="card p-8 text-center text-white/40"><ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" /><p className="font-medium">No assignments yet</p></div>
        ) : (
          <div className="space-y-3">
            {assignments.map(a => (
              <div key={a.id} className="card p-4 hover:border-white/20 transition">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex-1"><div className="flex items-center gap-2">{getStatusIcon(a.status)}<h4 className="font-semibold">{a.title}</h4></div><p className="text-sm text-white/60 mt-1">{a.description || 'No description'}</p><div className="flex flex-wrap gap-4 mt-2 text-xs text-white/40"><span>Subject: {a.subject || 'General'}</span><span>Due: {new Date(a.due_date).toLocaleDateString()}</span>{a.submitted_at && <span className="text-green-400">Submitted: {new Date(a.submitted_at).toLocaleDateString()}</span>}</div></div>
                  <div className="text-right"><span className={`px-3 py-1 rounded-full text-xs ${a.status === 'Completed' || a.status === 'Submitted' ? 'bg-green-500/20 text-green-400' : a.status === 'In Progress' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>{a.status || 'Not Started'}</span>{a.grade !== undefined && <p className="text-sm font-bold text-brand-400 mt-1">Grade: {a.grade}%</p>}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ---- Announcements tab (existing) ----
  const renderAnnouncements = () => (
    <div>
      <h2 className="text-xl font-semibold mb-4">📢 Academic Announcements</h2>
      {announcements.length === 0 ? (
        <div className="card p-8 text-center text-white/40"><Megaphone className="w-12 h-12 mx-auto mb-3 opacity-50" /><p className="font-medium">No announcements yet</p></div>
      ) : (
        <div className="space-y-4">
          {announcements.map(a => (
            <div key={a.id} className="card p-4 border-l-4 border-brand-500">
              <div className="flex items-start justify-between"><div className="flex-1"><h4 className="font-semibold text-lg">{a.title}</h4><p className="text-sm text-white/70 mt-1 whitespace-pre-wrap">{a.content}</p><div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-white/40"><span>📅 {new Date(a.created_at).toLocaleDateString()}</span><span>👤 {a.author_name || 'Admin'}</span>{a.target_roles && <span>🎯 For: {a.target_roles.join(', ')}</span>}</div></div>{a.is_priority && <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs flex-shrink-0 ml-2">⚡ Priority</span>}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ---- Main render ----
  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 max-w-7xl mx-auto">
      {/* Sidebar */}
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
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'timetable' && renderTimetable()}
        {activeTab === 'subjects' && renderSubjects()}
        {activeTab === 'materials' && renderMaterials()}
        {activeTab === 'assignments' && renderAssignments()}
        {activeTab === 'announcements' && renderAnnouncements()}
        {activeTab === 'studytools' && renderStudyTools()}
      </main>
    </div>
  );
}