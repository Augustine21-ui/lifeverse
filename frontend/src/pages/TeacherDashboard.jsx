// frontend/src/pages/TeacherDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Loader2, Users, BookOpen, TrendingUp, Award } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [progress, setProgress] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [studentsData, summaryData] = await Promise.all([
        api.getTeacherStudents(),
        api.getTeacherClassSummary(),
      ]);
      setStudents(studentsData);
      setSummary(summaryData);
      if (studentsData.length > 0 && !selectedStudent) setSelectedStudent(studentsData[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentProgress = async (studentId) => {
    try {
      const data = await api.getTeacherStudentProgress(studentId);
      setProgress(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedStudent) loadStudentProgress(selectedStudent.id);
  }, [selectedStudent]);

  if (loading) return <div className="p-6 flex justify-center"><Loader2 className="animate-spin" size={40} /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Teacher Dashboard</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Students List and Class Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-4">
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Users size={20} className="text-brand-400" /> My Students
            </h2>
            {students.length === 0 ? (
              <p className="text-white/40">No students linked yet.</p>
            ) : (
              <div className="space-y-2">
                {students.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStudent(s)}
                    className={`w-full text-left p-3 rounded-lg transition ${
                      selectedStudent?.id === s.id
                        ? 'bg-brand-500/20 border border-brand-500/30'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <p className="font-medium">{s.full_name}</p>
                    <p className="text-xs text-white/40">
                      Level {s.level} • {s.xp} XP
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
          {summary && (
            <div className="card p-4">
              <h3 className="font-semibold mb-2">Class Summary</h3>
              <div className="space-y-2 text-sm">
                <p>Total students: {summary.total_students}</p>
                <p>Average XP: {Math.round(summary.avg_xp)}</p>
                <p>Average level: {Math.round(summary.avg_level)}</p>
                <p>7‑day active: {summary.active_7d}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Student Progress */}
        <div className="lg:col-span-2">
          {selectedStudent && progress ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-4">
                  <p className="text-white/40 text-sm">XP</p>
                  <p className="text-2xl font-bold">{progress.xp}</p>
                </div>
                <div className="card p-4">
                  <p className="text-white/40 text-sm">Level</p>
                  <p className="text-2xl font-bold">{progress.level}</p>
                </div>
                <div className="card p-4">
                  <p className="text-white/40 text-sm">Tasks Completed</p>
                  <p className="text-2xl font-bold">{progress.tasks}</p>
                </div>
                <div className="card p-4">
                  <p className="text-white/40 text-sm">Challenges Completed</p>
                  <p className="text-2xl font-bold">{progress.challenges}</p>
                </div>
              </div>
              <div className="card p-5">
                <h3 className="font-semibold mb-3">Weekly XP Activity</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={progress.weekly || []}>
                    <XAxis dataKey="date" stroke="#fff" />
                    <YAxis stroke="#fff" />
                    <Tooltip contentStyle={{ background: '#1a1a20', border: 'none' }} />
                    <Line type="monotone" dataKey="xp" stroke="#8b5cf6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="card p-6 text-center text-white/40">
              Select a student to view progress.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}