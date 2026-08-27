// frontend/src/components/SkillGrowth/ChallengesTab.jsx
import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Loader2, Send } from 'lucide-react';

export default function ChallengesTab({ skillId, userId }) {
  const [challenges, setChallenges] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [submissionText, setSubmissionText] = useState('');

  useEffect(() => {
    loadData();
  }, [skillId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [challengesRes, submissionsRes] = await Promise.all([
        api.get(`/skills/${skillId}/challenges`),
        api.get(`/skills/${skillId}/my-challenges`)
      ]);
      setChallenges(challengesRes);
      setSubmissions(submissionsRes);
    } catch (err) {
      console.error('Error loading challenges:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (challengeId) => {
    try {
      await api.post('/challenges/submit', { challengeId, submission_text: submissionText });
      await loadData();
      setSelectedChallenge(null);
      setSubmissionText('');
    } catch (err) {
      alert(err.error || 'Failed to submit challenge');
    }
  };

  if (loading) return <Loader2 className="animate-spin text-brand-400" size={24} />;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Challenges</h3>
      {challenges.length === 0 ? (
        <p className="text-white/40">No challenges available for this skill yet.</p>
      ) : (
        <div className="space-y-3">
          {challenges.map(ch => {
            const submission = submissions.find(s => s.challenge_id === ch.id);
            return (
              <div key={ch.id} className="bg-white/5 p-3 rounded-lg">
                <div className="flex justify-between">
                  <div>
                    <h4 className="font-medium">{ch.title}</h4>
                    <p className="text-sm text-white/60">{ch.description}</p>
                    <p className="text-xs text-white/40">Difficulty: {ch.difficulty_level} | XP: {ch.xp_reward}</p>
                  </div>
                  <div>
                    {submission ? (
                      <span className={`px-2 py-1 rounded text-xs ${
                        submission.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        submission.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {submission.status}
                      </span>
                    ) : (
                      <button
                        onClick={() => setSelectedChallenge(ch.id)}
                        className="btn-primary text-sm flex items-center gap-1"
                      >
                        <Send size={14} /> Submit
                      </button>
                    )}
                  </div>
                </div>
                {selectedChallenge === ch.id && !submission && (
                  <div className="mt-2 bg-white/5 p-2 rounded">
                    <textarea
                      className="input w-full text-sm"
                      rows="3"
                      placeholder="Describe your solution or upload a link..."
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleSubmit(ch.id)}
                        className="btn-primary text-sm"
                      >
                        Submit
                      </button>
                      <button
                        onClick={() => setSelectedChallenge(null)}
                        className="btn-secondary text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}