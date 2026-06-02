import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Send, Users, Zap } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';

function PostCard({ post, onLike }) {
  const initials = (post.full_name || post.username || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center font-display font-bold text-xs shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate">{post.full_name || post.username}</span>
            <span className="flex items-center gap-0.5 text-[10px] text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded-md">
              <Zap size={8} /> {post.level}
            </span>
          </div>
          <span className="text-xs text-white/30">{timeAgo(post.created_at)}</span>
        </div>
      </div>
      <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{post.content}</p>
      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/[0.06]">
        <button onClick={() => onLike(post.id)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all duration-150
            ${post.is_liked ? 'text-red-400 bg-red-500/10' : 'text-white/30 hover:text-red-400 hover:bg-red-500/10'}`}>
          <Heart size={13} className={post.is_liked ? 'fill-current' : ''} />
          <span>{post.likes_count || 0}</span>
        </button>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postText, setPostText] = useState('');
  const [posting, setPosting] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const textareaRef = useRef();

  useEffect(() => {
    const load = async () => {
      try {
        const [commsData, postsData] = await Promise.all([
          api.getCommunities(),
          api.getPosts(id),
        ]);
        const comm = commsData.communities.find(c => c.id === id);
        setCommunity(comm);
        setIsMember(comm?.is_member || false);
        setPosts(postsData.posts);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const handlePost = async () => {
    if (!postText.trim()) return;
    setPosting(true);
    try {
      const data = await api.createPost(id, { content: postText.trim() });
      setPosts(p => [data.post, ...p]);
      setPostText('');
    } catch (err) { alert(err.message); }
    finally { setPosting(false); }
  };

  const handleLike = async (postId) => {
    const data = await api.likePost(postId);
    setPosts(p => p.map(post => post.id === postId
      ? { ...post, is_liked: data.liked, likes_count: data.liked ? post.likes_count + 1 : Math.max(0, post.likes_count - 1) }
      : post));
  };

  const handleJoinLeave = async () => {
    if (isMember) {
      await api.leaveCommunity(id);
      setIsMember(false);
    } else {
      await api.joinCommunity(id);
      setIsMember(true);
    }
  };

  if (loading) return <div className="p-6"><div className="h-40 rounded-2xl glass shimmer" /></div>;

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-up">
      {/* Header */}
      <button onClick={() => navigate('/communities')} className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-5 transition-colors">
        <ArrowLeft size={16} /> Back to communities
      </button>

      {community && (
        <div className="card glass-strong mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center">
                <i className={`${community.icon || 'ti-users'} text-white text-xl`} />
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
          {community.description && <p className="text-sm text-white/40 mt-3 leading-relaxed">{community.description}</p>}
        </div>
      )}

      {/* Compose */}
      {isMember ? (
        <div className="card mb-5">
          <textarea ref={textareaRef} className="input resize-none h-24 mb-3" placeholder="Share something with the community…"
            value={postText} onChange={e => setPostText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handlePost(); }} />
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/25">Ctrl+Enter to post</span>
            <button onClick={handlePost} disabled={!postText.trim() || posting} className="btn-primary py-2 text-sm">
              {posting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Send size={14} /> Post</>}
            </button>
          </div>
        </div>
      ) : (
        <div className="card mb-5 text-center py-6 text-sm text-white/30">
          Join this community to post and interact
        </div>
      )}

      {/* Posts */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-white/30 text-sm">No posts yet. Be the first to share!</p>
          </div>
        ) : posts.map(post => (
          <PostCard key={post.id} post={post} onLike={handleLike} />
        ))}
      </div>
    </div>
  );
}