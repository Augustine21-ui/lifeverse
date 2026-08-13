// frontend/src/components/boards/BoardList.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

export default function BoardList() {
  const { showToast } = useToast();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    try {
      const data = await api.getBoards();
      setBoards(data);
    } catch (err) {
      showToast(err.message || 'Failed to load boards', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-white/5 animate-pulse rounded" />)}</div>;
  }

  if (boards.length === 0) {
    return <p className="text-white/40">No discussion boards yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {boards.map((board) => (
        <Link
          key={board.id}
          to={`/boards/${board.id}`}
          className="card p-4 hover:bg-white/5 transition-all border border-white/10 rounded-xl flex items-center gap-4"
        >
          <div className="p-2 rounded-full bg-brand-500/10 text-brand-400">
            <MessageSquare size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold">{board.name}</h3>
            <p className="text-sm text-white/60 line-clamp-1">{board.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}