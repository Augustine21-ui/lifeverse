// frontend/src/pages/SkillsPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import ErrorBoundary from '../components/ErrorBoundary';
import {
  Home, BookOpen, Users, ArrowRight, X, CheckCircle, 
  Sparkles, Briefcase, ChevronDown, Award, Compass, Plus
} from 'lucide-react';

// High-quality placeholder images for the contexts
const CONTEXT_IMAGES = {
  everyday: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=400&h=250',
  school: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=400&h=250',
  community: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=400&h=250',
};

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
      <div className="w-full max-w-lg bg-white rounded-3xl flex flex-col overflow-hidden shadow-2xl h-[85vh] sm:h-auto sm:max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#4a2c9e] to-[#6b46c1] p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={step === 1 ? onClose : () => setStep(1)} className="p-1 hover:bg-white/20 rounded-full transition">
              <ArrowRight size={20} className="rotate-180" />
            </button>
            <div>
              <p className="text-xs font-medium text-white/80 uppercase tracking-wider">
                {activity.context === 'everyday' ? 'Everyday Life' : activity.context}
              </p>
              <h2 className="text-lg font-bold">{activity.title}</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto bg-gray-50 flex flex-col gap-5">
          
          {step === 1 ? (
            <>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">The Challenge</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{activity.prompt}</p>
              </div>
              
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Initial serves</label>
                  <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900" placeholder="4" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New serves</label>
                  <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900" placeholder="8" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Orig. flour</label>
                    <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900" placeholder="2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Final flour</label>
                    <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-900" placeholder="4" />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Show what you did</h3>
                <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                  <span className="w-4 h-4 rounded-full border-2 border-purple-600 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                  </span>
                  Your solution explanation
                </div>
                <textarea
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-900 min-h-[120px] resize-none focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="How did you use fractions to solve this problem?"
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                />
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-500 bg-gray-50 cursor-pointer hover:bg-gray-100 transition">
                <Plus size={24} className="mb-2" />
                <span className="text-sm font-medium">Add photo of calculation</span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 bg-white border-t border-gray-100 shrink-0">
          <button
            onClick={step === 1 ? handleNext : handleSubmit}
            disabled={step === 2 && (!response.trim() || submitting)}
            className="w-full py-3.5 bg-[#4a2c9e] text-white font-semibold rounded-xl hover:bg-[#3a1c7e] transition-colors disabled:opacity-50"
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
  const navigate = useNavigate();
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
      showToast('Evidence saved successfully!');
    } catch (err) {
      showToast('Failed to save evidence', 'error');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white">Loading...</div>;
  }

  const currentActivities = activeSkill ? activities[activeSkill.name] : null;
  const recentSubmission = submissions[0];
  const hasCompletedPractice = submissions.some(s => s.skill_name === activeSkill?.name);

  return (
    <ErrorBoundary title="Skills page failed to load">
      <div className="min-h-screen bg-[#f8f9fc] pb-24 font-sans">
        
        {/* ─── HERO SECTION ─────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-[#1e1b4b] via-[#4c1d95] to-[#312e81] pt-20 pb-32 px-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="max-w-5xl mx-auto relative z-10">
            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
              Skills in Real Life
            </h1>
            <p className="text-lg text-purple-200 max-w-xl">
              Discover what you can do. Put your skills into action.
            </p>
          </div>
        </div>

        {/* ─── MAIN CONTENT ─────────────────────────────────────── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-20 relative z-20 space-y-6">
          
          {/* Skill Selector Tabs */}
          <div className="flex overflow-x-auto gap-3 pb-2 hide-scrollbar">
            {skills.map(skill => (
              <button
                key={skill.id}
                onClick={() => setActiveSkill(skill)}
                className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all whitespace-nowrap shadow-sm ${
                  activeSkill?.id === skill.id 
                    ? 'bg-[#4a2c9e] text-white shadow-md scale-105' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {skill.name}
              </button>
            ))}
          </div>

          {/* ─── ONE SKILL, THREE REAL-LIFE CHOICES ─────────────── */}
          {activeSkill && currentActivities && (
            <div className="bg-white rounded-[2rem] p-6 sm:p-10 shadow-xl shadow-purple-900/5 border border-gray-100">
              <div className="text-center mb-10 relative">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">One Skill, Three Real-Life Choices</h2>
                <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-[#eef2ff] text-[#4a2c9e] font-semibold border border-[#c7d2fe] relative z-10">
                  <Award size={18} /> {activeSkill.name}
                </div>
                {/* Decorative connecting lines (Desktop) */}
                <div className="hidden md:block absolute top-[70px] left-1/4 right-1/4 h-px bg-gray-200" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                {['everyday', 'school', 'community'].map((ctx) => {
                  const activity = currentActivities.practice?.[ctx];
                  if (!activity) return null;
                  
                  return (
                    <div 
                      key={ctx}
                      className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden hover:border-[#4a2c9e] transition-all group cursor-pointer flex flex-col relative"
                      onClick={() => setSelectedActivity(activity)}
                    >
                      <div className="h-40 overflow-hidden relative">
                        <img src={CONTEXT_IMAGES[ctx]} alt={ctx} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-[#4a2c9e] flex items-center gap-1">
                          <Compass size={12} /> select
                        </div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col text-center">
                        <h3 className="font-bold text-lg text-gray-900 mb-1 capitalize">
                          {ctx === 'everyday' ? 'Everyday Life' : ctx}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4 flex-1">explore this scenario</p>
                        
                        {submissions.some(s => s.title === activity.title) ? (
                          <div className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-green-600 bg-green-50 py-2 rounded-lg">
                            <CheckCircle size={16} /> Completed
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-[#4a2c9e] bg-purple-50 py-2 rounded-lg group-hover:bg-[#4a2c9e] group-hover:text-white transition-colors">
                            Start Activity <ArrowRight size={16} />
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
            <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-lg border border-gray-100 flex flex-col">
              <h2 className="text-xl font-bold text-gray-900 mb-6">My Evidence</h2>
              {recentSubmission ? (
                <div className="flex gap-4 items-start">
                  <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center shrink-0">
                     <Briefcase size={28} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm leading-relaxed mb-1">
                      "{recentSubmission.response_text}"
                    </p>
                    <button className="text-[#4a2c9e] text-sm font-semibold hover:underline">
                      View full reflection & evidence
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-6 text-gray-400">
                  <Briefcase size={32} className="mb-3 opacity-50" />
                  <p className="text-sm">No evidence saved yet.</p>
                  <p className="text-xs mt-1">Select a context above to start.</p>
                </div>
              )}
            </div>

            {/* Try It Somewhere New */}
            {currentActivities?.followup && (
              <div className={`rounded-[2rem] p-6 sm:p-8 shadow-lg border transition-all flex flex-col ${
                hasCompletedPractice ? 'bg-gradient-to-br from-[#f5f3ff] to-white border-[#ddd6fe]' : 'bg-gray-50 border-gray-200 opacity-70'
              }`}>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Try It Somewhere New</h2>
                <p className="text-sm text-gray-600 mb-6 flex-1">
                  {hasCompletedPractice 
                    ? `New Challenge: ${currentActivities.followup.title}`
                    : 'Complete an activity above to unlock a new challenge.'}
                </p>
                <button
                  onClick={() => setSelectedActivity(currentActivities.followup)}
                  disabled={!hasCompletedPractice}
                  className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                    hasCompletedPractice 
                      ? 'bg-[#4a2c9e] text-white hover:bg-[#3a1c7e]' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
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