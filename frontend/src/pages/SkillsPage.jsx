// frontend/src/pages/SkillsPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, Target, Award, BarChart3, 
  User, Zap, Calendar, ArrowRight, 
  CheckCircle, Clock, Plus, Edit, Trash2,
  Loader2, ChevronDown, ChevronUp, Star, X
} from 'lucide-react';

export default function SkillsPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState({
    level: 1,
    xp: 0,
    goalsCount: 0,
    skillsCount: 0,
    achievementsCount: 0
  });
  const [goals, setGoals] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [rankings, setRankings] = useState({ weekly: { rank: 0 }, school: { rank: 0 }, challenge: { rank: 0 }, overall: { rank: 0 } });
  const [loading, setLoading] = useState(true);

  // Goal modal state
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalForm, setGoalForm] = useState({
    title: '',
    description: '',
    target_date: '',
    progress: 0,
  });
  const [submittingGoal, setSubmittingGoal] = useState(false);

  // Safe slice helper - prevents .slice() errors on non-arrays
  const safeSlice = (arr, start, end) => {
    return Array.isArray(arr) ? arr.slice(start, end) : [];
  };

  // Load all data
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

      // Extract data with fallbacks - handle both array and object responses
      setSummary(summaryRes?.summary || summaryRes || { level: 1, xp: 0, goalsCount: 0, skillsCount: 0, achievementsCount: 0 });
      setGoals(Array.isArray(goalsRes) ? goalsRes : (goalsRes?.goals || goalsRes?.data || []));
      setUserSkills(Array.isArray(userSkillsRes) ? userSkillsRes : (userSkillsRes?.userSkills || userSkillsRes?.data || []));
      setAchievements(Array.isArray(achievementsRes) ? achievementsRes : (achievementsRes?.badges || achievementsRes?.data || []));
      setRankings(rankingsRes || { weekly: { rank: 0 }, school: { rank: 0 }, challenge: { rank: 0 }, overall: { rank: 0 } });
    } catch (err) {
      console.error('Error loading skills data:', err);
      // Set empty fallbacks on error
      setGoals([]);
      setUserSkills([]);
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    setSubmittingGoal(true);
    try {
      await api.createGoal({
        title: goalForm.title,
        description: goalForm.description,
        target_date: goalForm.target_date || null,
        progress: parseInt(goalForm.progress) || 0,
      });
      setShowGoalModal(false);
      setGoalForm({ title: '', description: '', target_date: '', progress: 0 });
      // Refresh goals
      const updatedGoals = await api.getGoals();
      setGoals(Array.isArray(updatedGoals) ? updatedGoals : (updatedGoals?.goals || updatedGoals?.data || []));
      // Also refresh summary
      const updatedSummary = await api.getSkillsSummary();
      setSummary(updatedSummary?.summary || updatedSummary || { level: 1, xp: 0, goalsCount: 0, skillsCount: 0, achievementsCount: 0 });
    } catch (err) {
      console.error('Error creating goal:', err);
      alert('Failed to create goal. Please try again.');
    } finally {
      setSubmittingGoal(false);
    }
  };

  // Memoized display data for performance
  const displayGoals = useMemo(() => safeSlice(goals, 0, 3), [goals]);
  const displaySkills = useMemo(() => safeSlice(userSkills, 0, 4), [userSkills]);
  const displayAchievements = useMemo(() => safeSlice(achievements, 0, 4), [achievements]);

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-400" size={40} /></div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">📈 My Skills</h1>
      <p className="text-white/60 mb-6">Build skills. Track progress. Reach your goals.</p>

      {/* Growth Overview */}
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

      {/* Current Goals */}
      <div className="card p-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Target size={20} className="text-brand-400" />
            Current Goals
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGoalModal(true)}
              className="btn-primary text-sm flex items-center gap-1"
            >
              <Plus size={16} />
              New Goal
            </button>
            <Link to="/goals" className="text-sm text-brand-400 hover:underline">View All →</Link>
          </div>
        </div>
        {displayGoals.length === 0 ? (
          <p className="text-white/40">No active goals. <button onClick={() => setShowGoalModal(true)} className="text-brand-400 hover:underline">Create one</button>.</p>
        ) : (
          <div className="space-y-2">
            {displayGoals.map(goal => (
              <div key={goal.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                <div>
                  <p className="font-medium">{goal.title}</p>
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <span>Progress: {goal.progress || 0}%</span>
                    {goal.target_date && <span>• Due: {new Date(goal.target_date).toLocaleDateString()}</span>}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${goal.completed ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {goal.completed ? 'Completed' : 'Active'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Skills */}
      <div className="card p-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-400" />
            My Skills
          </h2>
          <button className="text-sm text-brand-400 hover:underline">View All →</button>
        </div>
        {displaySkills.length === 0 ? (
          <p className="text-white/40">You haven't developed any skills yet. Start learning!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {displaySkills.map(skill => (
              <div key={skill.id} className="p-3 bg-white/5 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{skill.name}</span>
                  <span className="text-xs text-white/40">{skill.level || 'Beginner'}</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full mt-1">
                  <div className="h-full bg-gradient-to-r from-brand-500 to-violet-500 rounded-full" style={{ width: `${skill.progress || 0}%` }} />
                </div>
                <div className="text-xs text-white/30 mt-1">{skill.progress || 0}%</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Achievements */}
      <div className="card p-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Award size={20} className="text-yellow-400" />
            Recent Achievements
          </h2>
          <Link to="/badges" className="text-sm text-brand-400 hover:underline">View All →</Link>
        </div>
        {displayAchievements.length === 0 ? (
          <p className="text-white/40">No achievements yet. Keep learning!</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {displayAchievements.map(badge => (
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

      {/* Goal Creation Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setShowGoalModal(false)}>
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
                  placeholder="e.g., Learn Python"
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({...goalForm, title: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="text-sm text-white/60">Description (optional)</label>
                <textarea
                  className="input w-full resize-none"
                  rows="2"
                  placeholder="Describe your goal..."
                  value={goalForm.description}
                  onChange={(e) => setGoalForm({...goalForm, description: e.target.value})}
                />
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
              <div>
                <label className="text-sm text-white/60">Initial Progress (0-100)</label>
                <input
                  type="number"
                  className="input w-full"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={goalForm.progress}
                  onChange={(e) => setGoalForm({...goalForm, progress: parseInt(e.target.value) || 0})}
                />
              </div>
              <button type="submit" disabled={submittingGoal} className="btn-primary w-full flex items-center justify-center gap-2">
                {submittingGoal ? <Loader2 size={16} className="animate-spin" /> : 'Create Goal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}