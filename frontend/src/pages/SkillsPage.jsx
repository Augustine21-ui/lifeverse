// frontend/src/pages/SkillsPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, Target, Award, BarChart3, 
  Loader2, Plus, X
} from 'lucide-react';

export default function SkillsPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState({ level: 1, xp: 0, goalsCount: 0, skillsCount: 0, achievementsCount: 0 });
  const [goals, setGoals] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', category: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading skills data...');
      const [summaryRes, goalsRes, userSkillsRes, achievementsRes] = await Promise.all([
        api.getSkillsSummary(),
        api.getGoals(),
        api.getUserSkills(),
        api.getUserBadges(),
      ]);

      console.log('📊 Summary:', summaryRes);
      console.log('📋 Goals:', goalsRes);
      console.log('📚 User Skills:', userSkillsRes);
      console.log('🏅 Achievements:', achievementsRes);

      setSummary(summaryRes?.summary || summaryRes || { level: 1, xp: 0, goalsCount: 0, skillsCount: 0, achievementsCount: 0 });
      setGoals(Array.isArray(goalsRes) ? goalsRes : (goalsRes?.goals || goalsRes?.data || []));
      setUserSkills(Array.isArray(userSkillsRes) ? userSkillsRes : (userSkillsRes?.userSkills || userSkillsRes?.data || []));
      setAchievements(Array.isArray(achievementsRes) ? achievementsRes : (achievementsRes?.badges || achievementsRes?.data || []));
    } catch (err) {
      console.error('❌ Error loading skills data:', err);
      // Keep default empty arrays
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSkill = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createSkill(newSkill);
      setShowCreateModal(false);
      setNewSkill({ name: '', category: '', description: '' });
      await loadData(); // refresh
    } catch (err) {
      alert('Failed to create skill: ' + (err.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const safeSlice = (arr, start, end) => Array.isArray(arr) ? arr.slice(start, end) : [];

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-400" size={40} /></div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">📈 My Skills</h1>
      <p className="text-white/60 mb-6">Build skills. Track progress. Reach your goals.</p>

      {/* Summary Cards - always visible */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold">{summary?.level || 1}</div>
          <div className="text-sm text-white/40">Level</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold">{summary?.xp || 0}</div>
          <div className="text-sm text-white/40">XP</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold">{summary?.goalsCount || 0}</div>
          <div className="text-sm text-white/40">Goals</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold">{summary?.skillsCount || 0}</div>
          <div className="text-sm text-white/40">Skills</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold">{summary?.achievementsCount || 0}</div>
          <div className="text-sm text-white/40">Achievements</div>
        </div>
      </div>

      {/* No skills yet? Show a message and a create button */}
      {userSkills.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-white/60 mb-4">You haven't added any skills yet. Start your learning journey!</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2 mx-auto"
          >
            <Plus size={18} /> Create Your First Skill
          </button>
        </div>
      ) : (
        <>
          {/* List of skills (simple) */}
          <div className="card p-4 mb-6">
            <h2 className="text-lg font-semibold mb-3">Your Skills</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {userSkills.map(skill => (
                <div key={skill.id || skill.skill_id} className="bg-white/5 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{skill.name}</span>
                    <span className="text-xs text-white/40">
                      {skill.progress_percent ? `${Math.round(skill.progress_percent)}%` : 'Not started'}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full mt-1">
                    <div 
                      className="h-full bg-gradient-to-r from-brand-500 to-violet-500 rounded-full" 
                      style={{ width: `${skill.progress_percent || 0}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Goals Section */}
          <div className="card p-4 mb-6">
            <h2 className="text-lg font-semibold mb-3">Goals</h2>
            {goals.length === 0 ? (
              <p className="text-white/40">No goals yet.</p>
            ) : (
              <div className="space-y-2">
                {safeSlice(goals, 0, 3).map(goal => (
                  <div key={goal.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                    <div>
                      <p className="font-medium">{goal.title}</p>
                      <div className="text-xs text-white/40">Progress: {goal.progress || 0}%</div>
                    </div>
                    <span className="text-xs text-white/40">{goal.completed ? '✅ Done' : '⏳ Active'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Achievements Section */}
          <div className="card p-4">
            <h2 className="text-lg font-semibold mb-3">Achievements</h2>
            {achievements.length === 0 ? (
              <p className="text-white/40">No achievements yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {safeSlice(achievements, 0, 4).map(badge => (
                  <div key={badge.id} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                    <span className="text-2xl">{badge.icon || '🏅'}</span>
                    <span className="text-sm">{badge.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Create Skill Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}
        >
          <div className="w-full max-w-md card p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create New Skill</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-white/40 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateSkill} className="space-y-3">
              <div>
                <label className="text-sm text-white/60">Skill Name *</label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="e.g., React Development"
                  value={newSkill.name}
                  onChange={(e) => setNewSkill({...newSkill, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="text-sm text-white/60">Category</label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="e.g., Frontend"
                  value={newSkill.category}
                  onChange={(e) => setNewSkill({...newSkill, category: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm text-white/60">Description</label>
                <textarea
                  className="input w-full resize-none"
                  rows="2"
                  placeholder="Describe the skill..."
                  value={newSkill.description}
                  onChange={(e) => setNewSkill({...newSkill, description: e.target.value})}
                />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? 'Creating...' : 'Create Skill'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}