import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { 
  ArrowLeft, BookOpen, FileText, Calendar, Clock, 
  ChevronRight, Rocket, File, Download, ExternalLink,
  FileText as FileIcon, Video, Image, Archive, Zap
} from 'lucide-react';

export default function SubjectDetailPage() {
  const { subjectId } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);

  useEffect(() => {
    loadData();
  }, [subjectId]);

  const loadData = async () => {
    try {
      const [topicsRes, materialsRes, assignmentsRes] = await Promise.all([
        api.getTopics({ subjectId }),
        api.getMaterials({ subjectId }),
        api.getAssignments({ subjectId }),
      ]);

      // Get subject name from the subjects list
      const subjects = await api.getSubjects();
      const foundSubject = subjects.find(s => s.id === parseInt(subjectId));
      setSubject(foundSubject || { id: subjectId, name: 'Subject' });

      setTopics(topicsRes || []);
      setMaterials(materialsRes || []);
      setAssignments(assignmentsRes || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load subject data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePracticeInOrbit = (topicName) => {
    navigate('/orbit', { 
      state: { 
        subject: subject?.name || 'Subject', 
        topic: topicName || subject?.name || 'Topic'
      } 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-xl" style={{ color: 'var(--text-primary)' }}>Loading...</div>
      </div>
    );
  }

  const filteredMaterials = selectedTopic
    ? materials.filter(m => m.topic_id === selectedTopic)
    : materials;

  const selectedTopicName = selectedTopic ? topics.find(t => t.id === selectedTopic)?.name : null;

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="absolute inset-0" style={{ 
        background: 'radial-gradient(circle at 20% 30%, var(--bg-gradient-from), var(--bg-gradient-to), var(--bg-primary))',
        opacity: 0.5,
        zIndex: 0 
      }} />
      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="transition"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {subject?.name || 'Subject'}
            </h1>
            <p style={{ color: 'var(--text-muted)' }} className="text-sm">
              {topics.length} topics · {materials.length} materials
            </p>
          </div>
        </div>

        {/* Topics Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedTopic(null)}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              !selectedTopic 
                ? 'bg-brand-500 text-white' 
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
            style={!selectedTopic ? {} : { color: 'var(--text-secondary)', background: 'var(--bg-card)' }}
          >
            All Topics
          </button>
          {topics.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTopic(t.id)}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                selectedTopic === t.id 
                  ? 'bg-brand-500 text-white' 
                  : 'hover:bg-white/10'
              }`}
              style={selectedTopic === t.id ? {} : { color: 'var(--text-secondary)', background: 'var(--bg-card)' }}
            >
              {t.name}
            </button>
          ))}
        </div>

        {/* Materials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((material) => (
            <div key={material.id} className="card hover:shadow-lg transition">
              <div className="flex items-start gap-3">
                {material.type === 'pdf' ? <FileIcon size={20} className="text-red-400" /> :
                  material.type === 'video' ? <Video size={20} className="text-cyan-400" /> :
                  material.type === 'image' ? <Image size={20} className="text-green-400" /> :
                  <FileText size={20} className="text-blue-400" />}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {material.title}
                  </h4>
                  <p style={{ color: 'var(--text-muted)' }} className="text-xs">
                    {material.type} · {material.topic_name || 'General'}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span style={{ color: 'var(--text-muted)' }} className="text-xs">
                  {material.file_name || ''}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.open(material.file_path, '_blank')}
                    className="transition"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                    title="View"
                  >
                    <ExternalLink size={16} />
                  </button>
                  <button
                    onClick={() => window.location.href = material.file_path}
                    className="transition"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                    title="Download"
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredMaterials.length === 0 && (
            <div className="col-span-full card p-8 text-center" style={{ color: 'var(--text-muted)' }}>
              <FileText size={48} className="mx-auto mb-3 opacity-30" />
              <p>No materials found for {selectedTopicName ? `"${selectedTopicName}"` : 'this subject'}.</p>
            </div>
          )}
        </div>

        {/* Assignments Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Calendar size={20} className="text-yellow-400" /> Assignments
          </h2>
          {assignments.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }} className="text-sm">No assignments yet.</p>
          ) : (
            <div className="space-y-3">
              {assignments.map((a) => (
                <div key={a.id} className="card p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>{a.title}</h4>
                    <p style={{ color: 'var(--text-muted)' }} className="text-sm">{a.description}</p>
                    <p style={{ color: 'var(--text-muted)' }} className="text-xs">Due: {new Date(a.due_date).toLocaleDateString()}</p>
                  </div>
                  <button className="px-4 py-2 rounded-lg text-sm transition hover:opacity-80" style={{ background: 'var(--accent)', color: 'white' }}>
                    Submit
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Practice in Orbit */}
        <div className="mt-8 card p-6" style={{ 
          background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.08))',
          borderColor: 'rgba(139,92,246,0.3)'
        }}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Rocket size={20} className="text-purple-400" /> Practice in Orbit
              </h3>
              <p style={{ color: 'var(--text-muted)' }} className="text-sm">
                Generate AI-powered activities for {selectedTopicName ? `"${selectedTopicName}"` : 'this subject'}.
              </p>
            </div>
            <button
              onClick={() => handlePracticeInOrbit(selectedTopicName)}
              className="px-6 py-2 rounded-lg text-white font-medium transition hover:opacity-90 flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
            >
              <Rocket size={16} /> Launch Orbit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}