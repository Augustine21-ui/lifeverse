// frontend/src/pages/DiscussionDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Send, User, Clock, MessageSquare } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';

// Mock discussions data (same as in CommunityPage)
const MOCK_DISCUSSIONS = [
  { 
    id: 1, 
    title: 'Best way to prepare for KCSE Mathematics?', 
    author: 'Kevin M.', 
    body: 'I\'m struggling with probability and statistics. What are the best resources and strategies to master these topics before the exam? Any tips from those who have done well?',
    replies: [
      { id: 1, author: 'Grace W.', content: 'I found that practicing past papers every day really helped. Also, watch YouTube tutorials for visual explanations.', created_at: '2026-08-29T10:00:00' },
      { id: 2, author: 'John D.', content: 'Join a study group – discussing problems with others makes a huge difference. We meet every Saturday at 10 AM.', created_at: '2026-08-29T12:30:00' },
      { id: 3, author: 'Mary A.', content: 'Use the KUA Orbit feature! The gamified practice really helped me understand probability.', created_at: '2026-08-30T08:15:00' },
    ],
    created_at: '2026-08-28T10:00:00'
  },
  { 
    id: 2, 
    title: 'Anyone interested in a group project on AI?', 
    author: 'Aisha W.', 
    body: 'I\'m looking for 2-3 teammates to build an AI-powered chatbot for education. We can use Python and TensorFlow. Let me know if you\'re interested!',
    replies: [
      { id: 4, author: 'Brian K.', content: 'I\'m in! I have experience with Python and some ML.', created_at: '2026-08-29T14:30:00' },
    ],
    created_at: '2026-08-29T14:30:00'
  },
  { 
    id: 3, 
    title: 'What are the best resources for learning React?', 
    author: 'John D.', 
    body: 'I\'m a beginner and want to learn React for web development. What courses, books, or tutorials do you recommend?',
    replies: [
      { id: 5, author: 'Alice M.', content: 'The official React docs are great. Also, check out the freeCodeCamp React course.', created_at: '2026-08-30T09:15:00' },
    ],
    created_at: '2026-08-30T09:15:00'
  }
];

export default function DiscussionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [discussion, setDiscussion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    // Simulate API call
    const found = MOCK_DISCUSSIONS.find(d => d.id === parseInt(id));
    if (found) {
      setDiscussion(found);
    } else {
      // Fallback: create a dummy discussion if not found
      setDiscussion({
        id: parseInt(id),
        title: 'Discussion Topic',
        author: 'Unknown',
        body: 'This discussion is not available in the demo data.',
        replies: [],
        created_at: new Date().toISOString()
      });
    }
    setLoading(false);
  }, [id]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setReplying(true);
    // Simulate adding a reply
    const newReply = {
      id: Date.now(),
      author: user?.full_name || 'You',
      content: replyText,
      created_at: new Date().toISOString()
    };
    setDiscussion(prev => ({
      ...prev,
      replies: [...prev.replies, newReply]
    }));
    setReplyText('');
    setReplying(false);
    showToast('Reply added!', 'success');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--text-primary)' }}>Loading discussion...</div>
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--text-muted)' }}>Discussion not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-5 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {/* Discussion header */}
        <div className="card p-5 mb-6">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {discussion.title}
          </h1>
          <div className="flex items-center gap-4 mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1">
              <User size={14} /> {discussion.author}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} /> {new Date(discussion.created_at).toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare size={14} /> {discussion.replies.length} replies
            </span>
          </div>
          <div className="mt-4 text-white/80 leading-relaxed whitespace-pre-wrap">
            {discussion.body}
          </div>
        </div>

        {/* Replies */}
        <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          Replies ({discussion.replies.length})
        </h3>
        <div className="space-y-3 mb-6">
          {discussion.replies.length === 0 ? (
            <div className="card p-4 text-center text-white/40">
              No replies yet. Be the first to respond!
            </div>
          ) : (
            discussion.replies.map((reply, index) => (
              <div key={reply.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {(reply.author?.[0] || 'U').toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {reply.author}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(reply.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {reply.content}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Reply form */}
        <div className="card p-4">
          <form onSubmit={handleReply} className="flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="flex-1 input"
              disabled={replying}
            />
            <button
              type="submit"
              disabled={replying || !replyText.trim()}
              className="btn-primary flex items-center gap-1"
            >
              <Send size={16} /> {replying ? 'Sending...' : 'Reply'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}