import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Flame, Target, Award, Users, TrendingUp, ArrowRight, Star } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

const CATEGORY_COLORS = {
  study: 'text-brand-400 bg-brand-500/10',
  fitness: 'text-green-400 bg-green-500/10',
  personal: 'text-violet-400 bg-violet-500/10',
  creative: 'text-amber-400 bg-amber-500/10',
  social: 'text-pink-400 bg-pink-500/10',
};

const BADGE_COLORS = {
  green: 'bg-green-500/15 border-green-500/20 text-green-400',
  purple: 'bg-violet-500/15 border-violet-500/20 text-violet-400',
  amber: 'bg-amber-500/15 border-amber-500/20 text-amber-400',
  coral: 'bg-orange-500/15 border-orange-500/20 text-orange-400',
  blue: 'bg-brand-500/15 border-brand-500/20 text-brand-400',
  teal: 'bg-teal-500/15 border-teal-500/20 text-teal-400',
  red: 'bg-red-500/15 border-red-500/20 text-red-400',
};

function StatCard({ icon: Icon, label, value, color = 'text-brand-400', sub }) {
  return (
    <div className="stat-card">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color.replace('text-', 'bg-').replace('400', '500/15')}`}>
        <Icon size={17} className={color} />
      </div>
      <div className="text-2xl font-display font-bold">{value}</div>
      <div className="text-xs text-white/40 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-white/25 mt-1">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  const xpPercent = data?.user?.xpPercent ?? user?.stats?.xpPercent ?? 0;
  const level = data?.user?.level ?? user?.level ?? 1;
  const streakDays = data?.user?.streakDays ?? user?.streakDays ?? 0;
  const totalXP = data?.user?.xp ?? user?.xp ?? 0;

  // Fill missing days in XP history
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const iso = d.toISOString().split('T')[0];
    const found = data?.xpHistory?.find(h => h.date?.startsWith(iso));
    return { day: d.toLocaleDateString('en', { weekday: 'short' }), xp: found ? parseInt(found.xp) : 0 };
  });

  if (loading) return (
    <div className="p-8 space-y-5">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-28 rounded-2xl glass shimmer" />
      ))}
    </div>
  );

  const totalGoals = data?.goalsByCategory?.reduce((a, c) => a + parseInt(c.active || 0) + parseInt(c.completed || 0), 0) ?? 0;
  const completedGoals = data?.goalsByCategory?.reduce((a, c) => a + parseInt(c.completed || 0), 0) ?? 0;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-up">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold">
          Hey, {user?.fullName?.split(' ')[0] || user?.username} 👋
        </h1>
        <p className="text-white/40 text-sm mt-1">Here's your learning overview</p>
      </div>

      {/* Level progress card */}
      <div className="card glass-strong relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh-brand opacity-40 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <span className="font-display font-bold text-2xl">{level}</span>
            </div>
            <div>
              <p className="text-xs text-white/40 mb-0.5">Current level</p>
              <p className="font-display font-bold text-xl">Level {level}</p>
              <p className="text-xs text-white/30">{totalXP.toLocaleString()} total XP</p>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-xs text-white/40 mb-2">
              <span className="flex items-center gap-1"><Zap size={11} className="text-brand-400" /> {data?.user?.xpProgress ?? 0} / 500 XP to next level</span>
              <span>{xpPercent}%</span>
            </div>
            <div className="xp-bar-track h-3">
              <div className="xp-bar-fill h-full" style={{ width: `${xpPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Flame} label="Day streak" value={streakDays} color="text-orange-400" sub="Keep it up!" />
        <StatCard icon={Target} label="Active goals" value={data?.goalsByCategory?.reduce((a,c)=>a+parseInt(c.active||0),0)??0} color="text-brand-400" />
        <StatCard icon={Award} label="Badges earned" value={data?.recentBadges?.length ?? 0} color="text-violet-400" />
        <StatCard icon={Users} label="Communities" value={user?.stats?.communitiesCount ?? 0} color="text-teal-400" />
      </div>

      {/* Charts + quick links row */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* XP chart */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-semibold">XP this week</h3>
            <div className="flex items-center gap-1 text-xs text-brand-400">
              <TrendingUp size={13} />
              <span>{chartData.reduce((a,c)=>a+c.xp,0)} XP</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b5bff" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b5bff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1c1a18', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: 'white', fontSize: 12 }} />
              <Area type="monotone" dataKey="xp" stroke="#3b5bff" strokeWidth={2} fill="url(#xpGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent badges */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold">Badges</h3>
            <Link to="/badges" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              All <ArrowRight size={12} />
            </Link>
          </div>
          {data?.recentBadges?.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {data.recentBadges.slice(0, 6).map(badge => (
                <div key={badge.id} title={badge.name}
                  className={`aspect-square rounded-xl border flex items-center justify-center text-lg ${BADGE_COLORS[badge.color] || BADGE_COLORS.purple}`}>
                  <i className={`${badge.icon} text-xl`} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-24 text-center">
              <Star size={24} className="text-white/20 mb-2" />
              <p className="text-xs text-white/30">Complete goals to earn badges</p>
            </div>
          )}
        </div>
      </div>

      {/* Goals by category */}
      {data?.goalsByCategory?.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold">Goals by category</h3>
            <Link to="/goals" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {data.goalsByCategory.map(cat => {
              const active = parseInt(cat.active || 0);
              const completed = parseInt(cat.completed || 0);
              const total = active + completed;
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
              return (
                <div key={cat.category} className="flex items-center gap-4">
                  <div className={`badge capitalize ${CATEGORY_COLORS[cat.category] || 'text-white/50 bg-white/5'} w-24`}>
                    {cat.category}
                  </div>
                  <div className="flex-1">
                    <div className="xp-bar-track">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-white/40 w-16 text-right">{completed}/{total} done</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}