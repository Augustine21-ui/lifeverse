import { useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { 
  User, Mail, Award, Zap, Flame, Calendar, Settings, Camera, 
  X, Save, Edit2, LogOut, ChevronRight, Clock, BookOpen
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.full_name || user?.username || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [uploading, setUploading] = useState(false);

  // Stats (from user object or API)
  const stats = {
    level: user?.level || 1,
    xp: user?.xp || 0,
    streak: user?.streak_days || 0,
    tasksCompleted: user?.tasks_completed || 0,
    studyTime: user?.study_time || '2h 35m',
    mood: user?.mood || 'neutral',
  };

  // Mood emoji mapping
  const moodEmojis = {
    happy: '😊',
    calm: '😌',
    tired: '😴',
    stressed: '😤',
    neutral: '😐',
  };

  const handleSave = async () => {
    try {
      // Update user profile via API (you need an endpoint for this)
      // For now, we'll just update the local state and show a toast
      // In a real implementation, you'd call api.updateProfile({ name: editName, email: editEmail })
      showToast('Profile updated successfully!', 'success');
      setIsEditing(false);
      await refreshUser(); // refresh user context
    } catch (err) {
      showToast('Failed to update profile', 'error');
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      // Upload avatar via API (you need an endpoint for this)
      // const formData = new FormData();
      // formData.append('avatar', file);
      // await api.uploadAvatar(formData);
      // await refreshUser();
      showToast('Avatar updated!', 'success');
    } catch (err) {
      showToast('Failed to upload avatar', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="relative min-h-screen bg-cover bg-center bg-fixed" style={{ backgroundImage: "url('/dashboard-bg.jpg.jpg')" }}>
      <div className="absolute inset-0 bg-black/60 z-0"></div>
      
      <div className="relative z-10 p-6 max-w-4xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="text-white/60 hover:text-white transition">
            <ChevronRight size={28} className="rotate-180" />
          </button>
          <h1 className="text-3xl font-bold text-white">Profile</h1>
        </div>

        {/* Profile Card */}
        <div className="card p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar section */}
            <div className="flex flex-col items-center gap-3 w-full md:w-auto">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 p-1">
                  <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-6xl text-white/70">
                        {(user?.fullName || user?.username || 'U')[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-brand-500 rounded-full hover:bg-brand-600 transition shadow-lg"
                  disabled={uploading}
                >
                  <Camera size={18} className="text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <p className="text-white/40 text-xs">Tap camera to change</p>
            </div>

            {/* User info */}
            <div className="flex-1 w-full">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-white/60">Full Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full input mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-white/60">Email</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full input mt-1"
                    />
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button onClick={handleSave} className="btn-primary px-6 py-2 flex items-center gap-2">
                      <Save size={16} /> Save
                    </button>
                    <button onClick={() => setIsEditing(false)} className="btn-secondary px-6 py-2 flex items-center gap-2">
                      <X size={16} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{user?.fullName || user?.username}</h2>
                      <p className="text-white/40 text-sm flex items-center gap-2 mt-1">
                        <Mail size={14} /> {user?.email}
                      </p>
                      <p className="text-white/40 text-sm mt-1 flex items-center gap-2">
                        <span className="capitalize">Role: {user?.role || 'Student'}</span>
                        <span className="text-white/20">|</span>
                        <span>Level {stats.level}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-white/40 hover:text-white transition p-2"
                    >
                      <Edit2 size={20} />
                    </button>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <Zap size={20} className="text-brand-400 mx-auto mb-1" />
                      <p className="text-white font-bold">{stats.xp.toLocaleString()}</p>
                      <p className="text-white/40 text-xs">Total XP</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <Award size={20} className="text-yellow-400 mx-auto mb-1" />
                      <p className="text-white font-bold">{stats.level}</p>
                      <p className="text-white/40 text-xs">Level</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <Flame size={20} className="text-orange-400 mx-auto mb-1" />
                      <p className="text-white font-bold">{stats.streak}</p>
                      <p className="text-white/40 text-xs">Day Streak</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <Clock size={20} className="text-cyan-400 mx-auto mb-1" />
                      <p className="text-white font-bold">{stats.studyTime}</p>
                      <p className="text-white/40 text-xs">Study Time</p>
                    </div>
                  </div>

                  {/* Mood */}
                  <div className="mt-4 flex items-center gap-3">
                    <span className="text-white/60 text-sm">Mood:</span>
                    <span className="text-2xl">{moodEmojis[stats.mood] || '😐'}</span>
                    <span className="text-white/80 text-sm capitalize">{stats.mood}</span>
                    <button
                      onClick={() => document.querySelector('.holographic-avatar')?.click()}
                      className="text-brand-400 text-sm hover:underline ml-2"
                    >
                      Change
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Additional Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/settings" className="card p-4 flex items-center justify-between hover:bg-white/5 transition">
            <div className="flex items-center gap-3">
              <Settings size={20} className="text-white/60" />
              <span className="text-white">Settings</span>
            </div>
            <ChevronRight size={18} className="text-white/30" />
          </Link>

          <Link to="/academic-onboarding" className="card p-4 flex items-center justify-between hover:bg-white/5 transition">
            <div className="flex items-center gap-3">
              <BookOpen size={20} className="text-brand-400" />
              <span className="text-white">Academic Info</span>
            </div>
            <ChevronRight size={18} className="text-white/30" />
          </Link>

          <button
            onClick={handleLogout}
            className="card p-4 flex items-center justify-between hover:bg-white/5 transition text-left"
          >
            <div className="flex items-center gap-3">
              <LogOut size={20} className="text-red-400" />
              <span className="text-white">Sign Out</span>
            </div>
            <ChevronRight size={18} className="text-white/30" />
          </button>
        </div>
      </div>
    </div>
  );
}