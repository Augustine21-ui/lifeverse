// frontend/src/pages/SkillsPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api
import { useToast } from '../context/ToastContext';
import ErrorBoundary from '../components/ErrorBoundary';
import {
  Home, BookOpen, Users, ArrowRight, X, CheckCircle, 
  Sparkles, Briefcase, Compass, Plus, ArrowLeft
} from 'lucide-react';

// High-quality placeholder images for the contexts
const CONTEXT_IMAGES = {
  everyday: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=400&h=250',
  school: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=400&h=250',
  community: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=400&h=250',
};

// Fallback generator if DB is empty
const getFallbackActivities = (skillName) => ({
  practice: {
    everyday: { id: 'f1', context: 'everyday', title: 'Practical Application', prompt: `How would you apply ${skillName} in your daily life? Describe a scenario and your solution.` },
    school: { id: 'f2', context: 'school', title: 'Classroom Scenario', prompt: `How would you use ${skillName} to solve a problem at school or in your studies?` },
    community: { id: 'f3', context: 'community', title: 'Community Impact', prompt: `How could ${skillName} be used to improve something in your local community?` },
  },
  followup: { id: 'f4', context: 'school', title: 'Transfer Challenge', prompt: `Now try to apply ${skillName} in a completely different subject or situation.` }
});

