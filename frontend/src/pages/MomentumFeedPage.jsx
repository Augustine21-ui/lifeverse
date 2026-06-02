// frontend/src/pages/MomentumFeedPage.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Heart, MessageCircle, Trash2, Send, Loader2, Plus } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function MomentumFeedPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState('');
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [commentsMap, setCommentsMap] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const observer = useRef();

  const LIMIT = 10;

  const loadPosts = useCallback(async (reset = false) => {
    if (reset) {
      setOffset(0);
      setHasMore(true);
      setPosts([]);
    }
    const currentOffset = reset ? 0 : offset;
    setLoading(reset);
    setLoadingMore(!reset && offset > 0);
    try {
      const data = await api.getFeedPosts(LIMIT, currentOffset);
      if (reset) {
        setPosts(data.posts || data);
        setOffset(currentOffset + LIMIT);
        setHasMore((data.posts || data).length === LIMIT);
      } else {
        setPosts(prev => [...prev, ...(data.posts || data)]);
        setOffset(prev => prev + LIMIT);
        setHasMore((data.posts || data).length === LIMIT);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load posts', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [offset, showToast]);

  useEffect(() => {
    loadPosts(true);
  }, []);

  const lastPostRef = useCallback(node => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        loadPosts();
      }
    });
    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore, loadPosts]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    setSubmitting(true);
    try {
      const newPost = await api.createPost(newPostContent, newPostImage || null);
      setPosts([newPost, ...posts]);
      setNewPostContent('');
      setNewPostImage('');
      setShowCreateForm(false);
      showToast('Post created! +10 XP');
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const result = await api.likePost(postId);
      setPosts(posts.map(p =>
        p.id === postId ? { ...p, likes_count: p.likes_count + (result.liked ? 1 : -1), user_liked: result.liked } : p
      ));
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    }
  };

  const loadComments = async (postId) => {
    try {
      const comments = await api.getComments(postId);
      setCommentsMap(prev => ({ ...prev, [postId]: comments }));
    } catch (err) {
      console.error(err);
      showToast('Failed to load comments', 'error');
    }
  };

  const toggleComments = async (postId) => {
    if (!expandedComments[postId]) {
      if (!commentsMap[postId]) await loadComments(postId);
      setExpandedComments({ ...expandedComments, [postId]: true });
    } else {
      setExpandedComments({ ...expandedComments, [postId]: false });
    }
  };

  const handleComment = async (postId) => {
    const content = commentInputs[postId];
    if (!content?.trim()) return;
    try {
      const newComment = await api.addComment(postId, content);
      setCommentsMap(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment]
      }));
      setPosts(posts.map(p =>
        p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
      ));
      setCommentInputs({ ...commentInputs, [postId]: '' });
      showToast('Comment added!');
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Delete this post?')) return;
    try {
      await api.deletePost(postId);
      setPosts(posts.filter(p => p.id !== postId));
      showToast('Post deleted');
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    }
  };

  if (loading && posts.length === 0) {
    return <div className="p-6 flex justify-center"><Loader2 className="animate-spin" size={40} /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 relative">
      {/* Floating create button (optional) */}
      <button
        onClick={() => setShowCreateForm(!showCreateForm)}
        className="fixed bottom-6 right-6 z-10 bg-brand-500 text-white p-3 rounded-full shadow-lg hover:bg-brand-600 transition"
      >
        <Plus size={24} />
      </button>

      {/* Create Post Form (slide down) */}
      {showCreateForm && (
        <div className="card p-4 mb-6">
          <form onSubmit={handleCreatePost}>
            <textarea
              className="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 resize-none"
              rows="3"
              placeholder="Share your progress, achievement, or idea..."
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
            />
            <input
              type="text"
              className="w-full mt-2 p-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30"
              placeholder="Image URL (optional)"
              value={newPostImage}
              onChange={(e) => setNewPostImage(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setShowCreateForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Post'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-4">
        {posts.map((post, idx) => (
          <div
            key={post.id}
            ref={idx === posts.length - 1 ? lastPostRef : null}
            className="card p-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center font-bold">
                  {(post.full_name?.[0] || post.username?.[0] || 'U').toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{post.full_name || post.username}</p>
                  <p className="text-xs text-white/40">{new Date(post.created_at).toLocaleString()}</p>
                </div>
              </div>
              {post.user_id === user?.id && (
                <button onClick={() => handleDeletePost(post.id)} className="text-white/30 hover:text-red-400">
                  <Trash2 size={18} />
                </button>
              )}
            </div>
            <p className="mt-3 text-white/90 whitespace-pre-wrap">{post.content}</p>
            {post.image_url && <img src={post.image_url} alt="post" className="mt-3 rounded-lg max-h-96 w-full object-cover" />}

            <div className="flex gap-4 mt-4">
              <button
                onClick={() => handleLike(post.id)}
                className={`flex items-center gap-1 ${post.user_liked ? 'text-red-500' : 'text-white/40 hover:text-red-400'}`}
              >
                <Heart size={18} fill={post.user_liked ? 'currentColor' : 'none'} />
                <span>{post.likes_count || 0}</span>
              </button>
              <button
                onClick={() => toggleComments(post.id)}
                className="flex items-center gap-1 text-white/40 hover:text-white"
              >
                <MessageCircle size={18} />
                <span>{post.comments_count || 0} Comments</span>
              </button>
            </div>

            {expandedComments[post.id] && (
              <div className="mt-4 border-t border-white/10 pt-3">
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {(commentsMap[post.id] || []).map(comment => (
                    <div key={comment.id} className="flex gap-2 text-sm">
                      <span className="font-semibold">{comment.full_name || comment.username}:</span>
                      <span>{comment.content}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    className="flex-1 p-1 rounded bg-white/5 border border-white/10 text-sm"
                    placeholder="Write a comment..."
                    value={commentInputs[post.id] || ''}
                    onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && handleComment(post.id)}
                  />
                  <button onClick={() => handleComment(post.id)} className="text-brand-400">
                    <Send size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {loadingMore && (
          <div className="text-center py-4">
            <Loader2 className="animate-spin mx-auto text-brand-400" size={24} />
          </div>
        )}
        {!hasMore && posts.length > 0 && (
          <div className="text-center py-4 text-white/40">
            You've reached the end. New posts will appear here.
          </div>
        )}
      </div>
    </div>
  );
}