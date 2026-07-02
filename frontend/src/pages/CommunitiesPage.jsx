// frontend/src/pages/CommunitiesPage.jsx
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Loader2, Plus, X, MessageCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';
import PageBackground from '../components/PageBackground';

export default function CommunitiesPage() {
  const { showToast } = useToast();
  const [communities, setCommunities] = useState([]);
  const [joinedCommunities, setJoinedCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    course: '',
    education_level: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadCommunities = async () => {
    try {
      const data = await api.getCommunities();
      setCommunities(data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load communities', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadJoined = async () => {
    try {
      const data = await api.getMyCommunities();
      setJoinedCommunities(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCommunities();
    loadJoined();
  }, []);

  const isJoined = (communityId) => joinedCommunities.some(c => c.id === communityId);

  const handleJoin = async (communityId) => {
    try {
      await api.joinCommunity(communityId);
      showToast('Joined community!');
      await loadJoined();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleLeave = async (communityId) => {
    try {
      await api.leaveCommunity(communityId);
      showToast('Left community');
      await loadJoined();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('Community name is required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.createCommunity({
        ...form,
        course: form.course || null,
        education_level: form.education_level || null,
      });
      showToast('Community created successfully!');
      setShowModal(false);
      setForm({ name: '', description: '', category: '', course: '', education_level: '' });
      await loadCommunities();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageBackground imageUrl="/communities-bg.jpg">
        <div className="p-6 flex justify-center">
          <Loader2 className="animate-spin" size={40} />
        </div>
      </PageBackground>
    );
  }

  return (
    <PageBackground imageUrl="/communities-bg.jpg">
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Communities</h1>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Create a community
          </button>
        </div>

        {communities.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-white/40 mb-4">No communities yet. Be the first to create one!</p>
            <button onClick={() => setShowModal(true)} className="btn-primary">Create a community</button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {communities.map(community => {
              const joined = isJoined(community.id);
              return (
                <div key={community.id} className="card p-4">
                  <h2 className="text-xl font-semibold">{community.name}</h2>
                  <p className="text-white/60 text-sm mt-1">{community.description || 'No description'}</p>
                  <div className="flex gap-2 mt-2 text-xs text-white/40">
                    {community.category && <span>Category: {community.category}</span>}
                    {community.course && <span>Course: {community.course}</span>}
                    {community.education_level && <span>Level: {community.education_level}</span>}
                  </div>
                  <div className="flex gap-2 mt-3">
                    {joined && (
                      <Link
                        to={`/community-chat/${community.id}`}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium bg-brand-500 text-white hover:bg-brand-600 transition"
                      >
                        <MessageCircle size={14} /> Chat
                      </Link>
                    )}
                    <button
                      onClick={() => joined ? handleLeave(community.id) : handleJoin(community.id)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                        joined
                          ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                          : 'bg-brand-500 text-white hover:bg-brand-600'
                      }`}
                    >
                      {joined ? 'Leave' : 'Join'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal unchanged */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
            <div className="w-full max-w-md card p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Create a Community</h2>
                <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className="label">Name *</label><input type="text" name="name" className="input" value={form.name} onChange={handleChange} required /></div>
                <div><label className="label">Description</label><textarea name="description" className="input resize-none" rows="3" value={form.description} onChange={handleChange} /></div>
                <div><label className="label">Category</label><input type="text" name="category" className="input" placeholder="e.g., study, hobby, career" value={form.category} onChange={handleChange} /></div>
                <div><label className="label">Course (optional)</label><input type="text" name="course" className="input" placeholder="e.g., Computer Science" value={form.course} onChange={handleChange} /></div>
                <div><label className="label">Education Level (optional)</label>
                  <select name="education_level" className="input" value={form.education_level} onChange={handleChange}>
                    <option value="">All levels</option>
                    <option value="Primary">Primary</option>
                    <option value="Secondary">Secondary</option>
                    <option value="University (Undergraduate)">University (Undergraduate)</option>
                    <option value="University (Postgraduate)">University (Postgraduate)</option>
                    <option value="TVET / Vocational">TVET / Vocational</option>
                    <option value="Adult Education">Adult Education</option>
                  </select>
                </div>
                <button type="submit" disabled={submitting} className="btn-primary w-full">{submitting ? <Loader2 size={16} className="animate-spin" /> : 'Create'}</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageBackground>
  );
}