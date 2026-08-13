// frontend/src/components/groups/GroupCard.jsx
import { useState } from 'react';
import { Users, Lock, Globe, ChevronRight, UserPlus, Check } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

export default function GroupCard({ group, onJoin }) {
  const { showToast } = useToast();
  const [joining, setJoining] = useState(false);
  const [isMember, setIsMember] = useState(group.is_member || false);

  const handleJoin = async () => {
    if (isMember) return;
    setJoining(true);
    try {
      await api.joinGroup(group.id);
      setIsMember(true);
      showToast(`You joined ${group.name}`);
      if (onJoin) onJoin(group.id);
    } catch (err) {
      showToast(err.message || 'Failed to join group', 'error');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="card p-4 hover:bg-white/5 transition-all border border-white/10 rounded-xl">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg truncate">{group.name}</h3>
            {group.is_private ? (
              <Lock size={14} className="text-white/40" />
            ) : (
              <Globe size={14} className="text-white/40" />
            )}
          </div>
          <p className="text-sm text-white/60 mt-1 line-clamp-2">{group.description || 'No description'}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
            <span className="capitalize badge bg-white/5 border border-white/10">{group.type}</span>
            <span className="flex items-center gap-1">
              <Users size={12} /> {group.member_count || 0}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 ml-4">
          {isMember ? (
            <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full flex items-center gap-1">
              <Check size={12} /> Member
            </span>
          ) : (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="btn-primary text-sm px-3 py-1.5 flex items-center gap-1"
            >
              {joining ? 'Joining...' : <><UserPlus size={14} /> Join</>}
            </button>
          )}
          <button
            onClick={() => window.location.href = `/groups/${group.id}`}
            className="text-xs text-brand-400 hover:underline flex items-center gap-1"
          >
            View <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}