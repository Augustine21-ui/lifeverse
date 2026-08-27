// frontend/src/components/SkillGrowth/PracticeTab.jsx
import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Loader2, Play, CheckCircle } from 'lucide-react';

export default function PracticeTab({ skillId, userId }) {
  const [activities, setActivities] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [score, setScore] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);

  useEffect(() => {
    loadData();
  }, [skillId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [activitiesRes, resultsRes] = await Promise.all([
        api.get(`/skills/${skillId}/practice`),
        api.get(`/skills/${skillId}/my-practice`)
      ]);
      setActivities(activitiesRes);
      setResults(resultsRes);
    } catch (err) {
      console.error('Error loading practice:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (activityId) => {
    try {
      await api.post('/practice/submit', { activityId, score, time_spent: timeSpent });
      await loadData();
      setSelectedActivity(null);
      setScore(0);
      setTimeSpent(0);
    } catch (err) {
      alert(err.error || 'Failed to submit practice result');
    }
  };

  if (loading) return <Loader2 className="animate-spin text-brand-400" size={24} />;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Practice Activities</h3>
      {activities.length === 0 ? (
        <p className="text-white/40">No practice activities available for this skill yet.</p>
      ) : (
        <div className="space-y-3">
          {activities.map(act => {
            const result = results.find(r => r.activity_id === act.id);
            return (
              <div key={act.id} className="bg-white/5 p-3 rounded-lg">
                <div className="flex justify-between">
                  <div>
                    <h4 className="font-medium">{act.title}</h4>
                    <p className="text-sm text-white/60">{act.description}</p>
                    <p className="text-xs text-white/40">Type: {act.type} | Difficulty: {act.difficulty_level}</p>
                  </div>
                  <div>
                    {result ? (
                      <span className="text-green-400 text-sm flex items-center gap-1">
                        <CheckCircle size={16} /> Score: {result.score}%
                      </span>
                    ) : (
                      <button
                        onClick={() => setSelectedActivity(act.id)}
                        className="btn-primary text-sm flex items-center gap-1"
                      >
                        <Play size={14} /> Take Practice
                      </button>
                    )}
                  </div>
                </div>
                {selectedActivity === act.id && !result && (
                  <div className="mt-2 bg-white/5 p-2 rounded">
                    <div className="flex gap-4 items-center">
                      <label className="text-sm">Score (%):</label>
                      <input
                        type="number"
                        className="input w-20 text-sm"
                        min="0"
                        max="100"
                        value={score}
                        onChange={(e) => setScore(parseInt(e.target.value) || 0)}
                      />
                      <label className="text-sm">Time (sec):</label>
                      <input
                        type="number"
                        className="input w-20 text-sm"
                        min="0"
                        value={timeSpent}
                        onChange={(e) => setTimeSpent(parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleSubmit(act.id)}
                        className="btn-primary text-sm"
                      >
                        Submit Result
                      </button>
                      <button
                        onClick={() => setSelectedActivity(null)}
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