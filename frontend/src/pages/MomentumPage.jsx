import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { 
  Search, Users, Plus, Filter, BookOpen, MessageCircle, 
  Crown, Sparkles, Calendar, Grid, List, Heart, 
  MessageSquare, Share2, MapPin, Clock, UserPlus, 
  TrendingUp, Star, Hash, Globe, Lock, ChevronRight,
  Image, Video, Link2, Smile, Send, X, Home, 
  Book, Calendar as CalendarIcon, Users as UsersIcon
} from 'lucide-react';

export default function MomentumPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('feed');
  const [loading, setLoading] = useState(true);
  
  // Feed states
  const [feedPosts, setFeedPosts] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [commentingPost, setCommentingPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState({});
  const [comments, setComments] = useState({});
  
  // Communities states
  const [communities, setCommunities] = useState([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCommunity, setNewCommunity] = useState({
    name: '',
    description: '',
    type: 'study_group',
    category: '',
  });

  useEffect(() => {
    loadFeed();
    loadCommunities();
  }, []);

  // ===== FEED FUNCTIONS =====
  const loadFeed = async () => {
    setFeedLoading(true);
    try {
      const data = await api.getFeedPosts(50, 0);
      setFeedPosts(data.posts || data || []);
    } catch (err) {
      showToast('Failed to load feed', 'error');
    } finally {
      setFeedLoading(false);
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim()) {
      showToast('Please add some content', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const data = await api.createPost({
        content: postContent,
        post_type: 'text',
      });
      showToast('Post created!', 'success');
      setPostContent('');
      setShowPostModal(false);
      await loadFeed();
    } catch (err) {
      showToast(err.message || 'Failed to create post', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const { liked } = await api.toggleLike(postId);
      setFeedPosts(prev => prev.map(p => 
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
      setFeedPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
      ));
      setCommentText('');
      setCommentingPost(null);
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

  // ===== COMMUNITY FUNCTIONS =====
  const loadCommunities = async () => {
    setCommunitiesLoading(true);
    try {
      const params = {};
      if (selectedType !== 'all') params.type = selectedType;
      if (searchQuery) params.search = searchQuery;
      const data = await api.getCommunities(params);
      setCommunities(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setCommunitiesLoading(false);
    }
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    try {
      const data = await api.createCommunity(newCommunity);
      showToast('Community created successfully!', 'success');
      setShowCreateModal(false);
      setNewCommunity({
        name: '',
        description: '',
        type: 'study_group',
        category: '',
      });
      loadCommunities();
    } catch (err) {
      showToast(err.message || 'Failed to create community', 'error');
    }
  };

  const handleJoinCommunity = async (communityId) => {
    try {
      await api.joinCommunity(communityId);
      showToast('Joined community!', 'success');
      loadCommunities();
    } catch (err) {
      showToast(err.message || 'Failed to join', 'error');
    }
  };

  // ===== RENDER =====
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--text-primary)' }}>Loading Momentum...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              🌊 Momentum
            </h1>
            <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-1">
              Connect, learn, and share with your community
            </p>
          </div>
          <button
            onClick={() => setShowPostModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-gradient-to-r from-brand-500 to-violet-600 hover:opacity-90 transition"
          >
            <Plus size={18} /> New Post
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-4 py-2 text-sm font-medium transition border-b-2 ${
              activeTab === 'feed'
                ? 'border-brand-500 text-brand-500'
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            <Home size={16} className="inline mr-2" />
            Social Buzz
          </button>
          <button
            onClick={() => setActiveTab('communities')}
            className={`px-4 py-2 text-sm font-medium transition border-b-2 ${
              activeTab === 'communities'
                ? 'border-brand-500 text-brand-500'
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            <UsersIcon size={16} className="inline mr-2" />
            Communities
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 text-sm font-medium transition border-b-2 ${
              activeTab === 'events'
                ? 'border-brand-500 text-brand-500'
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            <CalendarIcon size={16} className="inline mr-2" />
            Events
          </button>
        </div>

        {/* ===== FEED TAB ===== */}
        {activeTab === 'feed' && (
          <div>
            {/* Create Post Modal */}
            {showPostModal && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-800 rounded-xl p-6 max-w-lg w-full">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">Create Post</h2>
                    <button onClick={() => setShowPostModal(false)} className="text-white/40 hover:text-white">
                      <X size={24} />
                    </button>
                  </div>
                  <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="What's on your mind?"
                    className="w-full input min-h-[120px] resize-none"
                    style={{ background: 'var(--bg-secondary)' }}
                  />
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => setShowPostModal(false)}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreatePost}
                      disabled={submitting || !postContent.trim()}
                      className="px-4 py-2 bg-brand-500 hover:bg-brand-600 rounded-lg text-white disabled:opacity-50"
                    >
                      {submitting ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Feed */}
            {feedLoading ? (
              <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>Loading posts...</div>
            ) : feedPosts.length === 0 ? (
              <div className="card p-8 text-center" style={{ color: 'var(--text-muted)' }}>
                <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
                <p>No posts yet. Be the first to share!</p>
                <button
                  onClick={() => setShowPostModal(true)}
                  className="mt-3 px-4 py-2 bg-brand-500 hover:bg-brand-600 rounded-lg text-white text-sm"
                >
                  Create First Post
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {feedPosts.map((post) => (
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
                    </div>

                    <p style={{ color: 'var(--text-primary)' }} className="mb-3 whitespace-pre-wrap">
                      {post.content}
                    </p>

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
                        {commentingPost === post.id ? (
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
                              onClick={() => setCommentingPost(null)}
                              className="px-3 py-1 bg-white/10 rounded-lg text-white text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setCommentingPost(post.id)}
                            className="text-sm text-brand-400 hover:underline mt-2"
                          >
                            Add comment
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== COMMUNITIES TAB ===== */}
        {activeTab === 'communities' && (
          <div>
            {/* Search and Filter */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-1 min-w-[200px] relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search communities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full input pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedType('all')}
                  className={`px-4 py-2 rounded-lg text-sm transition ${
                    selectedType === 'all' 
                      ? 'bg-brand-500 text-white' 
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  All
                </button>
                {['study_group', 'discussion', 'club', 'hobby'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-4 py-2 rounded-lg text-sm transition ${
                      selectedType === type 
                        ? 'bg-brand-500 text-white' 
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {type === 'study_group' ? '📖 Study' :
                     type === 'discussion' ? '💬 Discussion' :
                     type === 'club' ? '🏛️ Club' : '🎨 Hobby'}
                  </button>
                ))}
              </div>
            </div>

            {/* Community List */}
            {communitiesLoading ? (
              <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>Loading communities...</div>
            ) : communities.length === 0 ? (
              <div className="card p-12 text-center" style={{ color: 'var(--text-muted)' }}>
                <Users size={48} className="mx-auto mb-3 opacity-30" />
                <p>No communities found. Be the first to create one!</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-3 px-4 py-2 bg-brand-500 hover:bg-brand-600 rounded-lg text-white"
                >
                  Create Community
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {communities.map((community) => (
                  <div key={community.id} className="card p-5 hover:shadow-lg transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">
                            {community.type === 'study_group' ? '📖' : 
                             community.type === 'discussion' ? '💬' :
                             community.type === 'club' ? '🏛️' : '🎨'}
                          </span>
                          <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                            {community.name}
                          </h3>
                        </div>
                        <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                          {community.description || 'No description'}
                        </p>
                      </div>
                      {community.is_private && <Lock size={16} className="text-yellow-400 flex-shrink-0" />}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span>👥 {community.member_count || 0} members</span>
                      <span>📝 {community.post_count || 0} posts</span>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      {community.is_member ? (
                        <button
                          onClick={() => navigate(`/momentum/community/${community.id}`)}
                          className="flex-1 py-2 bg-brand-500 hover:bg-brand-600 rounded-lg text-white text-sm transition"
                        >
                          Visit Community
                        </button>
                      ) : (
                        <button
                          onClick={() => handleJoinCommunity(community.id)}
                          className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition flex items-center justify-center gap-1"
                        >
                          <UserPlus size={14} /> Join
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== EVENTS TAB ===== */}
        {activeTab === 'events' && (
          <div className="card p-8 text-center" style={{ color: 'var(--text-muted)' }}>
            <Calendar size={48} className="mx-auto mb-3 opacity-30" />
            <p>Events coming soon!</p>
            <p className="text-sm mt-1">Stay tuned for school and community events.</p>
          </div>
        )}
      </div>

      {/* Create Community Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Create Community</h2>
            <form onSubmit={handleCreateCommunity} className="space-y-4">
              <div>
                <label className="text-white/80 text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={newCommunity.name}
                  onChange={(e) => setNewCommunity(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full input mt-1"
                  required
                />
              </div>
              <div>
                <label className="text-white/80 text-sm font-medium">Description</label>
                <textarea
                  value={newCommunity.description}
                  onChange={(e) => setNewCommunity(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full input mt-1"
                  rows="3"
                />
              </div>
              <div>
                <label className="text-white/80 text-sm font-medium">Type</label>
                <select
                  value={newCommunity.type}
                  onChange={(e) => setNewCommunity(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full input mt-1"
                >
                  <option value="study_group">📖 Study Group</option>
                  <option value="discussion">💬 Discussion Group</option>
                  <option value="club">🏛️ Club Community</option>
                  <option value="hobby">🎨 Hobby Group</option>
                </select>
              </div>
              <div>
                <label className="text-white/80 text-sm font-medium">Category (optional)</label>
                <input
                  type="text"
                  value={newCommunity.category}
                  onChange={(e) => setNewCommunity(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full input mt-1"
                  placeholder="e.g., Mathematics, Programming"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 rounded-lg text-white"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}