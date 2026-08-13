import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Loader2 } from 'lucide-react';

export default function ActiveStudyGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadGroups = async () => {
  try {
    const data = await api.getMyStudyGroups();
    setGroups(data.slice(0, 3));
  } catch (err) {
    // If endpoint is missing (404), just show empty state
    console.warn('Study groups endpoint not available:', err);
    setGroups([]);
  } finally {
    setLoading(false);
  }
};
    loadGroups();
  }, []);

  if (loading) {
    return <div className="h-12 bg-white/5 animate-pulse rounded" />;
  }

  if (groups.length === 0 || error) {
    return (
      <p className="text-white/40 text-sm">
        No active study groups. <Link to="/study-groups" className="text-brand-400 hover:underline">Join one →</Link>
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {groups.map(g => (
        <Link key={g.id} to={`/study-groups/${g.id}`} className="block p-2 bg-white/5 rounded hover:bg-white/10 transition">
          <p className="text-sm font-medium">{g.name}</p>
          <p className="text-xs text-white/40">{g.member_count} members • {g.focus_sessions_count} sessions</p>
        </Link>
      ))}
      <Link to="/study-groups" className="text-xs text-brand-400 hover:underline">View all →</Link>
    </div>
  );
}