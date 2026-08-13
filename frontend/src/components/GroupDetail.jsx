// frontend/src/components/groups/GroupDetail.jsx
import { useState, useEffect } from 'react';
import { Users, Calendar, MessageSquare, UserPlus, Check, Lock, Globe } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import PostCard from '../PostCard';

export default function GroupDetail({ groupId }) {
  const { showToast } = useToast();
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    loadGroupData();
  }, [groupId]);

  const loadGroupData = async () => {
    setLoading(true);
    try {
      const [groupData, postsData, sessionsData, membersData] = await Promise.all([
        api.getGroupDetails(groupId),
        api.getGroupPosts(groupId),
        api.getGroupSessions(groupId),
        api.getGroupMembers(groupId),
      ]);
      setGroup(groupData);
      setPosts(postsData);
      setSessions(sessionsData);
      setMembers(membersData);
      setIsMember(groupData.is_member || false);
    } catch (err) {
      console.error(err);
      showToast('Failed to load group', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    try {
      await api.joinGroup(groupId);
      setIsMember(true);
      showToast(`You joined ${group.name}`);
      loadGroupData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    setSubmitting(true);
    try {
      await api.createGroupPost(groupId, newPost);
      setNewPost('');
      showToast('Post created!');
      loadGroupData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-8 w-48 bg-white/10 animate-pulse rounded" />
        <div className="h-24 bg-white/10 animate-pulse rounded" />
        <div className="h-32 bg-white/10 animate-pulse rounded" />
      </div>
    );
  }

  if (!group) {
    return <div className="text-white/40">Group not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Group Header */}
      <div className="card p-5 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{group.name}</h1>
              {group.is_private ? (
                <Lock size={18} className="text-white/40" />
              ) : (
                <Globe size={18} className="text-white/40" />
              )}
            </div>
            <p className="text-white/60 mt-1">{group.description}</p>
            <div className="flex gap-3 mt-2 text-sm text-white/40">
              <span className="capitalize badge bg-white/5 border border-white/10">{group.type}</span>
              <span className="flex items-center gap-1"><Users size={14} /> {members.length} members</span>
            </div>
          </div>
          {!isMember ? (
            <button onClick={handleJoin} className="btn-primary flex items-center gap-1">
              <UserPlus size={16} /> Join Group
            </button>
          ) : (
            <span className="text-green-400 bg-green-500/10 px-3 py-1 rounded-full text-sm flex items-center gap-1">
              <Check size={16} /> Member
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2 mb-6">
        {['posts', 'sessions', 'members'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg capitalize transition ${
              activeTab === tab
                ? 'bg-brand-500 text-white'
                : 'hover:bg-white/10 text-white/60'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div>
          {isMember && (
            <form onSubmit={handleCreatePost} className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 input"
                  placeholder="Share something with the group..."
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  disabled={submitting}
                />
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          )}
          {posts.length === 0 ? (
            <p className="text-white/40 text-center py-8">No posts yet. Be the first to share!</p>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  comments={post.comments || []}
                  currentUserId={null} // You can pass user.id if needed
                  onLike={() => {}}
                  onToggleComments={() => {}}
                  onComment={() => {}}
                  onDelete={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <p className="text-white/40 text-center py-8">No sessions scheduled.</p>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="card p-4">
                <h4 className="font-semibold">{session.title}</h4>
                <p className="text-white/60 text-sm">{session.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                  <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(session.scheduled_at).toLocaleString()}</span>
                  <span>{session.duration_minutes} min</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/10">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs">
                {(member.full_name?.[0] || member.username?.[0] || 'U').toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-sm">{member.full_name || member.username}</p>
                <p className="text-xs text-white/40">{member.role || 'member'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}