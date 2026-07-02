// frontend/src/pages/StudySpherePage.jsx
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Plus, Trash2, Save, ExternalLink, Loader2 } from 'lucide-react';
import PageBackground from '../components/PageBackground';

export default function StudySpherePage() {
  const [subjects] = useState(['Mathematics', 'Biology', 'Chemistry', 'Physics', 'History']);
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [timetable, setTimetable] = useState([]);
  const [newTime, setNewTime] = useState('');
  const [newActivity, setNewActivity] = useState('');

  // Load resources when subject changes
  useEffect(() => {
    const loadResources = async () => {
      setLoadingResources(true);
      try {
        const data = await api.getResources(selectedSubject);
        setResources(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingResources(false);
      }
    };
    loadResources();
  }, [selectedSubject]);

  // Load saved timetable from localStorage (or backend later)
  useEffect(() => {
    const saved = localStorage.getItem('studySphereTimetable');
    if (saved) setTimetable(JSON.parse(saved));
    else setTimetable([
      { time: '8:00 AM', activity: 'Mathematics lecture' },
      { time: '10:00 AM', activity: 'Biology lab' },
      { time: '1:00 PM', activity: 'Chemistry problem solving' },
    ]);
  }, []);

  const addTimetableEntry = () => {
    if (newTime && newActivity) {
      const newEntry = { time: newTime, activity: newActivity };
      const updated = [...timetable, newEntry];
      setTimetable(updated);
      localStorage.setItem('studySphereTimetable', JSON.stringify(updated));
      setNewTime('');
      setNewActivity('');
    }
  };

  const removeTimetableEntry = (index) => {
    const updated = timetable.filter((_, i) => i !== index);
    setTimetable(updated);
    localStorage.setItem('studySphereTimetable', JSON.stringify(updated));
  };

  return (
    <PageBackground imageUrl="/studysphere-bg.jpg">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white">StudySphere</h1>
            <p className="text-white/40 text-sm">Personalized learning hub with AI‑powered resources</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: Subjects */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-3">SUBJECTS</h3>
              <div className="flex flex-wrap gap-2">
                {subjects.map(subject => (
                  <button
                    key={subject}
                    onClick={() => setSelectedSubject(subject)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selectedSubject === subject
                        ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right column: Timetable + Resources */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timetable Section */}
            <div className="card p-5">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">📅 My Study Timetable</h2>
              <div className="space-y-2 mb-4">
                {timetable.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-sm font-mono text-white/40 w-24">{entry.time}</span>
                    <span className="flex-1 text-white/90">{entry.activity}</span>
                    <button onClick={() => removeTimetableEntry(idx)} className="text-white/30 hover:text-red-400">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input w-32"
                  placeholder="Time (e.g., 2:00 PM)"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                />
                <input
                  type="text"
                  className="input flex-1"
                  placeholder="Activity (e.g., Study Mathematics)"
                  value={newActivity}
                  onChange={(e) => setNewActivity(e.target.value)}
                />
                <button onClick={addTimetableEntry} className="btn-primary">
                  <Plus size={16} /> Add
                </button>
              </div>
            </div>

            {/* Resources Section */}
            <div className="card p-5">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                📚 Resources for {selectedSubject}
              </h2>
              {loadingResources ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-brand-400" size={32} /></div>
              ) : resources.length === 0 ? (
                <p className="text-white/40">No resources found for this subject.</p>
              ) : (
                <div className="space-y-3">
                  {resources.map((res, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                      <div>
                        <p className="font-medium text-white">{res.title}</p>
                        <p className="text-xs text-white/40">{res.type} • {res.duration}</p>
                      </div>
                      <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-brand-300">
                        <ExternalLink size={18} />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageBackground>
  );
}