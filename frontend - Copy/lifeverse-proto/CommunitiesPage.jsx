import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Check, Plus, BookOpen } from 'lucide-react';
import { api } from '../services/api';

const COLOR_MAP = {
  blue: 'from-brand-600 to-brand-800',
  purple: 'from-violet-600 to-violet-800',
  green: 'from-green-600 to-green-800',
  amber: 'from-amber-600 to-amber-800',
  coral: 'from-orange-600 to-orange-800',
  teal: 'from-teal-600 to-teal-800',
  red: 'from-red-600 to-red-800',
};

function CommunityCard({ community, onJoin, onLeave }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const gradient = COLOR_MAP[community.banner_color] || COLOR_MAP.blue;

  const handleToggle = async (e) => {
    e.stopPropagation();
    setLoading(true);
    try {
      if (community.is_member) await onLeave(community.id);
      else await onJoin(community.id);
    } finally { setLoading(false); }
  };

  return (
    <div className="card hover:bg-white/[0.06] transition-all duration-200 cursor-pointer group"
      onClick={() => navigate(`/communities/${community.id}`)}>
      {/* Banner strip */}
      <div className={`h-2 rounded-lg bg-gradient-to-r ${gradient} mb-4 -mx-1`} />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <i className={`${community.icon || 'ti-users'} text-white text-lg`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-semibold text-base leading-tight">{community.name}</h3>
              {community.is_official && (
                <span className="badge bg-brand-500/10 text-brand-400 text-[10px]">Official</span>
              )}
            </div>
            <p className="text-xs text-white/40">{community.subject}</p>
          </div>
        </div>
        <button onClick={handleToggle} disabled={loading}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150
            ${community.is_member
              ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'
              : 'bg-brand-500/15 text-brand-400 border border-brand-500/20 hover:bg-brand-500/25'}`}>
          {loading ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            : community.is_member ? <><Check size={12} /> Joined</> : <><Plus size={12} /> Join</>}
        </button>
      </div>

      <p className="text-sm text-white/40 mt-3 line-clamp-2 leading-relaxed">{community.description}</p>

      <div className="flex items-center gap-1.5 mt-3 text-xs text-white/30">
        <Users size={12} />
        <span>{(community.member_count || 0).toLocaleString()} members</span>
      </div>
    </div>
  );
}

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await api.getCommunities();
      setCommunities(data.communities);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleJoin = async (id) => {
    await api.joinCommunity(id);
    setCommunities(p => p.map(c => c.id === id ? { ...c, is_member: true, member_count: (c.member_count || 0) + 1 } : c));
  };

  const handleLeave = async (id) => {
    await api.leaveCommunity(id);
    setCommunities(p => p.map(c => c.id === id ? { ...c, is_member: false, member_count: Math.max(0, (c.member_count || 0) - 1) } : c));
  };

  const joined = communities.filter(c => c.is_member);
  const discover = communities.filter(c => !c.is_member);

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-up">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">Communities</h1>
        <p className="text-white/40 text-sm mt-1">Learn together with fellow students</p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-44 rounded-2xl glass shimmer" />)}
        </div>
      ) : (
        <>
          {joined.length > 0 && (
            <div className="mb-8">
              <h2 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
                <Check size={16} className="text-green-400" /> Your communities
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {joined.map(c => <CommunityCard key={c.id} community={c} onJoin={handleJoin} onLeave={handleLeave} />)}
              </div>
            </div>
          )}

          {discover.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
                <BookOpen size={16} className="text-brand-400" /> Discover
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {discover.map(c => <CommunityCard key={c.id} community={c} onJoin={handleJoin} onLeave={handleLeave} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}