import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, Target, Award, BarChart3, 
  User, Zap, Calendar, ArrowRight, 
  CheckCircle, Clock, Plus, Edit, Trash2,
  Loader2, ChevronDown, ChevronUp, Star
} from 'lucide-react';

export default function SkillsPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [goals, setGoals] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [rankings, setRankings] = useState(null);
  const [loading, setLoading] = useState(true);

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
        api.getLeaderboard? api.getLeaderboard() : Promise.resolve({ weekly: { rank: 0 } })
      ]);
      setSummary(summaryRes);
      setGoals(goalsRes);
      setUserSkills(userSkillsRes);
      setAchievements(achievementsRes);
      setRankings(rankingsRes);
    } catch (err) {
      console.error('Error loading skills data:', err);
    } finally {
      setLoading(false);
    }
  };

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
          <Link to="/goals" className="text-sm text-brand-400 hover:underline">View All →</Link>
        </div>
        {goals.length === 0 ? (
          <p className="text-white/40">No active goals. <Link to="/goals" className="text-brand-400 hover:underline">Create one</Link>.</p>
        ) : (
          <div className="space-y-2">
            {goals.slice(0, 2).map(goal => (
              <div key={goal.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                <div>
                  <p className="font-medium">{goal.title}</p>
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <span>Progress: {goal.progress || 0}%</span>
                    {goal.deadline && <span>• Due: {new Date(goal.deadline).toLocaleDateString()}</span>}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${goal.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  {goal.status || 'Active'}
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
        {userSkills.length === 0 ? (
          <p className="text-white/40">You haven't developed any skills yet. Start learning!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {userSkills.slice(0, 4).map(skill => (
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
        {achievements.length === 0 ? (
          <p className="text-white/40">No achievements yet. Keep learning!</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {achievements.slice(0, 4).map(badge => (
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
    </div>
  );
}