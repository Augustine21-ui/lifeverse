import { useState } from 'react';
import { X, Heart, MessageCircle, Trash2, Send } from 'lucide-react';

export default function PostDetailModal({ post, comments, currentUserId, onLike, onComment, onDelete, onClose }) {
  const [commentInput, setCommentInput] = useState('');

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    onComment(post.id, commentInput);
    setCommentInput('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs">
              {(post.full_name?.[0] || post.username?.[0] || 'U').toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-sm">{post.full_name || post.username}</p>
              <p className="text-xs text-white/40">{new Date(post.created_at).toLocaleString()}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm whitespace-pre-wrap break-words">{post.content}</p>
          {post.image_url && (
            <img src={post.image_url} className="mt-3 rounded-lg max-h-60 w-full object-cover" alt="" />
          )}
          <div className="flex gap-4 mt-4">
            <button onClick={() => onLike(post.id)} className={`flex items-center gap-1 text-xs ${post.user_liked ? 'text-red-500' : 'text-white/40'} hover:text-red-400 transition`}>
              <Heart size={16} fill={post.user_liked ? 'currentColor' : 'none'} /> {post.likes_count}
            </button>
            <span className="flex items-center gap-1 text-xs text-white/40">
              <MessageCircle size={16} /> {post.comments_count}
            </span>
            {post.user_id === currentUserId && (
              <button onClick={() => onDelete(post.id)} className="text-white/30 hover:text-red-400 ml-auto">
                <Trash2 size={16} />
              </button>
            )}
          </div>

          <div className="mt-4 border-t border-white/10 pt-4">
            <h4 className="text-sm font-semibold mb-2">Comments</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {comments.length === 0 && <p className="text-xs text-white/40">No comments yet.</p>}
              {comments.map((c) => (
                <div key={c.id} className="text-sm flex items-start gap-2">
                  <span className="font-semibold text-white/80">{c.full_name || 'User'}</span>
                  <span className="text-white/60 break-words">{c.content}</span>
                </div>
              ))}
            </div>
            <form onSubmit={handleCommentSubmit} className="flex gap-1 mt-2">
              <input
                type="text"
                className="flex-1 text-sm p-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-brand-400"
                placeholder="Write a comment..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
              />
              <button type="submit" className="p-2 text-brand-400 hover:text-brand-300">
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}