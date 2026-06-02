import { useState, useEffect } from 'react';
import { Award, Lock } from 'lucide-react';
import { api } from '../services/api';

const BADGE_STYLES = {
  green: { earned: 'bg-green-500/15 border-green-500/30 text-green-400', locked: 'bg-white/[0.03] border-white/10 text-white/20' },
  purple: { earned: 'bg-violet-500/15 border-violet-500/30 text-violet-400', locked: 'bg-white/[0.03] border-white/10 text-white/20' },
  amber: { earned: 'bg-amber-500/15 border-amber-500/30 text-amber-400', locked: 'bg-white/[0.03] border-white/10 text-white/20' },
  coral: { earned: 'bg-orange-500/15 border-orange-500/30 text-orange-400', locked: 'bg-white/[0.03] border-white/10 text-white/20' },
  blue: { earned: 'bg-brand-500/15 border-brand-500/30 text-brand-400', locked: 'bg-white/[0.03] border-white/10 text-white/20' },
  teal: { earned: 'bg-teal-500/15 border-teal-500/30 text-teal-400', locked: 'bg-white/[0.03] border-white/10 text-white/20' },
  red: { earned: 'bg-red-500/15 border-red-500/30 text-red-400', locked: 'bg-white/[0.03] border-white/10 text-white/20' },
};

const CATEGORIES = ['all', 'goals', 'streak', 'social', 'level'];

export default function BadgesPage() {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.getBadges().then(d => setBadges(d.badges)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? badges : badges.filter(b => b.category === filter);
  const earnedCount = badges.filter(b => b.earned).length;

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-up">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-3xl font-bold">Badges</h1>
        <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-xl border border-violet-500/20">
          <Award size={14} className="text-violet-400" />
          <span className="text-sm font-semibold text-violet-400">{earnedCount} / {badges.length}</span>
        </div>
      </div>
      <p className="text-white/40 text-sm mb-6">Earn badges by hitting milestones and leveling up</p>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all capitalize
              ${filter === cat ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-40 rounded-2xl glass shimmer" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(badge => {
            const styles = BADGE_STYLES[badge.color] || BADGE_STYLES.purple;
            const cls = badge.earned ? styles.earned : styles.locked;
            return (
              <div key={badge.id} className={`relative border rounded-2xl p-5 flex flex-col items-center text-center transition-all duration-200 ${cls} ${badge.earned ? 'hover:scale-[1.02]' : 'opacity-60'}`}>
                {!badge.earned && (
                  <div className="absolute top-3 right-3 opacity-50">
                    <Lock size={12} />
                  </div>
                )}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${badge.earned ? 'bg-current/10' : 'bg-white/5'}`}>
                  <i className={`${badge.icon} text-3xl`} />
                </div>
                <h3 className="font-display font-semibold text-sm leading-tight mb-1">{badge.name}</h3>
                <p className="text-xs opacity-60 leading-relaxed">{badge.description}</p>
                <div className="mt-3 text-[11px] font-semibold opacity-70">+{badge.xp_reward} XP</div>
                {badge.earned && badge.earned_at && (
                  <div className="text-[10px] opacity-50 mt-1">
                    {new Date(badge.earned_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
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