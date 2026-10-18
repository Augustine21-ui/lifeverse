// frontend/src/pages/SkillsPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import ErrorBoundary from '../components/ErrorBoundary';
import {
  BookOpen, Target, Home, Users, ArrowRight, X, Clock, 
  Briefcase, Sparkles, CheckCircle, Compass, AlertCircle
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

const ContextIcon = ({ context }) => {
  if (context === 'everyday') return <Home size={18} />;
  if (context === 'school') return <BookOpen size={18} />;
  return <Users size={18} />;
};

const ContextLabel = ({ context }) => {
  if (context === 'everyday') return 'Everyday Life';
  if (context === 'school') return 'School';
  return 'Community';
};

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0a0a0f] border border-[var(--border)] rounded-t-3xl sm:rounded-3xl p-6 flex flex-col max-h-[90vh] shadow-2xl">
        
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1">
              <ContextIcon context={activity.context} /> {ContextLabel({ context: activity.context })}
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">{activity.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 text-[var(--text-muted)] hover:text-white rounded-full hover:bg-white/10 transition">
            <X size={20} />
          </button>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-xl mb-4 text-sm text-[var(--text-secondary)] leading-relaxed">
          {activity.prompt}
        </div>

        <div className="flex-1 overflow-y-auto mb-4">
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Your Evidence / Answer
          </label>
          <textarea
            className="w-full bg-[#121218] text-[var(--text-primary)] text-sm rounded-xl px-4 py-3 placeholder-[var(--text-muted)] outline-none border border-[var(--border)] focus:border-[var(--accent)] transition-colors min-h-[120px] resize-y"
            placeholder="Explain your approach or write your solution here..."
            value={response}
            onChange={(e) => setResponse(e.target.value)}
          />
          <p className="text-[11px] text-[var(--text-muted)] mt-2">
            KUA does not automatically grade this. You are saving this to your profile as proof of your work.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!response.trim() || submitting}
          className="w-full py-3.5 bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {submitting ? 'Saving...' : 'Submit Evidence'} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function SkillsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [skills, setSkills] = useState([]);
  const [activeSkill, setActiveSkill] = useState(null);
  const [activities, setActivities] = useState({});
  const [submissions, setSubmissions] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSkillsDashboard();
      
      setSkills(data.skills || []);
      setActivities(data.activities || {});
      setSubmissions(data.submissions || []);
      
      if (data.skills && data.skills.length > 0) {
        setActiveSkill(data.skills[0]);
      }
    } catch (err) {
      console.error('Failed to load skills:', err);
      setError(err?.message || 'Failed to load skills data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleActivitySubmit = async (activity, responseText) => {
    try {
      await api.submitSkillEvidence(activity.id, responseText);
      
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
      showToast('Evidence saved to your profile!');
    } catch (err) {
      showToast(err.message || 'Failed to save evidence', 'error');
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-[1000px] mx-auto pt-20 lg:pt-8">
        <div className="h-8 w-1/3 bg-[var(--bg-card)] rounded-lg skeleton-pulse mb-4" />
        <div className="flex gap-2 mb-8">
          <div className="h-10 w-24 bg-[var(--bg-card)] rounded-full skeleton-pulse" />
          <div className="h-10 w-24 bg-[var(--bg-card)] rounded-full skeleton-pulse" />
        </div>
        <div className="h-48 bg-[var(--bg-card)] rounded-2xl skeleton-pulse mb-4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-[1000px] mx-auto pt-20 text-center">
        <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white mb-2">Couldn't load Skills</h2>
        <p className="text-gray-400 mb-4">{error}</p>
        <button onClick={loadData} className="px-4 py-2 bg-[var(--accent)] text-white rounded-xl">
          Try Again
        </button>
      </div>
    );
  }

  if (skills.length === 0) {
    return (
      <div className="p-6 max-w-[1000px] mx-auto pt-20 text-center">
        <Target size={40} className="text-[var(--text-muted)] mx-auto mb-3 opacity-50" />
        <h2 className="text-lg font-bold text-white mb-2">No skills available yet</h2>
        <p className="text-gray-400 mb-4">Go to the Academic Hub to start learning and unlock skills.</p>
        <button onClick={() => navigate('/studysphere')} className="px-4 py-2 bg-[var(--accent)] text-white rounded-xl">
          Open Academic Hub
        </button>
      </div>
    );
  }

  const currentActivities = activeSkill ? activities[activeSkill.name] : null;
  
  // New Learner Check (No evidence submitted yet)
  const isNewLearner = submissions.length === 0;
  
  // Follow-up unlock logic
  const hasCompletedPractice = submissions.some(s => s.skill_name === activeSkill?.name && currentActivities?.followup && s.title !== currentActivities.followup.title);
  const hasCompletedFollowup = currentActivities?.followup && submissions.some(s => s.title === currentActivities.followup.title);

  return (
    <ErrorBoundary title="Skills page failed to load">
      <div className="max-w-[1000px] mx-auto px-4 lg:px-6 py-8 pb-24 pt-16 lg:pt-8">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-[var(--text-primary)] tracking-tight">Skills & Capability</h1>
          <p className="text-[15px] text-[var(--text-secondary)] mt-1 max-w-2xl leading-relaxed">
            KUA helps you apply what you learn in school to real-life situations. Choose a skill, complete a short activity, and save your evidence.
          </p>
        </div>

        {/* My Skills (Horizontal Scroll) */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <Compass size={16} className="text-[var(--accent)]" /> Select a Skill
          </h2>
          <div className="flex overflow-x-auto gap-2 pb-2 -mx-4 px-4 snap-x" style={{ scrollbarWidth: 'none' }}>
            {skills.map(skill => {
              const isActive = activeSkill?.id === skill.id;
              return (
                <button
                  key={skill.id}
                  onClick={() => setActiveSkill(skill)}
                  className={`snap-start shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all ${
                    isActive 
                      ? 'bg-[rgba(139,92,246,0.15)] border-[#8b5cf6] text-[#c084fc] shadow-[0_0_15px_rgba(139,92,246,0.15)]' 
                      : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  <span className="text-lg">{skill.icon}</span>
                  <span className="font-medium text-sm capitalize">{skill.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {activeSkill && currentActivities && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* FEATURE 1: Put a Skill to Use */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <Target size={16} className="text-[var(--accent)]" /> Put "{activeSkill.name}" to use
                </h2>
                <span className="text-xs text-[var(--text-muted)]">Choose a context</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {['everyday', 'school', 'community'].map(ctx => {
                  const activity = currentActivities.practice?.[ctx];
                  if (!activity) return null;
                  
                  const isCompleted = submissions.some(s => s.title === activity.title);
                  
                  return (
                    <button
                      key={ctx}
                      onClick={() => setSelectedActivity(activity)}
                      className={`bg-[var(--bg-card)] border rounded-2xl p-5 text-left transition-all group flex flex-col h-full relative ${
                        isCompleted ? 'border-green-500/30' : 'border-[var(--border)] hover:border-[var(--accent)]'
                      }`}
                    >
                      {isCompleted && (
                        <div className="absolute top-4 right-4 text-green-400">
                          <CheckCircle size={18} />
                        </div>
                      )}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${isCompleted ? 'bg-green-500/10 text-green-400' : 'bg-[rgba(139,92,246,0.1)] text-[var(--accent)]'}`}>
                        <ContextIcon context={ctx} />
                      </div>
                      <h3 className="font-semibold text-[var(--text-primary)] text-[15px] mb-1">{activity.title}</h3>
                      <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed flex-1">
                        {ContextLabel({ context: ctx })} application
                      </p>
                      <div className={`mt-4 text-xs font-medium flex items-center gap-1 ${isCompleted ? 'text-green-400' : 'text-[var(--accent)]'}`}>
                        {isCompleted ? 'View / Edit Evidence' : 'Start activity'} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FEATURE 3: Continue Practicing (Follow-up) */}
            {currentActivities.followup && (
              <div className="mb-8">
                <div className={`border rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                  hasCompletedPractice ? 'bg-gradient-to-r from-[rgba(139,92,246,0.08)] to-transparent border-[var(--accent)] shadow-[0_0_20px_rgba(139,92,246,0.05)]' : 'bg-[var(--bg-card)] border-[var(--border)] opacity-60'
                }`}>
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
                      <Sparkles size={14} /> Continue Practicing
                    </div>
                    <h3 className="font-semibold text-[var(--text-primary)] text-[15px]">
                      {hasCompletedPractice ? currentActivities.followup.title : 'Complete an activity above to unlock'}
                    </h3>
                    <p className="text-[13px] text-[var(--text-secondary)] mt-1 max-w-xl">
                      Apply this skill in a slightly different situation to prove you can transfer your knowledge.
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedActivity(currentActivities.followup)}
                    disabled={!hasCompletedPractice}
                    className={`shrink-0 px-4 py-2 border rounded-xl text-sm font-medium transition-colors ${
                      hasCompletedPractice 
                        ? 'bg-[#1e1e28] border-[var(--accent)] text-white hover:bg-[#2a2a35]' 
                        : 'bg-transparent border-[var(--border)] text-[var(--text-muted)] cursor-not-allowed'
                    }`}
                  >
                    {hasCompletedFollowup ? 'Practice Again' : 'Try Follow-up'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FEATURE 2: My Work (Evidence) */}
        <div className="mt-10 border-t border-[var(--border)] pt-8">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">My Work</h2>
          
          {isNewLearner ? (
            <div className="text-center py-12 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl border-dashed">
              <Briefcase size={32} className="text-[var(--text-muted)] mx-auto mb-3 opacity-50" />
              <h3 className="text-[var(--text-primary)] font-medium">No evidence saved yet</h3>
              <p className="text-[var(--text-secondary)] text-sm mt-1 max-w-sm mx-auto">
                Complete one of the activities above to start building proof of what you can do.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {submissions.map(sub => (
                <div key={sub.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/80 capitalize">
                        {sub.skill_name}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                        <ContextIcon context={sub.context} /> {ContextLabel({ context: sub.context })}
                      </span>
                    </div>
                    <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                      <Clock size={12} /> {new Date(sub.saved_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-semibold text-[var(--text-primary)] text-sm mb-2">{sub.title}</h4>
                  <div className="bg-[#121218] rounded-lg p-3 text-[13px] text-[var(--text-secondary)] line-clamp-3 leading-relaxed">
                    "{sub.response_text}"
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        {selectedActivity && (
          <ActivityModal
            activity={selectedActivity}
            onClose={() => setSelectedActivity(null)}
            onSubmit={handleActivitySubmit}
          />
        )}

      </div>
    </ErrorBoundary>
  );
}