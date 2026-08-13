// frontend/src/pages/StudyGroupDetail.jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Users, Clock, Zap, Target, Loader2, Play, BookOpen, Share2 } from 'lucide-react';
import PageBackground from '../components/PageBackground';

export default function StudyGroupDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [focusDuration, setFocusDuration] = useState(25);

  useEffect(() => {
    loadGroupData();
  }, [id]);

  const loadGroupData = async () => {
    setLoading(true);
    try {
      const data = await api.getStudyGroup(id);
      setGroup(data.group);
      setMembers(data.members);
      setSessions(data.sessions);
      // Check if user is a member
      setIsMember(data.members.some(m => m.id === user?.id));
      // Load resources
      const resourcesData = await api.getGroupResources(id);
      setResources(resourcesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    try {
      await api.joinStudyGroup(id);
      setIsMember(true);
      loadGroupData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogFocus = async () => {
    try {
      await api.logGroupFocus(id, focusDuration);
      showToast('Focus session logged! +XP');
      loadGroupData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-6 flex justify-center"><Loader2 className="animate-spin" size={40} /></div>;
  if (!group) return <div className="p-6 text-white/40">Study group not found.</div>;

  return (
    <PageBackground imageUrl="/studysphere-bg.jpg">
      <div className="max-w-4xl mx-auto p-6">
        {/* Group Header */}
        <div className="card p-5 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{group.name}</h1>
              <p className="text-white/60 mt-1">{group.description}</p>
              <div className="flex gap-4 mt-2 text-sm text-white/40">
                <span className="flex items-center gap-1"><Users size={16} /> {members.length} members</span>
                <span className="flex items-center gap-1"><Clock size={16} /> {group.focus_sessions_count} sessions</span>
                <span className="flex items-center gap-1"><Zap size={16} /> {group.total_xp} group XP</span>
                <span className="flex items-center gap-1"><Target size={16} /> {group.weekly_hours}h/week goal</span>
              </div>
            </div>
            {!isMember ? (
              <button onClick={handleJoin} className="btn-primary">Join Group</button>
            ) : (
              <span className="text-green-400 bg-green-500/10 px-3 py-1 rounded-full text-sm">Member</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Log Focus Session */}
            {isMember && (
              <div className="card p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2"><Play size={18} className="text-brand-400" /> Log Focus Session</h3>
                <div className="flex gap-2">
                  <select value={focusDuration} onChange={(e) => setFocusDuration(e.target.value)} className="input w-24">
                    {[15, 25, 45, 60].map(m => <option key={m} value={m}>{m}m</option>)}
                  </select>
                  <button onClick={handleLogFocus} className="btn-primary">Log Session</button>
                </div>
              </div>
            )}

            {/* Resources */}
            <div className="card p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2"><BookOpen size={18} className="text-brand-400" /> Shared Resources</h3>
              {resources.length === 0 ? (
                <p className="text-white/40 text-sm">No resources shared yet.</p>
              ) : (
                <ul className="space-y-2">
                  {resources.map(r => (
                    <li key={r.id} className="flex justify-between items-center p-2 bg-white/5 rounded">
                      <div>
                        <p className="font-medium text-sm">{r.title}</p>
                        <p className="text-xs text-white/40">{r.author_name}</p>
                      </div>
                      {r.url && <a href={r.url} target="_blank" rel="noopener" className="text-brand-400 hover:underline text-sm">View</a>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Sidebar – Members */}
          <div className="card p-4">
            <h3 className="font-semibold mb-2">Members</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {members.map(m => (
                <div key={m.id} className="flex items-center justify-between p-2 bg-white/5 rounded">
                  <span className="text-sm">{m.full_name || m.username}</span>
                  <span className="text-xs text-white/40">{m.xp_contributed || 0} XP</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageBackground>
  );
}