// ─── Activity Modal (Mimics Mobile Flow) ──────────────────────
function ActivityModal({ activity, onClose, onSubmit }) {
  const [step, setStep] = useState(1);
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleNext = () => setStep(2);
  
  const handleSubmit = async () => {
    if (!response.trim()) return;
    setSubmitting(true);
    await onSubmit(activity, response);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl flex flex-col overflow-hidden shadow-2xl h-[85vh] sm:h-auto sm:max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#1a1a24] p-5 border-b border-[var(--border)] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={step === 1 ? onClose : () => setStep(1)} className="p-1.5 hover:bg-white/10 rounded-full transition text-white/70">
              <ArrowLeft size={20} />
            </button>
            <div>
              <p className="text-[11px] font-semibold text-[var(--accent)] uppercase tracking-wider mb-0.5">
                {activity.context === 'everyday' ? 'Everyday Life' : activity.context}
              </p>
              <h2 className="text-lg font-bold leading-tight">{activity.title}</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition text-white/70">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto bg-[var(--bg-primary)] flex flex-col gap-5">
          
          {step === 1 ? (
            <>
              <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border)]">
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">The Challenge</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{activity.prompt}</p>
              </div>
              
              <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border)] space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Initial thought / input</label>
                  <input type="text" className="w-full bg-[#121218] border border-[var(--border)] rounded-lg p-3 text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors" placeholder="e.g., 4" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Final calculation</label>
                  <input type="text" className="w-full bg-[#121218] border border-[var(--border)] rounded-lg p-3 text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors" placeholder="e.g., 8" />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border)]">
                <h3 className="font-semibold text-[var(--text-primary)] mb-3">Show what you did</h3>
                <div className="flex items-center gap-2 mb-4 text-sm text-[var(--text-secondary)]">
                  <span className="w-4 h-4 rounded-full border-2 border-[var(--accent)] flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-[var(--accent)]"></span>
                  </span>
                  Your solution explanation
                </div>
                <textarea
                  className="w-full bg-[#121218] border border-[var(--border)] rounded-xl p-4 text-sm text-[var(--text-primary)] min-h-[120px] resize-none focus:border-[var(--accent)] outline-none"
                  placeholder="How did you solve this problem?"
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                />
              </div>
              
              <div className="border-2 border-dashed border-[var(--border)] rounded-2xl p-6 flex flex-col items-center justify-center text-[var(--text-muted)] bg-[var(--bg-card)] cursor-pointer hover:bg-white/5 transition">
                <Plus size={24} className="mb-2" />
                <span className="text-sm font-medium">Add photo of calculation</span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 bg-[#1a1a24] border-t border-[var(--border)] shrink-0">
          <button
            onClick={step === 1 ? handleNext : handleSubmit}
            disabled={step === 2 && (!response.trim() || submitting)}
            className="w-full py-3.5 bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
          >
            {step === 1 ? 'Submit' : submitting ? 'Saving...' : 'Save to My Evidence'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────
export default function SkillsPage() {
  const { showToast } = useToast();

  const [skills, setSkills] = useState([]);
  const [activeSkill, setActiveSkill] = useState(null);
  const [activities, setActivities] = useState({});
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState(null);

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
      // If it's a fallback activity (ID is a string like 'f1'), skip API
      if (typeof activity.id !== 'number') {
        await new Promise(r => setTimeout(r, 600)); // Simulate API
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

  // Determine activities: use DB if available, else use fallback so UI never breaks
  const currentActivities = activeSkill 
    ? (activities[activeSkill.name] || getFallbackActivities(activeSkill.name))
    : null;

  const recentSubmission = submissions[0];
  const hasCompletedPractice = submissions.some(s => s.skill_name === activeSkill?.name);

  return (
    <ErrorBoundary title="Skills page failed to load">
      <div className="min-h-screen bg-[var(--bg-primary)] pb-24 font-sans text-[var(--text-primary)]">
        
        {/* ─── HERO SECTION ─────────────────────────────────────── */}
        <div className="bg-gradient-to-b from-[#2e1065] to-[var(--bg-primary)] pt-16 pb-8 px-4 sm:px-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3" />
          <div className="max-w-5xl mx-auto relative z-10">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">
              Skills in Real Life
            </h1>
            <p className="text-base md:text-lg text-[var(--text-secondary)] max-w-xl">
              Discover what you can do. Put your skills into action.
            </p>
          </div>
        </div>

        {/* ─── MAIN CONTENT ─────────────────────────────────────── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
          
          {/* Skill Selector Tabs */}
          <div className="flex overflow-x-auto gap-3 pb-2" style={{ scrollbarWidth: 'none' }}>
            {skills.map(skill => (
              <button
                key={skill.id}
                onClick={() => setActiveSkill(skill)}
                className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all whitespace-nowrap border ${
                  activeSkill?.id === skill.id 
                    ? 'bg-[var(--bg-card)] text-[var(--accent)] border-[var(--accent)] shadow-[0_0_15px_rgba(139,92,246,0.15)]' 
                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--text-muted)]'
                }`}
              >
                {skill.name}
              </button>
            ))}
          </div>

          {/* ─── ONE SKILL, THREE REAL-LIFE CHOICES ─────────────── */}
          {activeSkill && currentActivities && (
            <div className="bg-[var(--bg-card)] rounded-[2rem] p-5 sm:p-8 border border-[var(--border)] shadow-lg">
              <div className="text-center mb-8 relative">
                <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-3">One Skill, Three Real-Life Choices</h2>
                <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-[rgba(139,92,246,0.1)] text-[var(--accent)] font-semibold border border-[rgba(139,92,246,0.3)] relative z-10">
                  <Sparkles size={16} /> {activeSkill.name}
                </div>
                {/* Decorative connecting lines (Desktop) */}
                <div className="hidden md:block absolute top-[60px] left-1/4 right-1/4 h-px bg-[var(--border)]" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
                {['everyday', 'school', 'community'].map((ctx) => {
                  const activity = currentActivities.practice?.[ctx];
                  if (!activity) return null;
                  
                  return (
                    <div 
                      key={ctx}
                      className="bg-[#121218] rounded-2xl border border-[var(--border)] overflow-hidden hover:border-[var(--accent)] transition-all group cursor-pointer flex flex-col relative"
                      onClick={() => setSelectedActivity(activity)}
                    >
                      <div className="h-32 sm:h-40 overflow-hidden relative">
                        <img src={CONTEXT_IMAGES[ctx]} alt={ctx} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#121218] to-transparent opacity-80" />
                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1 border border-white/10">
                          <Compass size={10} /> select
                        </div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col text-center relative z-10 -mt-4">
                        <h3 className="font-bold text-lg text-white mb-1 capitalize">
                          {ctx === 'everyday' ? 'Everyday Life' : ctx}
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)] mb-4 flex-1">explore this scenario</p>
                        
                        {submissions.some(s => s.title === activity.title) ? (
                          <div className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-green-400 bg-green-400/10 py-2 rounded-lg border border-green-400/20">
                            <CheckCircle size={14} /> Completed
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--accent)] bg-[rgba(139,92,246,0.1)] py-2 rounded-lg group-hover:bg-[var(--accent)] group-hover:text-white transition-colors">
                            Start Activity <ArrowRight size={14} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── BOTTOM SECTION (Evidence & Follow-up) ──────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
            
            {/* My Evidence */}
            <div className="bg-[var(--bg-card)] rounded-[2rem] p-6 sm:p-8 border border-[var(--border)] shadow-lg flex flex-col min-h-[220px]">
              <h2 className="text-lg font-bold text-[var(--text-primary)] mb-5">My Evidence</h2>
              {recentSubmission ? (
                <div className="flex gap-4 items-start">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                     <Briefcase size={24} className="text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[var(--text-secondary)] text-sm leading-relaxed mb-2 line-clamp-3">
                      "{recentSubmission.response_text}"
                    </p>
                    <button className="text-[var(--accent)] text-xs font-semibold hover:underline">
                      View full reflection & evidence
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-[var(--text-muted)]">
                  <Briefcase size={32} className="mb-3 opacity-30" />
                  <p className="text-sm font-medium text-white/70">No evidence saved yet.</p>
                  <p className="text-xs mt-1">Select a context above to start.</p>
                </div>
              )}
            </div>

            {/* Try It Somewhere New */}
            {currentActivities?.followup && (
              <div className={`rounded-[2rem] p-6 sm:p-8 border transition-all flex flex-col min-h-[220px] ${
                hasCompletedPractice 
                  ? 'bg-gradient-to-br from-[rgba(139,92,246,0.1)] to-[var(--bg-card)] border-[var(--accent)] shadow-[0_0_30px_rgba(139,92,246,0.1)]' 
                  : 'bg-[var(--bg-card)] border-[var(--border)] opacity-70'
              }`}>
                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">Try It Somewhere New</h2>
                <p className="text-sm text-[var(--text-secondary)] mb-5 flex-1 leading-relaxed">
                  {hasCompletedPractice 
                    ? `New Challenge: ${currentActivities.followup.title}`
                    : 'Complete an activity above to unlock a new challenge.'}
                </p>
                <button
                  onClick={() => setSelectedActivity(currentActivities.followup)}
                  disabled={!hasCompletedPractice}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors ${
                    hasCompletedPractice 
                      ? 'bg-[var(--accent)] text-white hover:opacity-90' 
                      : 'bg-white/5 text-[var(--text-muted)] cursor-not-allowed'
                  }`}
                >
                  {submissions.some(s => s.title === currentActivities?.followup?.title) 
                    ? 'Try this challenge again' 
                    : 'Try this challenge'}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Render Modal */}
      {selectedActivity && (
        <ActivityModal
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
          onSubmit={handleActivitySubmit}
        />
      )}
    </ErrorBoundary>
  );
}