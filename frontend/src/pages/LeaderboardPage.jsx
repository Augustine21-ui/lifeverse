import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Trophy, Loader2, Users, Flame, Heart, Target, Rocket, Handshake, Search } from 'lucide-react';
import PageBackground from '../components/PageBackground';

const LEADERBOARD_TYPES = [
  { key: 'xp', label: 'Top Learners', icon: Trophy, color: 'text-brand-400' },
  { key: 'streak', label: 'Streak Masters', icon: Flame, color: 'text-orange-400' },
  { key: 'likes', label: 'Most Appreciated', icon: Heart, color: 'text-red-400' },
  { key: 'challenges', label: 'Challenge Champions', icon: Target, color: 'text-purple-400' },
  { key: 'tasks', label: 'Orbit Masters', icon: Rocket, color: 'text-cyan-400' },
  { key: 'community', label: 'Community Helpers', icon: Handshake, color: 'text-green-400' },
];

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [activeType, setActiveType] = useState('xp');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState(null);

  useEffect(() => {
    loadLeaderboard(activeType);
  }, [activeType]);

  const loadLeaderboard = async (type) => {
    setLoading(true);
    try {
      const data = await api.getLeaderboard(type);
      setEntries(data.entries);
      setUserRank(data.userRank);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return <Trophy size={18} className="text-yellow-400" />;
    if (rank === 2) return <Trophy size={18} className="text-gray-400" />;
    if (rank === 3) return <Trophy size={18} className="text-amber-600" />;
    return `#${rank}`;
  };

  return (
    <PageBackground imageUrl="/leaderboard-bg.jpg">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2">🏆 Leaderboard</h1>
        <p className="text-white/40 mb-6">Celebrating top contributors in different areas</p>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-white/10 pb-2">
          {LEADERBOARD_TYPES.map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => setActiveType(key)}
              className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                activeType === key
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                  : 'hover:bg-white/10 text-white/60'
              }`}
            >
              <Icon size={18} className={activeType === key ? 'text-white' : color} />
              <span className="text-sm">{label}</span>
            </button>
          ))}
        </div>

        {/* User's Rank */}
        {userRank && (
          <div className="card p-3 mb-4 flex items-center gap-3 border border-brand-500/30 bg-brand-500/5">
            <div className="flex-1">
              <p className="text-sm text-white/60">Your rank</p>
              <p className="text-xl font-bold">#{userRank}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/40">Keep going!</p>
            </div>
          </div>
        )}

        {/* Entries */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-brand-400" size={40} />
          </div>
        ) : entries.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-white/40">No entries yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className={`flex items-center gap-4 p-3 rounded-lg transition hover:bg-white/5 ${
                  entry.id === user?.id ? 'bg-brand-500/10 border border-brand-500/30' : 'bg-white/5 border border-white/10'
                }`}
              >
                <div className="w-8 text-center text-sm font-bold text-white/40">
                  {typeof getRankBadge(entry.rank) === 'string' ? entry.rank : getRankBadge(entry.rank)}
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs">
                  {(entry.full_name?.[0] || entry.username?.[0] || 'U').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{entry.full_name || entry.username}</p>
                  <p className="text-xs text-white/40">@{entry.username}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-brand-400">{entry.score}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageBackground>
  );
}