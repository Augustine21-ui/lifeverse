// frontend/src/components/PostCard.jsx
import { useState } from 'react';
import { Heart, MessageCircle, Trash2 } from 'lucide-react';
import CommentSection from './CommentSection';

export default function PostCard({ post, comments, currentUserId, onLike, onToggleComments, onComment, onDelete }) {
  const [showComments, setShowComments] = useState(false);

  const handleToggleComments = () => {
    setShowComments(!showComments);
    if (!showComments) {
      onToggleComments(post.id);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 transition hover:scale-[1.01] hover:bg-white/10">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {(post.full_name?.[0] || post.username?.[0] || 'U').toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-sm">{post.full_name || post.username}</p>
              <p className="text-xs text-white/40">{new Date(post.created_at).toLocaleString()}</p>
            </div>
            {post.user_id === currentUserId && (
              <button onClick={() => onDelete(post.id)} className="text-white/30 hover:text-red-400">
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <p className="text-sm mt-2 whitespace-pre-wrap break-words">{post.content}</p>
          {post.image_url && (
            <img src={post.image_url} className="mt-2 rounded-lg max-h-60 w-full object-cover" alt="" />
          )}
          <div className="flex gap-4 mt-3">
            <button
              onClick={() => onLike(post.id)}
              className={`flex items-center gap-1 text-xs ${post.user_liked ? 'text-red-500' : 'text-white/40'} hover:text-red-400 transition`}
            >
              <Heart size={16} fill={post.user_liked ? 'currentColor' : 'none'} /> {post.likes_count}
            </button>
            <button
              onClick={handleToggleComments}
              className="flex items-center gap-1 text-xs text-white/40 hover:text-brand-400 transition"
            >
              <MessageCircle size={16} /> {post.comments_count}
            </button>
          </div>
        </div>
      </div>
      {showComments && (
        <div className="mt-3">
          <CommentSection
            postId={post.id}
            comments={comments || []}
            onComment={onComment}
            currentUserId={currentUserId}
          />
        </div>
      )}
    </div>
  );
}