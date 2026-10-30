// frontend/src/pages/SkillsPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import ErrorBoundary from '../components/ErrorBoundary';
import HolographicAvatar from '../components/HolographicAvatar';
import {
  Play, BookOpen, Target, Compass, Rocket, CheckCircle, Calendar, ArrowRight,
  ChevronRight, Plus, Trash2, X, Activity, Award, Settings2, Briefcase, Sparkles
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Fallback Activity Generator
// ─────────────────────────────────────────────────────────────
const getFallbackActivities = (skillName) => ({
  practice: {
    everyday: { id: 'f1', context: 'everyday', title: 'Practical Application', prompt: `How would you apply ${skillName} in your daily life? Describe a scenario and your solution.` },
    school: { id: 'f2', context: 'school', title: 'Classroom Scenario', prompt: `How would you use ${skillName} to solve a problem at school or in your studies?` },
    community: { id: 'f3', context: 'community', title: 'Community Impact', prompt: `How could ${skillName} be used to improve something in your local community?` },
  },
  followup: { id: 'f4', context: 'school', title: 'Transfer Challenge', prompt: `Now try to apply ${skillName} in a completely different subject or situation.` }
});

// ─────────────────────────────────────────────────────────────
// Skill Manager Modal
// ─────────────────────────────────────────────────────────────
function SkillManagerModal({ onClose, onRefresh }) {
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadSkills = async () => {
    try {
      const data = await api.getSkillsDashboard();
      setSkills(data.skills || []);
    } catch (err) {
      showToast('Failed to load skills', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSkills(); }, []);

  const handleAdd = async () => {
    if (!newSkill.trim()) return;
    try {
      await api.createSkill({ name: newSkill.trim(), category: 'General' });
      setNewSkill('');
      await loadSkills();
      onRefresh(); 
      showToast('Skill added!');
    } catch (err) {
      showToast(err.message || 'Failed to add skill', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this skill? This will remove associated progress.')) return;
    try {
      await api.deleteSkill(id);
      await loadSkills();
      onRefresh();
      showToast('Skill deleted');
    } catch (err) {
      showToast(err.message || 'Failed to delete skill', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0a0a0f] border border-[var(--border)] rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[#1a1a24]">
          <h2 className="text-lg font-bold text-white">Manage Skills</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X size={20} /></button>
        </div>
        
        <div className="p-6 space-y-6 bg-[var(--bg-primary)]">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="New skill (e.g., Python)"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="flex-1 bg-[#121218] border border-[var(--border)] rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-[var(--accent)]"
            />
            <button onClick={handleAdd} className="px-4 py-2 bg-[var(--accent)] text-white rounded-xl font-medium hover:opacity-90">
              <Plus size={18} />
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {loading ? (
              <p className="text-sm text-gray-400 text-center py-4">Loading...</p>
            ) : skills.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No skills added yet.</p>
            ) : (
              skills.map(skill => (
                <div key={skill.id} className="flex justify-between items-center bg-[#1e1e28] p-3 rounded-xl border border-[var(--border)]">
                  <span className="text-sm font-medium text-white capitalize">{skill.name}</span>
                  <button onClick={() => handleDelete(skill.id)} className="text-red-400 hover:text-red-300 p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Activity Modal
// ─────────────────────────────────────────────────────────────
function ActivityModal({ activity, onClose, onSubmit }) {
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!response.trim()) return;
    setSubmitting(true);
    await onSubmit(activity, response);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl flex flex-col overflow-hidden shadow-2xl h-[85vh] sm:h-auto sm:max-h-[90vh]">
        <div className="bg-[#1a1a24] p-5 border-b border-[var(--border)] text-white flex items-center justify-between shrink-0">
          <div>
            <p className="text-[11px] font-semibold text-[var(--accent)] uppercase tracking-wider mb-0.5">
              {activity.context === 'everyday' ? 'Everyday Life' : activity.context}
            </p>
            <h2 className="text-lg font-bold leading-tight">{activity.title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition text-white/70">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto bg-[var(--bg-primary)] flex flex-col gap-5">
          <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border)]">
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">The Challenge</h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{activity.prompt}</p>
          </div>
          
          <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border)]">
            <h3 className="font-semibold text-[var(--text-primary)] mb-3">Show what you did</h3>
            <textarea
              className="w-full bg-[#121218] border border-[var(--border)] rounded-xl p-4 text-sm text-[var(--text-primary)] min-h-[120px] resize-none focus:border-[var(--accent)] outline-none"
              placeholder="Explain your solution here..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
            />
          </div>
        </div>

        <div className="p-5 bg-[#1a1a24] border-t border-[var(--border)] shrink-0">
          <button
            onClick={handleSubmit}
            disabled={!response.trim() || submitting}
            className="w-full py-3.5 bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save to My Evidence'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Node Graphics
// ─────────────────────────────────────────────────────────────
const ConnectedNodeGraphic = ({ returning }) => (
  <div className="relative w-full h-[180px] lg:h-[240px] flex items-center justify-center my-4">
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[80%] bg-[#8b5cf6]/20 blur-[60px] rounded-full"></div>
    
    {returning ? (
      <div className="relative w-[280px] lg:w-[400px] h-full flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-[#1e1e28] border-2 border-[#8b5cf6] flex items-center justify-center z-20 shadow-[0_0_20px_rgba(139,92,246,0.5)]">
           <Target size={24} className="text-[#a78bfa]" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="absolute top-[10%] left-[15%] w-10 h-10 rounded-full bg-[#1e1e28] border border-[#4b5563] flex items-center justify-center z-10">
              <BookOpen size={16} className="text-gray-400" />
           </div>
           <svg className="absolute top-[15%] left-[20%] w-[30%] h-[30%] pointer-events-none"><line x1="0" y1="0" x2="100%" y2="100%" stroke="#4b5563" strokeWidth="2" strokeDasharray="4 4" /></svg>
           
           <div className="absolute top-[15%] right-[15%] w-12 h-12 rounded-full bg-[#1e1e28] border border-[#3b82f6] flex items-center justify-center z-10 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <CheckCircle size={20} className="text-[#60a5fa]" />
           </div>
           <svg className="absolute top-[20%] right-[20%] w-[25%] h-[25%] pointer-events-none"><line x1="100%" y1="0" x2="0" y2="100%" stroke="#3b82f6" strokeWidth="2" /></svg>

           <div className="absolute bottom-[15%] left-[10%] w-12 h-12 rounded-full bg-[#1e1e28] border border-[#8b5cf6] flex items-center justify-center z-10">
              <Activity size={20} className="text-[#a78bfa]" />
           </div>
           <svg className="absolute bottom-[20%] left-[15%] w-[30%] h-[25%] pointer-events-none"><line x1="0" y1="100%" x2="100%" y2="0" stroke="#8b5cf6" strokeWidth="2" /></svg>

           <div className="absolute bottom-[10%] right-[15%] w-10 h-10 rounded-full bg-[#1e1e28] border border-[#4b5563] flex items-center justify-center z-10">
              <Award size={16} className="text-gray-400" />
           </div>
           <svg className="absolute bottom-[15%] right-[20%] w-[25%] h-[25%] pointer-events-none"><line x1="100%" y1="100%" x2="0" y2="0" stroke="#4b5563" strokeWidth="2" strokeDasharray="4 4" /></svg>
        </div>
      </div>
    ) : (
      <div className="relative w-[200px] lg:w-[280px] h-[100px] flex items-center justify-center">
         <div className="absolute left-[10%] w-20 h-20 rounded-2xl border-2 border-[#8b5cf6]/50 rotate-45 bg-[#8b5cf6]/10"></div>
         <div className="absolute right-[10%] w-20 h-20 rounded-full border-2 border-[#3b82f6]/50 flex items-center justify-center bg-[#3b82f6]/10 backdrop-blur-md">
            <Sparkles size={24} className="text-[#60a5fa]" />
         </div>
         <svg className="absolute inset-0 w-full h-full pointer-events-none"><line x1="30%" y1="50%" x2="70%" y2="50%" stroke="#8b5cf6" strokeWidth="4" /></svg>
      </div>
    )}
  </div>
);


// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export default function SkillsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [skills, setSkills] = useState([]);
  const [activeSkill, setActiveSkill] = useState(null);
  const [activities, setActivities] = useState({});
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showSkillManager, setShowSkillManager] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getSkillsDashboard();
      setSkills(data.skills || []);
      setActivities(data.activities || {});
      setSubmissions(data.submissions || []);
      if (data.skills?.length > 0) setActiveSkill(data.skills[0]);
    } catch (err) {
      console.error(err);
      showToast('Failed to load skills', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleActivitySubmit = async (activity, responseText) => {
    try {
      if (typeof activity.id !== 'number') {
        await new Promise(r => setTimeout(r, 600));
      } else {
        await api.submitSkillEvidence(activity.id, responseText);
      }
      
      const newSubmission = {
        id: Date.now(),
        skill_name: activeSkill.name,
        context: activity.context,
        title: activity.title,
        response_text: responseText,
        saved_at: new Date().toISOString()
      };
      setSubmissions(prev => [newSubmission, ...prev]);
      setSelectedActivity(null);
      showToast('Evidence saved successfully!');
    } catch (err) {
      showToast('Failed to save evidence', 'error');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center text-white">Loading...</div>;
  }

  const isReturning = skills.length > 0 || submissions.length > 0;
  
  const currentActivities = activeSkill 
    ? (activities[activeSkill.name] || getFallbackActivities(activeSkill.name))
    : null;

  const recentSubmission = submissions[0];
  const hasCompletedPractice = submissions.some(s => s.skill_name === activeSkill?.name);
  const firstName = (user?.full_name || user?.username || 'Learner').split(' ')[0];

  return (
    <ErrorBoundary title="Skills page failed to load">
      <div className="min-h-screen bg-[var(--bg-primary)] pb-24 font-sans text-[var(--text-primary)]">
        
        {/* ─── HEADER ───────────────────────────────────────────── */}
        <header className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 lg:pt-8 pb-4 flex items-start justify-between gap-4">
          <div className="flex flex-col">
            {!isReturning && <p className="text-sm text-[var(--text-secondary)] mb-1">Welcome</p>}
            <h1 className="text-[26px] lg:text-3xl font-bold text-white tracking-tight">
              {isReturning ? `Skills Dashboard` : `Ready to start learning, ${firstName}?`}
            </h1>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={() => setShowSkillManager(true)} className="p-2 rounded-full bg-[#1e1e28] border border-[var(--border)] hover:border-[var(--accent)] text-white transition-colors" title="Manage Skills">
              <Settings2 size={18} />
            </button>
            <div className="relative p-[2px] rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#3b82f6] shadow-[0_0_15px_rgba(139,92,246,0.3)] shrink-0">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full overflow-hidden bg-[#1a1a20] flex items-center justify-center relative">
                <HolographicAvatar size={40} />
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <ConnectedNodeGraphic returning={isReturning} />
        </div>

        {/* ─── MAIN CONTENT ─────────────────────────────────────── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
          
          {!isReturning ? (
            // ─── FIRST-TIME LAYOUT ───
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-xl lg:text-2xl font-bold text-white mb-6">What do you want to understand?</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-[#1e1e28] border border-[var(--border)] rounded-2xl p-5 hover:border-[#8b5cf6]/50 transition-colors flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white mb-1">Add your first Skill</h3>
                    <p className="text-xs text-gray-400 mb-6">What do you want to track and prove?</p>
                  </div>
                  <button onClick={() => setShowSkillManager(true)} className="self-start px-4 py-2 bg-[#2d2d3d] hover:bg-[#3d3d4d] text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors">
                    Start now <ArrowRight size={14} />
                  </button>
                </div>

                <div className="bg-[#1e1e28] border border-[var(--border)] rounded-2xl p-5 hover:border-[#3b82f6]/50 transition-colors flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white mb-1">Find a Practical Problem</h3>
                    <p className="text-xs text-gray-400 mb-6">Explore the areas and find a practical problem.</p>
                  </div>
                  <button onClick={() => window.location.href='/orbit'} className="self-start px-4 py-2 bg-[#2d2d3d] hover:bg-[#3d3d4d] text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors">
                    Find a way <ArrowRight size={14} />
                  </button>
                </div>

                <div className="bg-[#1e1e28] border border-[var(--border)] rounded-2xl p-2 flex flex-col justify-center gap-1">
                   <div className="flex justify-between items-center px-3 py-2 hover:bg-white/5 rounded-lg cursor-default">
                      <span className="text-sm font-medium text-gray-300">Learning</span>
                      <ChevronRight size={16} className="text-gray-500" />
                   </div>
                   <div className="flex justify-between items-center px-3 py-2 hover:bg-white/5 rounded-lg cursor-default border-t border-white/5">
                      <span className="text-sm font-medium text-gray-300">Capability</span>
                      <ChevronRight size={16} className="text-gray-500" />
                   </div>
                   <div className="flex justify-between items-center px-3 py-2 hover:bg-white/5 rounded-lg cursor-default border-t border-white/5">
                      <span className="text-sm font-medium text-gray-300">Opportunity</span>
                      <ChevronRight size={16} className="text-gray-500" />
                   </div>
                </div>
              </div>
            </div>
          ) : (
            // ─── RETURNING USER LAYOUT ───
            <div className="animate-in fade-in duration-500">
              <h2 className="text-sm font-semibold text-gray-400 mb-3">Conteboard</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Active Skill / Current Focus */}
                <div className="bg-[#1e1e28] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--accent)] transition-colors flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-white">Active Skill</h3>
                    <Settings2 size={14} className="text-gray-500" onClick={() => setShowSkillManager(true)} />
                  </div>
                  {activeSkill ? (
                    <>
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2 capitalize">{activeSkill.name}</p>
                      <div className="mt-auto">
                        <p className="text-[10px] text-gray-500 mb-2">Progressing through evidence</p>
                        <button onClick={() => setActiveSkill(skills[0])} className="w-full py-2 bg-[#2d2d3d] hover:bg-[#3d3d4d] text-white text-xs font-medium rounded-lg transition-colors">
                          Switch Skill
                        </button>
                      </div>
                    </>
                  ) : (
                     <p className="text-sm text-gray-500 my-auto py-4">No active skill.</p>
                  )}
                </div>

                {/* Practical Challenge */}
                <div className="bg-[#1e1e28] border border-[var(--border)] rounded-2xl p-5 hover:border-[#3b82f6] transition-colors flex flex-col">
                  <h3 className="font-semibold text-white mb-2">Practical Challenge</h3>
                  <p className="text-xs text-gray-400 mb-4 flex-1 line-clamp-3">
                    {currentActivities?.practice?.['everyday']?.title || 'Apply your skill in everyday life.'}
                  </p>
                  <span className="self-start px-2 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-semibold rounded-md mb-3">Learning</span>
                </div>

                {/* Relevant Task / Evidence */}
                <div className="bg-[#1e1e28] border border-[var(--border)] rounded-2xl p-5 hover:border-[#3b82f6] transition-colors flex flex-col">
                  <h3 className="font-semibold text-white mb-2">My Evidence</h3>
                  <p className="text-xs text-gray-400 mb-4 flex-1 line-clamp-3">
                    {recentSubmission ? `"${recentSubmission.response_text}"` : 'No evidence saved yet. Start a challenge.'}
                  </p>
                  <span className="self-start px-2 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-semibold rounded-md mb-3">Demonstrability</span>
                </div>

                {/* Upcoming Commitments */}
                <div className="bg-[#1e1e28] border border-[var(--border)] rounded-2xl p-5 hover:border-[#8b5cf6] transition-colors flex flex-col">
                  <h3 className="font-semibold text-white mb-2">Transfer Challenge</h3>
                  <p className="text-xs text-gray-400 mb-4 flex-1 line-clamp-3">
                     {hasCompletedPractice ? currentActivities?.followup?.title : 'Complete a challenge above to unlock.'}
                  </p>
                  <p className="text-[10px] text-gray-500">Apply in a new context</p>
                </div>

                {/* Next Useful Action */}
                <div className="bg-[#1e1e28] border border-[var(--border)] rounded-2xl p-5 hover:border-[#3b82f6] transition-colors flex flex-col">
                  <h3 className="font-semibold text-white mb-2">Next Useful Action</h3>
                  <p className="text-xs text-gray-400 mb-4 flex-1 line-clamp-3">
                    Based on your activity, try the practical challenge for {activeSkill?.name}.
                  </p>
                  <button onClick={() => setSelectedActivity(currentActivities?.practice?.['everyday'])} className="self-start text-xs text-[#8b5cf6] font-medium hover:underline">
                    Start challenge
                  </button>
                </div>

                {/* Developing Capability */}
                <div className="bg-[#1e1e28] border border-[var(--border)] rounded-2xl p-5 hover:border-[#8b5cf6] transition-colors flex flex-col">
                  <h3 className="font-semibold text-white mb-2">Developing Capability</h3>
                  <p className="text-xs text-gray-400 mb-4 flex-1 line-clamp-3">
                    Building demonstrable capability from completed work.
                  </p>
                  <span className="self-start px-2 py-1 bg-purple-500/10 text-purple-400 text-[10px] font-semibold rounded-md mb-3">Demonstrability</span>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>

      {selectedActivity && (
        <ActivityModal
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
          onSubmit={handleActivitySubmit}
        />
      )}

      {showSkillManager && (
        <SkillManagerModal 
          onClose={() => setShowSkillManager(false)} 
          onRefresh={loadData} 
        />
      )}
    </ErrorBoundary>
  );
}