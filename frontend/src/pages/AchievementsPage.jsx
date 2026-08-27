import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Loader2, Award, Lock, Unlock } from 'lucide-react';

// Predefined badge definitions with icons
const BADGE_DEFINITIONS = [
  { id: 1, name: 'First Challenge', icon: '🏅', description: 'Completed your first challenge' },
  { id: 2, name: 'Consistent Learner', icon: '📚', description: 'Maintained a 7-day learning streak' },
  { id: 3, name: 'Study Group Contributor', icon: '👥', description: 'Helped in a study group' },
  { id: 4, name: 'Community Builder', icon: '🏗️', description: 'Created a community or group' },
  { id: 5, name: 'Mathematics Mastery', icon: '📐', description: 'Mastered a math topic' },
  { id: 6, name: 'Coding Explorer', icon: '💻', description: 'Completed a coding project' },
  { id: 7, name: 'Project Creator', icon: '🚀', description: 'Created a project' },
];

export default function AchievementsPage() {
  const { user } = useAuth();
  const [earnedBadgeIds, setEarnedBadgeIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      const res = await api.getMyBadges(); // returns array of earned badges
      const ids = res.map(b => b.id);
      setEarnedBadgeIds(ids);
    } catch (err) {
      setError('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-400" size={40} /></div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Award size={28} className="text-yellow-400" />
        <h1 className="text-3xl font-bold">🏅 Achievements</h1>
      </div>
      <p className="text-white/60 mb-6">Earn badges by completing meaningful milestones.</p>

      {error && <p className="text-red-400">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {BADGE_DEFINITIONS.map(badge => {
          const earned = earnedBadgeIds.includes(badge.id);
          return (
            <div
              key={badge.id}
              className={`card p-4 text-center transition-all ${
                earned ? 'border-brand-400/30' : 'border-white/10 opacity-60'
              }`}
            >
              <div className="text-5xl mb-2">{badge.icon}</div>
              <h3 className="font-semibold text-sm">{badge.name}</h3>
              <p className="text-xs text-white/40">{badge.description}</p>
              <div className="mt-2 text-xs">
                {earned ? (
                  <span className="text-green-400 flex items-center justify-center gap-1">
                    <Unlock size={14} /> Earned
                  </span>
                ) : (
                  <span className="text-white/30 flex items-center justify-center gap-1">
                    <Lock size={14} /> Locked
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}