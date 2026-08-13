import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { 
  ArrowLeft, Heart, MessageSquare, Share2, Clock, MapPin, 
  Calendar, Users, Send, Image as ImageIcon, Video, Link2,
  MoreVertical, Pin, Flag, Bookmark
} from 'lucide-react';

export default function CommunityDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [commenting, setCommenting] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState({});
  const [comments, setComments] = useState({});
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');

  const postInputRef = useRef(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [communityData, postsData, eventsData] = await Promise.all([
        api.getCommunity(id),
        api.getCommunityPosts(id),
        api.getCommunityEvents(id).catch(() => []),
      ]);
      setCommunity(communityData);
      setPosts(postsData);
      setEvents(eventsData);
    } catch (err) {
      showToast('Failed to load community', 'error');
      navigate('/momentum');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    
    try {
      const data = await api.createPost({
        community_id: parseInt(id),
        content: newPost,
        post_type: 'text',
      });
      setPosts(prev => [data, ...prev]);
      setNewPost('');
      showToast('Post created!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to create post', 'error');
    }
  };

  const handleLike = async (postId) => {
    try {
      const { liked } = await api.toggleLike(postId);
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, likes_count: p.likes_count + (liked ? 1 : -1), user_liked: liked }
          : p
      ));
    } catch (err) {
      showToast('Failed to like post', 'error');
    }
  };

  const handleComment = async (postId) => {
    if (!commentText.trim()) return;
    try {
      const data = await api.addComment(postId, commentText);
      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), data]
      }));
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
      ));
      setCommentText('');
      setCommenting(null);
      showToast('Comment added!', 'success');
    } catch (err) {
      showToast('Failed to add comment', 'error');
    }
  };

  const loadComments = async (postId) => {
    try {
      const data = await api.getComments(postId);
      setComments(prev => ({ ...prev, [postId]: data }));
      setShowComments(prev => ({ ...prev, [postId]: true }));
    } catch (err) {
      showToast('Failed to load comments', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--text-primary)' }}>Loading...</div>
      </div>
    );
  }

  if (!community) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/momentum')} style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {community.name}
            </h1>
            <p style={{ color: 'var(--text-muted)' }} className="text-sm">
              {community.member_count} members · {community.post_count} posts
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b" style={{ borderColor: 'var(--border)' }}>
          {['posts', 'events', 'members'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition border-b-2 ${
                activeTab === tab
                  ? 'border-brand-500 text-brand-500'
                  : 'border-transparent text-white/60 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'posts' && (
          <>
            {/* Create Post */}
            <form onSubmit={handleCreatePost} className="card p-4 mb-6">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                  {user?.fullName?.[0] || 'U'}
                </div>
                <div className="flex-1">
                  <textarea
                    ref={postInputRef}
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="What's on your mind?"
                    className="w-full input min-h-[60px] resize-none"
                    style={{ background: 'var(--bg-secondary)' }}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex gap-2">
                      <button type="button" className="text-white/40 hover:text-white p-1">
                        <ImageIcon size={18} />
                      </button>
                      <button type="button" className="text-white/40 hover:text-white p-1">
                        <Video size={18} />
                      </button>
                      <button type="button" className="text-white/40 hover:text-white p-1">
                        <Link2 size={18} />
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={!newPost.trim()}
                      className="px-4 py-1.5 bg-brand-500 hover:bg-brand-600 rounded-lg text-white text-sm disabled:opacity-50"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* Posts Feed */}
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="card p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center">
                      {post.full_name?.[0] || 'U'}
                    </div>
                    <div>
                      <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                        {post.full_name}
                      </p>
                      <p style={{ color: 'var(--text-muted)' }} className="text-xs">
                        {new Date(post.created_at).toLocaleDateString()} · {new Date(post.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    {post.is_announcement && (
                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full ml-auto">📢 Announcement</span>
                    )}
                  </div>

                  <p style={{ color: 'var(--text-primary)' }} className="mb-3">{post.content}</p>

                  <div className="flex items-center gap-6 text-sm" style={{ color: 'var(--text-muted)' }}>
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1 transition ${
                        post.user_liked ? 'text-red-400' : 'hover:text-white'
                      }`}
                    >
                      <Heart size={16} className={post.user_liked ? 'fill-red-400' : ''} />
                      <span>{post.likes_count}</span>
                    </button>
                    <button
                      onClick={() => {
                        if (!showComments[post.id]) {
                          loadComments(post.id);
                        }
                        setShowComments(prev => ({ ...prev, [post.id]: !prev[post.id] }));
                      }}
                      className="flex items-center gap-1 hover:text-white transition"
                    >
                      <MessageSquare size={16} />
                      <span>{post.comments_count}</span>
                    </button>
                    <button className="flex items-center gap-1 hover:text-white transition">
                      <Share2 size={16} />
                    </button>
                  </div>

                  {/* Comments */}
                  {showComments[post.id] && (
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {(comments[post.id] || []).map((comment) => (
                          <div key={comment.id} className="flex gap-2">
                            <div className="w-6 h-6 rounded-full bg-brand-500/20 flex items-center justify-center text-xs flex-shrink-0">
                              {comment.full_name?.[0] || 'U'}
                            </div>
                            <div>
                              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                {comment.full_name}
                              </p>
                              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {commenting === post.id ? (
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Write a comment..."
                            className="flex-1 input text-sm"
                            onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                          />
                          <button
                            onClick={() => handleComment(post.id)}
                            className="px-3 py-1 bg-brand-500 rounded-lg text-white text-sm"
                          >
                            Reply
                          </button>
                          <button
                            onClick={() => setCommenting(null)}
                            className="px-3 py-1 bg-white/10 rounded-lg text-white text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setCommenting(post.id)}
                          className="text-sm text-brand-400 hover:underline mt-2"
                        >
                          Add comment
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {posts.length === 0 && (
                <div className="card p-8 text-center" style={{ color: 'var(--text-muted)' }}>
                  <p>No posts yet. Be the first to post!</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'events' && (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="card p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{event.title}</h3>
                  <p style={{ color: 'var(--text-muted)' }} className="text-sm">{event.description}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span className="flex items-center gap-1"><Clock size={14} /> {new Date(event.start_time).toLocaleString()}</span>
                    {event.location && <span className="flex items-center gap-1"><MapPin size={14} /> {event.location}</span>}
                  </div>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await api.rsvpEvent(event.id, event.user_rsvped ? 'not_going' : 'going');
                      loadData();
                    } catch (err) {
                      showToast('Failed to RSVP', 'error');
                    }
                  }}
                  className={`px-4 py-1.5 rounded-lg text-sm ${
                    event.user_rsvped
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-brand-500 text-white hover:bg-brand-600'
                  }`}
                >
                  {event.user_rsvped ? 'Going ✓' : 'RSVP'}
                </button>
              </div>
            ))}
            {events.length === 0 && (
              <div className="card p-8 text-center" style={{ color: 'var(--text-muted)' }}>
                <p>No events scheduled yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}