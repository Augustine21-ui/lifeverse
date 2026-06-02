// frontend/src/pages/BadgesPage.jsx
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function BadgesPage() {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBadges()
      .then(setBadges)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 flex justify-center"><Loader2 className="animate-spin text-brand-400" size={40} /></div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Badges</h1>
      {badges.length === 0 ? (
        <div className="card text-center py-16">No badges available.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map(badge => (
            <div key={badge.id} className={`card p-4 text-center ${badge.earned ? 'border-brand-500/50' : 'opacity-60'}`}>
              <div className="text-4xl mb-2 relative">
                {badge.icon}
                {badge.earned && <CheckCircle size={20} className="absolute -top-2 -right-2 text-green-500 bg-white rounded-full" />}
              </div>
              <h3 className="font-semibold">{badge.name}</h3>
              <p className="text-sm text-white/60">{badge.description}</p>
              <p className="text-xs text-amber-400 mt-2">+{badge.xp_reward} XP</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}