// frontend/src/pages/ChallengesPage.jsx
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Loader2, CheckCircle, Clock, Zap, Send, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function ChallengesPage() {
  const { showToast } = useToast();
  const [challenges, setChallenges] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState({});
  const [submissionText, setSubmissionText] = useState({});
  const [modalChallenge, setModalChallenge] = useState(null);

  const loadData = async () => {
    try {
      const [challengesData, submissionsData] = await Promise.all([
        api.getChallenges(),
        api.getMyChallenges(),
      ]);
      setChallenges(challengesData);
      setMySubmissions(submissionsData);
    } catch (err) {
      console.error(err);
      showToast('Failed to load challenges', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (challengeId) => {
    const submission = submissionText[challengeId];
    if (!submission?.trim()) return;
    setSubmitting(prev => ({ ...prev, [challengeId]: true }));
    try {
      const res = await api.submitChallenge(challengeId, submission);
      showToast(res.message || `+${res.xpAwarded} XP earned!`);
      setSubmissionText(prev => ({ ...prev, [challengeId]: '' }));
      setModalChallenge(null);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(prev => ({ ...prev, [challengeId]: false }));
    }
  };

  const isSubmitted = (challengeId) => mySubmissions.some(sub => sub.challenge_id === challengeId);
  const getSubmissionStatus = (challengeId) => mySubmissions.find(s => s.challenge_id === challengeId)?.status || null;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="h-8 w-48 bg-white/10 animate-pulse rounded mb-6" />
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-6 w-3/4 bg-white/10 rounded mb-2" />
              <div className="h-4 w-full bg-white/10 rounded mb-2" />
              <div className="h-4 w-1/2 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Challenges</h1>
      <div className="grid gap-6">
        {challenges.map(challenge => {
          const submitted = isSubmitted(challenge.id);
          const status = getSubmissionStatus(challenge.id);
          return (
            <div key={challenge.id} className="card p-5">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold">{challenge.title}</h2>
                  <p className="text-white/60 mt-1">{challenge.description}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="badge bg-brand-500/20 text-brand-400">{challenge.category}</span>
                    <span className="badge bg-white/10 text-white/60">{challenge.difficulty}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-amber-400">
                  <Zap size={16} /><span className="font-medium">{challenge.xp_reward} XP</span>
                </div>
              </div>
              {submitted ? (
                <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2">
                    {status === 'pending' && <Clock size={16} className="text-yellow-400" />}
                    {status === 'completed' && <CheckCircle size={16} className="text-green-400" />}
                    <span className="capitalize">Status: {status}</span>
                  </div>
                  {status === 'completed' && <p className="text-green-400 text-sm mt-1">+{challenge.xp_reward} XP awarded</p>}
                </div>
              ) : (
                <button onClick={() => setModalChallenge(challenge)} className="mt-4 btn-primary">Start Challenge</button>
              )}
            </div>
          );
        })}
      </div>

      {modalChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && setModalChallenge(null)}>
          <div className="w-full max-w-md card p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Submit {modalChallenge.title}</h2>
              <button onClick={() => setModalChallenge(null)}><X size={20} /></button>
            </div>
            <textarea className="w-full input resize-none h-32" placeholder="Describe your solution, share a link, or upload a file link..." value={submissionText[modalChallenge.id] || ''} onChange={(e) => setSubmissionText({ ...submissionText, [modalChallenge.id]: e.target.value })} />
            <div className="mt-4 flex gap-3">
              <button onClick={() => setModalChallenge(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => handleSubmit(modalChallenge.id)} disabled={submitting[modalChallenge.id] || !submissionText[modalChallenge.id]?.trim()} className="btn-primary flex-1">
                {submitting[modalChallenge.id] ? <Loader2 size={16} className="animate-spin" /> : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}