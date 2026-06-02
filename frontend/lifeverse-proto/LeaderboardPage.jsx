import { useState, useEffect } from 'react';
import { Trophy, Zap, Flame, Award } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const RANK_STYLES = {
  1: 'text-amber-400 bg-amber-500/15 border-amber-500/20',
  2: 'text-slate-300 bg-slate-500/15 border-slate-500/20',
  3: 'text-orange-400 bg-orange-500/15 border-orange-500/20',
};

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLeaderboard().then(d => setLeaderboard(d.leaderboard)).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-up">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">Leaderboard</h1>
        <p className="text-white/40 text-sm mt-1">Top learners this season</p>
      </div>

      {/* Top 3 podium */}
      {!loading && leaderboard.length >= 3 && (
        <div className="flex items-end justify-center gap-3 mb-8">
          {[leaderboard[1], leaderboard[0], leaderboard[2]].map((entry, i) => {
            const rank = [2, 1, 3][i];
            const heights = ['h-20', 'h-28', 'h-16'];
            const initials = (entry.full_name || entry.username).split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
            return (
              <div key={entry.id} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center font-display font-bold text-sm">
                  {initials}
                </div>
                <p className="text-xs font-semibold text-center max-w-[70px] truncate">{entry.username}</p>
                <div className={`w-20 ${heights[i]} rounded-t-xl flex items-center justify-center ${RANK_STYLES[rank] || 'text-white/40 bg-white/5 border-white/10'} border`}>
                  <span className="font-display font-bold text-xl">{rank}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => <div key={i} className="h-16 rounded-2xl glass shimmer" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry, idx) => {
            const rank = idx + 1;
            const isMe = entry.id === user?.id;
            const initials = (entry.full_name || entry.username).split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();

            return (
              <div key={entry.id} className={`card flex items-center gap-4 transition-all duration-150 ${isMe ? 'border border-brand-500/30 bg-brand-500/5' : 'hover:bg-white/[0.06]'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${RANK_STYLES[rank] || 'text-white/40 bg-white/5 border border-white/10'}`}>
                  {rank <= 3 ? <Trophy size={14} /> : rank}
                </div>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center font-display font-bold text-xs shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate">{entry.full_name || entry.username}</span>
                    {isMe && <span className="badge bg-brand-500/10 text-brand-400 text-[10px]">You</span>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/30 mt-0.5">
                    <span className="flex items-center gap-1"><Flame size={10} className="text-orange-400" />{entry.streak_days}d</span>
                    <span className="flex items-center gap-1"><Award size={10} className="text-violet-400" />{entry.badges_count}</span>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1.5">
                  <Zap size={13} className="text-brand-400" />
                  <span className="font-display font-bold text-base">{(entry.xp || 0).toLocaleString()}</span>
                  <span className="text-xs text-white/30">XP</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}