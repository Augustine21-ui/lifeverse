import { Link } from 'react-router-dom';
import { Users, Target, Clock, Zap } from 'lucide-react';

export default function StudyGroupCard({ group }) {
  const progress = group.weekly_hours ? Math.min(100, (group.focus_sessions_count / group.weekly_hours) * 100) : 0;

  return (
    <div className="card p-4 hover:bg-white/5 transition border border-white/10 rounded-xl">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg">{group.name}</h3>
          <p className="text-white/60 text-sm mt-1">{group.description}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
            <span className="flex items-center gap-1"><Users size={14} /> {group.member_count || 0}</span>
            <span className="flex items-center gap-1"><Clock size={14} /> {group.focus_sessions_count || 0} sessions</span>
            <span className="flex items-center gap-1"><Zap size={14} /> {group.total_xp || 0} XP</span>
          </div>
        </div>
        <Link to={`/study-groups/${group.id}`} className="btn-primary text-sm px-3 py-1.5">View</Link>
      </div>
      {group.weekly_hours && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-white/40">
            <span>Weekly progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand-500 to-violet-500 rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}