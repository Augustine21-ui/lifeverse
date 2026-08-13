// frontend/src/components/boards/BoardTopic.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { ArrowUp, ArrowDown, MessageSquare, Send } from 'lucide-react';

export default function BoardTopic({ topicId }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [topic, setTopic] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newReply, setNewReply] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userVote, setUserVote] = useState(null);

  useEffect(() => {
    loadTopic();
  }, [topicId]);

  const loadTopic = async () => {
    setLoading(true);
    try {
      const [topicData, repliesData] = await Promise.all([
        api.getBoardTopic(topicId),
        api.getBoardReplies(topicId),
      ]);
      setTopic(topicData);
      setReplies(repliesData);
      // Check user's vote if logged in
      if (user) {
        const voteRes = await api.getUserVote(topicId);
        setUserVote(voteRes?.vote_type || null);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load topic', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (type) => {
    if (!user) {
      showToast('Please log in to vote', 'error');
      return;
    }
    try {
      const res = await api.voteTopic(topicId, type);
      setTopic({ ...topic, votes: res.votes });
      setUserVote(res.user_vote);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!newReply.trim()) return;
    setSubmitting(true);
    try {
      const reply = await api.replyToTopic(topicId, newReply);
      setReplies([...replies, reply]);
      setNewReply('');
      showToast('Reply added!');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="h-40 bg-white/5 animate-pulse rounded" />;
  }

  if (!topic) {
    return <div className="text-white/40">Topic not found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Topic */}
      <div className="card p-5">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => handleVote('up')}
              className={`p-1 rounded ${userVote === 'up' ? 'text-brand-400' : 'text-white/40 hover:text-brand-400'}`}
            >
              <ArrowUp size={20} />
            </button>
            <span className="font-bold text-lg">{topic.votes || 0}</span>
            <button
              onClick={() => handleVote('down')}
              className={`p-1 rounded ${userVote === 'down' ? 'text-red-400' : 'text-white/40 hover:text-red-400'}`}
            >
              <ArrowDown size={20} />
            </button>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{topic.title}</h2>
              {topic.is_pinned && (
                <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">Pinned</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-white/40">
              <span>{topic.author_name}</span>
              <span>•</span>
              <span>{new Date(topic.created_at).toLocaleDateString()}</span>
            </div>
            <p className="mt-3 text-sm whitespace-pre-wrap">{topic.content}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-white/40">
              <span className="flex items-center gap-1"><MessageSquare size={14} /> {replies.length} replies</span>
            </div>
          </div>
        </div>
      </div>

      {/* Replies */}
      <div className="space-y-3">
        <h3 className="font-semibold">Replies</h3>
        {replies.length === 0 ? (
          <p className="text-white/40 text-sm">No replies yet. Be the first!</p>
        ) : (
          replies.map((reply) => (
            <div key={reply.id} className="card p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs">
                  {(reply.full_name?.[0] || reply.username?.[0] || 'U').toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{reply.full_name || reply.username}</span>
                    <span className="text-xs text-white/40">{new Date(reply.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm mt-1">{reply.content}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reply Form */}
      {user && (
        <form onSubmit={handleReply} className="flex gap-2 mt-4">
          <input
            type="text"
            className="flex-1 input"
            placeholder="Write a reply..."
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            disabled={submitting}
          />
          <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-1">
            <Send size={16} /> {submitting ? 'Sending...' : 'Reply'}
          </button>
        </form>
      )}
    </div>
  );
}