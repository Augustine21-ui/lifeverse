// frontend/src/pages/SkillsPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, Target, Award, BarChart3, 
  Loader2, Plus, X, ChevronRight
} from 'lucide-react';

export default function SkillsPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState({ level: 1, xp: 0, goalsCount: 0, skillsCount: 0, achievementsCount: 0 });
  const [goals, setGoals] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [rankings, setRankings] = useState({ weekly: { rank: 0 }, school: { rank: 0 }, challenge: { rank: 0 }, overall: { rank: 0 } });
  const [loading, setLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState(null);

  // Goal Modal state
  const [showGoalModal, setShowGoalModal] = useState(false);  // ✅ This was missing
  const [goalForm, setGoalForm] = useState({
    title: '',
    description: '',
    category: 'academic',
    target_date: '',
    metadata: {}
  });
  const [submittingGoal, setSubmittingGoal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryRes, goalsRes, userSkillsRes, achievementsRes, rankingsRes] = await Promise.all([
        api.getSkillsSummary(),
        api.getGoals(),
        api.getUserSkills(),
        api.getUserBadges(),
        api.getLeaderboard ? api.getLeaderboard() : Promise.resolve({ weekly: { rank: 0 } })
      ]);

      setSummary(summaryRes?.summary || summaryRes || { level: 1, xp: 0, goalsCount: 0, skillsCount: 0, achievementsCount: 0 });
      setGoals(Array.isArray(goalsRes) ? goalsRes : (goalsRes?.goals || goalsRes?.data || []));
      setUserSkills(Array.isArray(userSkillsRes) ? userSkillsRes : (userSkillsRes?.userSkills || userSkillsRes?.data || []));
      setAchievements(Array.isArray(achievementsRes) ? achievementsRes : (achievementsRes?.badges || achievementsRes?.data || []));
      setRankings(rankingsRes || { weekly: { rank: 0 }, school: { rank: 0 }, challenge: { rank: 0 }, overall: { rank: 0 } });
    } catch (err) {
      console.error('Error loading skills data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    setSubmittingGoal(true);
    try {
      const payload = {
        title: goalForm.title,
        description: goalForm.description,
        category: goalForm.category,
        target_date: goalForm.target_date || null,
        metadata: goalForm.metadata || {}
      };
      await api.createGoal(payload);
      setShowGoalModal(false);
      setGoalForm({ title: '', description: '', category: 'academic', target_date: '', metadata: {} });
      await loadData(); // refresh goals
    } catch (err) {
      alert('Failed to create goal: ' + (err.error || err.message));
    } finally {
      setSubmittingGoal(false);
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

      {/* Summary Cards */}
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

      {userSkills.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-white/60 mb-4">You haven't added any skills yet. Start your learning journey!</p>
          <button onClick={() => {/* open skill creation modal later */}} className="btn-primary flex items-center gap-2 mx-auto">
            <Plus size={18} /> Create Your First Skill
          </button>
        </div>
      ) : (
        <>
          {/* Skill Growth Dashboard */}
          <div className="card p-4 mb-6">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <TrendingUp size={20} className="text-brand-400" />
              Skill Growth Dashboard
            </h2>
            <p className="text-sm text-white/40 mb-3">Select a skill to view detailed progress.</p>
            <div className="flex flex-wrap gap-2">
              {userSkills.map(skill => (
                <button
                  key={skill.id || skill.skill_id}
                  onClick={() => setSelectedSkill(skill)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                    selectedSkill?.id === skill.id || selectedSkill?.skill_id === skill.skill_id
                      ? 'bg-brand-500 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white/80'
                  }`}
                >
                  {skill.name}
                  <span className="text-xs opacity-60">({Math.round(skill.progress_percent || 0)}%)</span>
                </button>
              ))}
            </div>
            {selectedSkill && (
              <div className="mt-3 p-3 bg-white/5 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{selectedSkill.name}</h3>
                    <p className="text-xs text-white/40">Progress: {Math.round(selectedSkill.progress_percent || 0)}%</p>
                  </div>
                  <Link to={`/skill/${selectedSkill.id || selectedSkill.skill_id}`} className="text-brand-400 hover:underline text-sm flex items-center gap-1">
                    View Full Dashboard <ChevronRight size={14} />
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-white/40">
                  <div>Projects: 0</div>
                  <div>Challenges: 0</div>
                  <div>Practice: 0%</div>
                </div>
              </div>
            )}
          </div>

          {/* Goals Section - with New Goal button */}
          <div className="card p-4 mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Target size={20} className="text-brand-400" />
                Goals
              </h2>
              <button
                onClick={() => setShowGoalModal(true)}
                className="btn-primary text-sm flex items-center gap-1"
              >
                <Plus size={16} /> New Goal
              </button>
            </div>
            {goals.length === 0 ? (
              <p className="text-white/40">No goals yet. Create one to start your journey!</p>
            ) : (
              <div className="space-y-2">
                {safeSlice(goals, 0, 3).map(goal => (
                  <div key={goal.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                    <div>
                      <p className="font-medium">{goal.title}</p>
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <span className={`px-1.5 py-0.5 rounded ${
                          goal.category === 'academic' ? 'bg-blue-500/20 text-blue-400' :
                          goal.category === 'skill' ? 'bg-green-500/20 text-green-400' :
                          goal.category === 'career' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-orange-500/20 text-orange-400'
                        }`}>
                          {goal.category}
                        </span>
                        <span>Progress: {goal.progress || 0}%</span>
                        {goal.target_date && <span>• Due: {new Date(goal.target_date).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${goal.completed ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {goal.completed ? '✅ Done' : 'Active'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Skills Overview */}
          <div className="card p-4 mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 size={20} className="text-blue-400" />
                Skills Overview
              </h2>
              <span className="text-sm text-white/40">{userSkills.length} skills</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {safeSlice(userSkills, 0, 4).map(skill => (
                <div key={skill.id || skill.skill_id} className="p-3 bg-white/5 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{skill.name}</span>
                    <span className="text-xs text-white/40">{skill.level || 'Beginner'}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full mt-1">
                    <div className="h-full bg-gradient-to-r from-brand-500 to-violet-500 rounded-full" style={{ width: `${skill.progress_percent || 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div className="card p-4 mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Award size={20} className="text-yellow-400" />
                Achievements
              </h2>
              <Link to="/badges" className="text-sm text-brand-400 hover:underline">View All →</Link>
            </div>
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

          {/* Rankings */}
          <div className="card p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp size={20} className="text-purple-400" />
                My Ranking
              </h2>
              <Link to="/leaderboard" className="text-sm text-brand-400 hover:underline">View Rankings →</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="p-2 bg-white/5 rounded text-center">
                <p className="text-sm text-white/40">Weekly</p>
                <p className="text-xl font-bold">#{rankings?.weekly?.rank || '—'}</p>
              </div>
              <div className="p-2 bg-white/5 rounded text-center">
                <p className="text-sm text-white/40">School</p>
                <p className="text-xl font-bold">#{rankings?.school?.rank || '—'}</p>
              </div>
              <div className="p-2 bg-white/5 rounded text-center">
                <p className="text-sm text-white/40">Challenge</p>
                <p className="text-xl font-bold">#{rankings?.challenge?.rank || '—'}</p>
              </div>
              <div className="p-2 bg-white/5 rounded text-center">
                <p className="text-sm text-white/40">Overall</p>
                <p className="text-xl font-bold">#{rankings?.overall?.rank || '—'}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Goal Creation Modal */}
      {showGoalModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowGoalModal(false)}
        >
          <div className="w-full max-w-md card p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create New Goal</h2>
              <button onClick={() => setShowGoalModal(false)} className="text-white/40 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateGoal} className="space-y-3">
              <div>
                <label className="text-sm text-white/60">Title *</label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="e.g., Learn React"
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({...goalForm, title: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="text-sm text-white/60">Description</label>
                <textarea
                  className="input w-full resize-none"
                  rows="2"
                  placeholder="Describe your goal..."
                  value={goalForm.description}
                  onChange={(e) => setGoalForm({...goalForm, description: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm text-white/60">Category</label>
                <select
                  className="input w-full"
                  value={goalForm.category}
                  onChange={(e) => setGoalForm({...goalForm, category: e.target.value})}
                >
                  <option value="academic">Academic</option>
                  <option value="skill">Skill</option>
                  <option value="personal">Personal</option>
                  <option value="career">Career</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-white/60">Target Date (optional)</label>
                <input
                  type="date"
                  className="input w-full"
                  value={goalForm.target_date}
                  onChange={(e) => setGoalForm({...goalForm, target_date: e.target.value})}
                />
              </div>
              {goalForm.category === 'personal' && (
                <div>
                  <label className="text-sm text-white/60">Sessions Target (e.g., 30)</label>
                  <input
                    type="number"
                    className="input w-full"
                    placeholder="30"
                    value={goalForm.metadata.sessions_target || ''}
                    onChange={(e) => setGoalForm({
                      ...goalForm,
                      metadata: { ...goalForm.metadata, sessions_target: parseInt(e.target.value) || 30 }
                    })}
                  />
                </div>
              )}
              {goalForm.category === 'skill' && (
                <div>
                  <label className="text-sm text-white/60">Skill Name (if different from title)</label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="React Development"
                    value={goalForm.metadata.skill_name || ''}
                    onChange={(e) => setGoalForm({
                      ...goalForm,
                      metadata: { ...goalForm.metadata, skill_name: e.target.value }
                    })}
                  />
                </div>
              )}
              <button type="submit" disabled={submittingGoal} className="btn-primary w-full">
                {submittingGoal ? 'Creating...' : 'Create Goal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}