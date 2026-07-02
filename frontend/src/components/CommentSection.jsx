// frontend/src/components/CommentSection.jsx
import { useState } from 'react';
import { Send } from 'lucide-react';

export default function CommentSection({ postId, comments, onComment, currentUserId }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onComment(postId, input);
    setInput('');
  };

  return (
    <div className="mt-3 pl-6 border-l-2 border-white/10">
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {comments.map((comment) => (
          <div key={comment.id} className="text-sm flex items-start gap-2">
            <span className="font-semibold text-white/80">{comment.full_name || 'User'}</span>
            <span className="text-white/60 break-words">{comment.content}</span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-1 mt-2">
        <input
          type="text"
          className="flex-1 text-sm p-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-brand-400"
          placeholder="Write a comment..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="p-2 text-brand-400 hover:text-brand-300">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}