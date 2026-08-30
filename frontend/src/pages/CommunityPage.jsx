import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Heart, Send, Users, Zap, MessageSquare, 
  Calendar, MapPin, Clock, Plus, X, ChevronRight,
  Globe, Lock, UserPlus, Check, Trash2
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';

function PostCard({ post, onLike, onComment, currentUserId, onDelete }) {
  const initials = (post.full_name || post.username || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="card p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center font-display font-bold text-xs shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate">{post.full_name || post.username}</span>
            <span className="flex items-center gap-0.5 text-[10px] text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded-md">
              <Zap size={8} /> {post.level || 0}
            </span>
          </div>
          <span className="text-xs text-white/30">{timeAgo(post.created_at)}</span>
        </div>
        {post.user_id === currentUserId && (
          <button onClick={() => onDelete(post.id)} className="text-white/30 hover:text-red-400">
            <Trash2 size={14} />
          </button>
        )}
      </div>
      <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{post.content}</p>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.06]">
        <button onClick={() => onLike(post.id)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all duration-150
            ${post.is_liked ? 'text-red-400 bg-red-500/10' : 'text-white/30 hover:text-red-400 hover:bg-red-500/10'}`}>
          <Heart size={13} className={post.is_liked ? 'fill-current' : ''} />
          <span>{post.likes_count || 0}</span>
        </button>
        <button onClick={() => onComment(post.id)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-white/30 hover:text-brand-400 hover:bg-brand-500/10 transition">
          <MessageSquare size={13} />
          <span>{post.comments_count || 0}</span>
        </button>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);

  // Feed
  const [posts, setPosts] = useState([]);
  const [postText, setPostText] = useState('');
  const [posting, setPosting] = useState(false);
  const [commentingPost, setCommentingPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState({});
  const [comments, setComments] = useState({});

  // Discussions
  const [discussions, setDiscussions] = useState([]);
  const [discussionsLoading, setDiscussionsLoading] = useState(false);
  const [showDiscussionModal, setShowDiscussionModal] = useState(false);
  const [discussionTitle, setDiscussionTitle] = useState('');
  const [discussionBody, setDiscussionBody] = useState('');
  const [submittingDiscussion, setSubmittingDiscussion] = useState(false);

  // Events
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  // Members
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('feed');

  const textareaRef = useRef();

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load community details
      const communityData = await api.getCommunityById(id);
      setCommunity(communityData);
      setIsMember(communityData.is_member || false);

      // Load posts, discussions, events, members in parallel
      await Promise.all([
        loadPosts(),
        loadDiscussions(),
        loadEvents(),
        loadMembers(),
      ]);
    } catch (err) {
      console.error(err);
      showToast('Failed to load community', 'error');
      navigate('/momentum');
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const data = await api.getCommunityPosts(id);
      setPosts(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadDiscussions = async () => {
    setDiscussionsLoading(true);
    try {
      // Try to fetch real discussions; fallback to mock
      // If you have a real endpoint, use it: await api.getCommunityDiscussions(id)
      const mock = [
        { id: 1, title: 'Best way to prepare for KCSE Mathematics?', author: 'Kevin M.', replies: 42, created_at: '2026-08-28T10:00:00' },
        { id: 2, title: 'Anyone interested in a group project on AI?', author: 'Aisha W.', replies: 18, created_at: '2026-08-29T14:30:00' },
        { id: 3, title: 'What are the best resources for learning React?', author: 'John D.', replies: 27, created_at: '2026-08-30T09:15:00' },
      ];
      setDiscussions(mock);
    } catch (err) {
      showToast('Failed to load discussions', 'error');
    } finally {
      setDiscussionsLoading(false);
    }
  };

  const loadEvents = async () => {
    setEventsLoading(true);
    try {
      // Try real endpoint or mock
      const mock = [
        { id: 1, title: 'KCSE Mathematics Revision', start_time: '2026-09-05T10:00:00', location: 'Online', attending_count: 124, user_rsvped: false },
        { id: 2, title: 'Web Development Workshop', start_time: '2026-09-06T16:00:00', location: 'Nairobi, Kenya', attending_count: 87, user_rsvped: false },
      ];
      setEvents(mock);
    } catch (err) {
      console.error(err);
    } finally {
      setEventsLoading(false);
    }
  };

  const loadMembers = async () => {
    setMembersLoading(true);
    try {
      const data = await api.getCommunityMembers(id);
      setMembers(data || []);
    } catch (err) {
      console.error(err);
      // Mock members
      setMembers([
        { id: 1, full_name: 'Alice M.' },
        { id: 2, full_name: 'Bob K.' },
        { id: 3, full_name: 'Carol W.' },
        { id: 4, full_name: 'David O.' },
      ]);
    } finally {
      setMembersLoading(false);
    }
  };

  // ─── Post interactions ──────────────────────────────────────────
  const handleCreatePost = async () => {
    if (!postText.trim()) return;
    setPosting(true);
    try {
      const data = await api.createPost({ community_id: parseInt(id), content: postText.trim() });
      setPosts(prev => [data, ...prev]);
      setPostText('');
      showToast('Post created!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to create post', 'error');
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const { liked } = await api.toggleLike(postId);
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, likes_count: p.likes_count + (liked ? 1 : -1), is_liked: liked } : p
      ));
    } catch (err) {
      showToast('Failed to like', 'error');
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

  const handleDeletePost = async (postId) => {
    if (!confirm('Delete this post?')) return;
    try {
      await api.deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
      showToast('Post deleted', 'success');
    } catch (err) {
      showToast('Failed to delete post', 'error');
    }
  };

  // ─── Discussion interactions ──────────────────────────────────
  const handleCreateDiscussion = async (e) => {
    e.preventDefault();
    if (!discussionTitle.trim() || !discussionBody.trim()) return;
    setSubmittingDiscussion(true);
    try {
      // If you have a real endpoint, use it; otherwise mock
      const newDisc = {
        id: Date.now(),
        title: discussionTitle,
        author: user?.full_name || 'You',
        replies: 0,
        created_at: new Date().toISOString(),
      };
      setDiscussions(prev => [newDisc, ...prev]);
      setShowDiscussionModal(false);
      setDiscussionTitle('');
      setDiscussionBody('');
      showToast('Discussion started!', 'success');
    } catch (err) {
      showToast('Failed to start discussion', 'error');
    } finally {
      setSubmittingDiscussion(false);
    }
  };

  // ─── Event RSVP ────────────────────────────────────────────────
  const handleRSVP = async (eventId) => {
    try {
      // Use your existing RSVP API
      await api.rsvpEvent(eventId, 'going');
      setEvents(prev => prev.map(e => 
        e.id === eventId ? { ...e, user_rsvped: true, attending_count: e.attending_count + 1 } : e
      ));
      showToast('You\'re attending!', 'success');
    } catch (err) {
      showToast('Failed to RSVP', 'error');
    }
  };

  // ─── Join/Leave community ─────────────────────────────────────
  const handleJoinLeave = async () => {
    if (isMember) {
      try {
        await api.leaveCommunity(id);
        setIsMember(false);
        showToast('Left community', 'info');
      } catch (err) {
        showToast('Failed to leave', 'error');
      }
    } else {
      try {
        await api.joinCommunity(id);
        setIsMember(true);
        showToast('Joined community!', 'success');
      } catch (err) {
        showToast('Failed to join', 'error');
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />
        <div className="mt-4 h-8 w-32 bg-white/5 animate-pulse rounded" />
        <div className="mt-6 space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-white/5 animate-pulse rounded" />)}
        </div>
      </div>
    );
  }

  if (!community) {
    return <div className="p-6 text-center text-white/40">Community not found.</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back button */}
      <button onClick={() => navigate('/momentum')} className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-5 transition-colors">
        <ArrowLeft size={16} /> Back to Momentum
      </button>

      {/* Community Header */}
      <div className="card p-5 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-xl">
              {community.icon || '📚'}
            </div>
            <div>
              <h1 className="font-display font-bold text-xl">{community.name}</h1>
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Users size={11} />
                <span>{(community.member_count || 0).toLocaleString()} members</span>
                {community.subject && <span>· {community.subject}</span>}
              </div>
            </div>
          </div>
          <button onClick={handleJoinLeave}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150
              ${isMember ? 'bg-white/5 text-white/50 hover:bg-red-500/10 hover:text-red-400 border border-white/10'
                : 'btn-primary text-sm py-2'}`}>
            {isMember ? 'Leave' : 'Join community'}
          </button>
        </div>
        {community.description && (
          <p className="text-sm text-white/40 mt-3 leading-relaxed">{community.description}</p>
        )}
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="text-[10px] px-2 py-0.5 bg-white/10 rounded-full text-white/40 capitalize">
            {community.type || 'community'}
          </span>
          {community.is_private && (
            <span className="text-[10px] px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full flex items-center gap-1">
              <Lock size={10} /> Private
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 mb-6">
        {['feed', 'discussions', 'events', 'members'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition border-b-2 ${
              activeTab === tab
                ? 'border-brand-500 text-brand-500'
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            {tab === 'feed' && '📝 Feed'}
            {tab === 'discussions' && '💬 Discussions'}
            {tab === 'events' && '📅 Events'}
            {tab === 'members' && '👥 Members'}
          </button>
        ))}
      </div>

      {/* ─── FEED TAB ───────────────────────────────────────────── */}
      {activeTab === 'feed' && (
        <div>
          {isMember ? (
            <div className="card mb-5">
              <textarea
                ref={textareaRef}
                className="input resize-none h-24 mb-3"
                placeholder="Share something with the community…"
                value={postText}
                onChange={e => setPostText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleCreatePost(); }}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/25">Ctrl+Enter to post</span>
                <button
                  onClick={handleCreatePost}
                  disabled={!postText.trim() || posting}
                  className="btn-primary py-2 text-sm"
                >
                  {posting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={14} /> Post</>}
                </button>
              </div>
            </div>
          ) : (
            <div className="card mb-5 text-center py-6 text-sm text-white/30">
              Join this community to post and interact
            </div>
          )}

          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-white/30 text-sm">No posts yet. Be the first to share!</p>
              </div>
            ) : posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onComment={(postId) => {
                  if (!showComments[postId]) loadComments(postId);
                  setCommentingPost(postId);
                }}
                currentUserId={user?.id}
                onDelete={handleDeletePost}
              />
            ))}
          </div>

          {/* Comment input overlay */}
          {commentingPost && (
            <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur p-4 border-t border-white/10 z-50">
              <div className="max-w-4xl mx-auto flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 input"
                  onKeyDown={(e) => e.key === 'Enter' && handleComment(commentingPost)}
                  autoFocus
                />
                <button
                  onClick={() => handleComment(commentingPost)}
                  className="btn-primary px-4"
                >
                  Reply
                </button>
                <button
                  onClick={() => {
                    setCommentingPost(null);
                    setCommentText('');
                  }}
                  className="px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── DISCUSSIONS TAB ────────────────────────────────────── */}
      {activeTab === 'discussions' && (
        <div>
          {isMember && (
            <button
              onClick={() => setShowDiscussionModal(true)}
              className="mb-4 px-4 py-2 bg-brand-500 hover:bg-brand-600 rounded-lg text-white text-sm flex items-center gap-1"
            >
              <Plus size={16} /> Start Discussion
            </button>
          )}

          {discussionsLoading ? (
            <div className="text-center py-8 text-white/40">Loading discussions...</div>
          ) : discussions.length === 0 ? (
            <div className="card p-8 text-center text-white/40">
              <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
              <p>No discussions yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {discussions.map((disc) => (
                <div
                  key={disc.id}
                  className="card p-4 hover:bg-white/5 transition cursor-pointer"
                  onClick={() => navigate(`/momentum/discussion/${disc.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-white/90">{disc.title}</h3>
                      <p className="text-sm text-white/40 mt-1">
                        Started by {disc.author} · {new Date(disc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-sm text-white/40 flex items-center gap-1">
                      <MessageSquare size={14} /> {disc.replies}
                    </div>
                  </div>
                  <button className="mt-2 text-sm text-brand-400 hover:underline flex items-center gap-1">
                    Join Discussion <ChevronRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── EVENTS TAB ──────────────────────────────────────────── */}
      {activeTab === 'events' && (
        <div>
          {eventsLoading ? (
            <div className="text-center py-8 text-white/40">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="card p-8 text-center text-white/40">
              <Calendar size={48} className="mx-auto mb-3 opacity-30" />
              <p>No upcoming events.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="card p-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white/90">{event.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-white/40">
                      <span className="flex items-center gap-1"><Clock size={14} /> {new Date(event.start_time).toLocaleString()}</span>
                      {event.location && <span className="flex items-center gap-1"><MapPin size={14} /> {event.location}</span>}
                    </div>
                    <div className="mt-1 text-xs text-white/40">👥 {event.attending_count || 0} attending</div>
                  </div>
                  <button
                    onClick={() => {
                      if (event.user_rsvped) {
                        showToast('You\'re already attending!', 'info');
                        return;
                      }
                      handleRSVP(event.id);
                    }}
                    className={`px-4 py-1.5 rounded-lg text-sm transition ${
                      event.user_rsvped
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-brand-500 text-white hover:bg-brand-600'
                    }`}
                  >
                    {event.user_rsvped ? '✅ Going' : 'RSVP'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── MEMBERS TAB ─────────────────────────────────────────── */}
      {activeTab === 'members' && (
        <div>
          {membersLoading ? (
            <div className="text-center py-8 text-white/40">Loading members...</div>
          ) : members.length === 0 ? (
            <div className="card p-8 text-center text-white/40">
              <Users size={48} className="mx-auto mb-3 opacity-30" />
              <p>No members yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs">
                    {(member.full_name?.[0] || member.username?.[0] || 'U').toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{member.full_name || member.username}</p>
                    <p className="text-xs text-white/40">{member.role || 'member'}</p>
                  </div>
                  {member.id === user?.id && (
                    <span className="ml-auto text-xs bg-brand-500/20 px-2 py-0.5 rounded text-brand-400">You</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── CREATE DISCUSSION MODAL ────────────────────────────── */}
      {showDiscussionModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setShowDiscussionModal(false)}>
          <div className="bg-gray-800 rounded-xl p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Start a Discussion</h2>
              <button onClick={() => setShowDiscussionModal(false)} className="text-white/40 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateDiscussion} className="space-y-4">
              <div>
                <label className="text-white/80 text-sm font-medium">Topic</label>
                <input
                  type="text"
                  value={discussionTitle}
                  onChange={(e) => setDiscussionTitle(e.target.value)}
                  className="w-full input mt-1"
                  placeholder="What do you want to discuss?"
                  required
                />
              </div>
              <div>
                <label className="text-white/80 text-sm font-medium">Details</label>
                <textarea
                  value={discussionBody}
                  onChange={(e) => setDiscussionBody(e.target.value)}
                  className="w-full input mt-1 min-h-[100px]"
                  placeholder="Explain your topic..."
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDiscussionModal(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDiscussion || !discussionTitle.trim() || !discussionBody.trim()}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 rounded-lg text-white disabled:opacity-50"
                >
                  {submittingDiscussion ? 'Creating...' : 'Create Discussion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}