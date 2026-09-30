// frontend/src/pages/SkillsPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Target, Award, BarChart3,
  Loader2, Plus, X, ChevronRight, Play,
  CheckCircle, Circle
} from 'lucide-react';
import { useMood } from '../context/MoodContext';
import { useToast } from '../context/ToastContext';
import ErrorBoundary from '../components/ErrorBoundary';
import './SkillsPage.css';

const BADGE_DEFINITIONS = [
  { id: 1, name: 'First Challenge', icon: '🏅', description: 'Completed your first challenge' },
  { id: 2, name: 'Consistent Learner', icon: '📚', description: '7-day learning streak' },
  { id: 3, name: 'Study Group Contributor', icon: '👥', description: 'Helped in a study group' },
  { id: 4, name: 'Community Builder', icon: '🏗️', description: 'Created a community' },
  { id: 5, name: 'Mathematics Mastery', icon: '📐', description: 'Mastered a math topic' },
  { id: 6, name: 'Coding Explorer', icon: '💻', description: 'Completed a coding project' },
  { id: 7, name: 'Project Creator', icon: '🚀', description: 'Created a project' },
];

export default function SkillsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { triggerMood } = useMood();

  const [summary, setSummary] = useState({ level: 1, xp: 0, goalsCount: 0, skillsCount: 0, achievementsCount: 0 });
  const [goals, setGoals] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [rankings, setRankings] = useState({ weekly: { rank: 0 }, school: { rank: 0 }, challenge: { rank: 0 }, overall: { rank: 0 } });
  const [loading, setLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState(null);

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalForm, setGoalForm] = useState({
    title: '', description: '', category: 'academic', target_date: '', metadata: {}
  });
  const [submittingGoal, setSubmittingGoal] = useState(false);

  const [showSkillModal, setShowSkillModal] = useState(false);
  const [skillName, setSkillName] = useState('');
  const [skillCategory, setSkillCategory] = useState('');
  const [submittingSkill, setSubmittingSkill] = useState(false);

  const [togglingMilestone, setTogglingMilestone] = useState(null);
  const [expandedGoalId, setExpandedGoalId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryRes, goalsRes, userSkillsRes, earnedBadgesRes, rankingsRes] = await Promise.all([
        // ✅ Guard: swallow any failure (401/404/shape error) so it can't poison the summary
        api.getSkillsSummary ? api.getSkillsSummary().catch(() => null) : Promise.resolve(null),
        api.getGoals().catch(() => []),
        api.getUserSkills().catch(() => []),
        api.getUserBadges().catch(() => []),
        api.getLeaderboard ? api.getLeaderboard().catch(() => ({ weekly: { rank: 0 } })) : Promise.resolve({ weekly: { rank: 0 } }),
      ]);

      const rawSkills = Array.isArray(userSkillsRes) ? userSkillsRes : (userSkillsRes?.userSkills || userSkillsRes?.data || []);
      const uniqueSkills = rawSkills.reduce((acc, skill) => {
        const name = skill.name || skill.skill_name;
        if (!acc.some(s => (s.name || s.skill_name) === name)) acc.push(skill);
        return acc;
      }, []);

      const earnedIds = (earnedBadgesRes || []).map(b => b.id);
      const achievementsData = BADGE_DEFINITIONS.map(b => ({ ...b, earned: earnedIds.includes(b.id) }));

      const liveGoals = Array.isArray(goalsRes) ? goalsRes : (goalsRes?.goals || goalsRes?.data || []);
      const liveEarned = achievementsData.filter(b => b.earned).length;

      // ✅ Derive every number. Prefer backend response, fall back to computed values,
      //    then to the auth-context user object. Never falls to 0 if data exists anywhere.
      const s = summaryRes?.summary ?? summaryRes ?? {};
      const pick = (...vals) => {
        for (const v of vals) {
          if (v !== undefined && v !== null && v !== '' && !Number.isNaN(Number(v))) {
            const n = Number(v);
            if (n > 0) return n;   // prefer positive values over accidental 0s
          }
        }
        return 0;
      };

      setSummary({
        level:             pick(s.level, s.userLevel, summaryRes?.level, user?.level, 1) || 1,
        xp:                pick(s.xp, s.totalXP, s.total_xp, summaryRes?.xp, summaryRes?.totalXP, user?.xp, 0),
        goalsCount:        pick(s.goalsCount, s.goals, summaryRes?.goalsCount, liveGoals.length),
        skillsCount:       pick(s.skillsCount, s.skills, summaryRes?.skillsCount, uniqueSkills.length),
        achievementsCount: pick(s.achievementsCount, s.achievements, summaryRes?.achievementsCount, liveEarned),
      });

      setGoals(liveGoals);
      setUserSkills(uniqueSkills);
      setAchievements(achievementsData);
      setRankings(rankingsRes || { weekly: { rank: 0 }, school: { rank: 0 }, challenge: { rank: 0 }, overall: { rank: 0 } });
    } catch (err) {
      console.error('Error loading skills data:', err);
      showToast('Some skills data failed to load', 'error');
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
        category: goalForm.category,
        target_date: goalForm.target_date || null,
        metadata: goalForm.metadata || {}
      });
      setShowGoalModal(false);
      setGoalForm({ title: '', description: '', category: 'academic', target_date: '', metadata: {} });
      await loadData();
      showToast('Goal created!');
    } catch (err) {
      showToast('Failed to create goal: ' + (err.error || err.message), 'error');
    } finally {
      setSubmittingGoal(false);
    }
  };

  const handleCreateSkill = async (e) => {
    e.preventDefault();
    if (!skillName.trim()) return;
    setSubmittingSkill(true);
    try {
      await api.createSkill({ name: skillName.trim(), category: skillCategory.trim() || undefined });
      setShowSkillModal(false);
      setSkillName('');
      setSkillCategory('');
      await loadData();
      showToast('Skill added!');
    } catch (err) {
      showToast('Failed to create skill: ' + (err.error || err.message), 'error');
    } finally {
      setSubmittingSkill(false);
    }
  };

  const handleToggleMilestone = async (goalId, milestoneId) => {
    try {
      setTogglingMilestone(milestoneId);
      const res = await api.toggleMilestone(goalId, milestoneId);
      if (res?.moodEvent) {
        triggerMood(res.moodEvent, { meta: { goalId, progress: res.progress, xpAwarded: res.xpAwarded } });
      }
      if (res?.xpAwarded > 0) showToast(`🎉 Goal complete! +${res.xpAwarded} XP`);
      else if (res?.allComplete) showToast('🎉 All milestones complete!');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to toggle milestone', 'error');
    } finally {
      setTogglingMilestone(null);
    }
  };

  const handleSubmitPractice = async (skillId, score = 80) => {
    try {
      const numericSkillId = parseInt(skillId, 10);
      if (isNaN(numericSkillId)) return showToast('Invalid skill ID', 'error');
      const res = await api.submitPracticeResult({ skillId: numericSkillId, score: Number(score) || 80, timeSpent: 60 });
      if (res?.moodEvent) {
        triggerMood(res.moodEvent, { meta: { skillId: numericSkillId, progressPercent: res.progressPercent } });
      }
      showToast(`+5 XP • Progress: ${res?.progressPercent || 0}%`);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to submit practice', 'error');
    }
  };

  const handleCompleteGoal = async (goalId) => {
    try {
      const res = await api.completeGoal(goalId);
      if (res?.moodEvent) triggerMood(res.moodEvent);
      if (res?.xpAwarded > 0) showToast(`🎉 Goal complete! +${res.xpAwarded} XP`);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to complete goal', 'error');
    }
  };

  const parseMilestones = (goal) => {
    let m = goal.milestones;
    if (typeof m === 'string') { try { m = JSON.parse(m); } catch { m = []; } }
    return Array.isArray(m) ? m : [];
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-400" size={40} /></div>;
  }

  return (
    <ErrorBoundary title="Skills page failed to load">
      <div className="skills-page">
        <h1>📈 My Skills</h1>
        <p className="skills-sub">Build skills. Track progress. Reach your goals.</p>

        {/* Summary Cards */}
        <div className="skills-summary-grid">
          <div className="skills-summary-card">
            <div className="skills-summary-value">{summary?.level || 1}</div>
            <div className="skills-summary-label">Level</div>
          </div>
          <div className="skills-summary-card">
            <div className="skills-summary-value">{summary?.xp || 0}</div>
            <div className="skills-summary-label">XP</div>
          </div>
          <div className="skills-summary-card">
            <div className="skills-summary-value">{summary?.goalsCount || 0}</div>
            <div className="skills-summary-label">Goals</div>
          </div>
          <div className="skills-summary-card">
            <div className="skills-summary-value">{summary?.skillsCount || 0}</div>
            <div className="skills-summary-label">Skills</div>
          </div>
          <div className="skills-summary-card">
            <div className="skills-summary-value">{summary?.achievementsCount || 0}</div>
            <div className="skills-summary-label">Achievements</div>
          </div>
        </div>

        {userSkills.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-2xl font-semibold text-white">Start building your skills</h3>
            <p className="text-white/60 max-w-md mx-auto mt-2">
              Skills are the building blocks of your career. Add your first skill and start tracking your progress.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <button onClick={() => setShowSkillModal(true)} className="btn-primary px-6 py-2.5 flex items-center gap-2">
                <Plus size={18} /> Create Your First Skill
              </button>
              <button onClick={() => setShowGoalModal(true)} className="btn-secondary px-6 py-2.5 flex items-center gap-2">
                <Target size={18} /> Set a Goal
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Skill Growth */}
            <div className="card mb-6">
              <h2 className="skills-section-title">
                <TrendingUp size={20} className="text-brand-400" /> Skill Growth
              </h2>
              <div className="flex flex-wrap gap-2">
                {userSkills.map(skill => {
                  const skillId = skill.id || skill.skill_id;
                  const sName = skill.name || skill.skill_name;
                  const isActive = selectedSkill?.id === skillId || selectedSkill?.skill_id === skillId;
                  return (
                    <button
                      key={skillId}
                      onClick={() => setSelectedSkill(skill)}
                      className={`skill-chip ${isActive ? 'active' : ''}`}
                    >
                      {sName}
                      <span className="text-xs opacity-60">({Math.round(skill.progress_percent || 0)}%)</span>
                    </button>
                  );
                })}
              </div>
              {selectedSkill && (
                <div className="mt-4 p-4 bg-white/5 rounded-lg">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <h3 className="font-medium text-white">{selectedSkill.name || selectedSkill.skill_name}</h3>
                      <p className="text-xs text-white/40">Progress: {Math.round(selectedSkill.progress_percent || 0)}%</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSubmitPractice(selectedSkill.id || selectedSkill.skill_id, 80)}
                        className="text-xs px-3 py-1.5 bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 rounded-lg flex items-center gap-1"
                      >
                        <Play size={12} /> Practice
                      </button>
                      <Link
                        to={`/skill/${selectedSkill.id || selectedSkill.skill_id}`}
                        className="text-brand-400 hover:underline text-sm flex items-center gap-1"
                      >
                        View Full <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                  <div className="skill-progress-bar">
                    <div className="skill-progress-fill" style={{ width: `${selectedSkill.progress_percent || 0}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* Goals */}
            <div className="card mb-6">
              <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                <h2 className="skills-section-title mb-0">
                  <Target size={20} className="text-brand-400" /> Goals
                </h2>
                <button onClick={() => setShowGoalModal(true)} className="btn-primary text-sm flex items-center gap-1">
                  <Plus size={16} /> New Goal
                </button>
              </div>
              {goals.length === 0 ? (
                <p className="text-white/40 text-sm">No goals yet. Create one to start your journey!</p>
              ) : (
                <div>
                  {goals.slice(0, 5).map(goal => {
                    const milestones = parseMilestones(goal);
                    const isExpanded = expandedGoalId === goal.id;
                    return (
                      <div key={goal.id} className="goal-card">
                        <div
                          className="flex items-center justify-between cursor-pointer flex-wrap gap-2"
                          onClick={() => setExpandedGoalId(isExpanded ? null : goal.id)}
                        >
                          <div className="flex-1 min-w-[150px]">
                            <p className="goal-title">{goal.title}</p>
                            <div className="goal-meta">
                              <span className={`px-1.5 py-0.5 rounded ${
                                goal.category === 'academic' ? 'bg-blue-500/20 text-blue-400' :
                                goal.category === 'skill' ? 'bg-green-500/20 text-green-400' :
                                goal.category === 'career' ? 'bg-purple-500/20 text-purple-400' :
                                'bg-orange-500/20 text-orange-400'
                              }`}>{goal.category}</span>
                              <span>Progress: {goal.progress || 0}%</span>
                              {goal.target_date && <span>• {new Date(goal.target_date).toLocaleDateString()}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs ${goal.completed ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                              {goal.completed ? '✅' : 'Active'}
                            </span>
                            {!goal.completed && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCompleteGoal(goal.id); }}
                                className="text-xs px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded"
                              >
                                Complete
                              </button>
                            )}
                            <ChevronRight size={16} className={`text-white/30 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </div>
                        </div>
                        <div className="w-full h-1 bg-white/10 rounded-full mt-2">
                          <div className="skill-progress-fill" style={{ width: `${goal.progress || 0}%` }} />
                        </div>
                        {isExpanded && milestones.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
                            {milestones.map((m, idx) => {
                              const mid = m.id || idx;
                              return (
                                <button
                                  key={mid}
                                  onClick={() => handleToggleMilestone(goal.id, mid)}
                                  disabled={togglingMilestone === mid}
                                  className="w-full flex items-center gap-2 p-1.5 rounded hover:bg-white/5 transition text-left"
                                >
                                  {m.completed ? <CheckCircle size={16} className="text-green-400 flex-shrink-0" /> : <Circle size={16} className="text-white/30 flex-shrink-0" />}
                                  <span className={`text-sm ${m.completed ? 'text-white/40 line-through' : 'text-white/80'}`}>
                                    {m.title || m.name || `Milestone ${idx + 1}`}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Achievements */}
            <div className="card mb-6">
              <h2 className="skills-section-title">
                <Award size={20} className="text-yellow-400" /> Achievements
                <span className="ml-auto text-xs font-normal text-white/40">
                  {achievements.filter(b => b.earned).length} / {achievements.length}
                </span>
              </h2>
              <div className="achievements-grid">
                {achievements.map(badge => (
                  <div key={badge.id} className={`badge-card ${badge.earned ? 'earned' : 'locked'}`}>
                    <div className="badge-icon">{badge.icon || '🏅'}</div>
                    <p className="badge-name">{badge.name}</p>
                    <p className="badge-desc">{badge.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Rankings */}
            <div className="card">
              <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                <h2 className="skills-section-title mb-0">
                  <BarChart3 size={20} className="text-purple-400" /> My Ranking
                </h2>
                <Link to="/leaderboard" className="text-sm text-brand-400 hover:underline">View Rankings →</Link>
              </div>
              <div className="rankings-grid">
                <div className="rank-card">
                  <div className="rank-label">Weekly</div>
                  <div className="rank-value">#{rankings?.weekly?.rank || '—'}</div>
                </div>
                <div className="rank-card">
                  <div className="rank-label">School</div>
                  <div className="rank-value">#{rankings?.school?.rank || '—'}</div>
                </div>
                <div className="rank-card">
                  <div className="rank-label">Challenge</div>
                  <div className="rank-value">#{rankings?.challenge?.rank || '—'}</div>
                </div>
                <div className="rank-card">
                  <div className="rank-label">Overall</div>
                  <div className="rank-value">#{rankings?.overall?.rank || '—'}</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Modals */}
        {showGoalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setShowGoalModal(false)}>
            <div className="w-full max-w-md card p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Create New Goal</h2>
                <button onClick={() => setShowGoalModal(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
              </div>
              <form onSubmit={handleCreateGoal} className="space-y-3">
                <div>
                  <label className="text-sm text-white/60">Title *</label>
                  <input type="text" className="input w-full" placeholder="e.g., Learn React" value={goalForm.title} onChange={(e) => setGoalForm({...goalForm, title: e.target.value})} required />
                </div>
                <div>
                  <label className="text-sm text-white/60">Description</label>
                  <textarea className="input w-full resize-none" rows="2" value={goalForm.description} onChange={(e) => setGoalForm({...goalForm, description: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm text-white/60">Category</label>
                  <select className="input w-full" value={goalForm.category} onChange={(e) => setGoalForm({...goalForm, category: e.target.value})}>
                    <option value="academic">Academic</option>
                    <option value="skill">Skill</option>
                    <option value="personal">Personal</option>
                    <option value="career">Career</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-white/60">Target Date (optional)</label>
                  <input type="date" className="input w-full" value={goalForm.target_date} onChange={(e) => setGoalForm({...goalForm, target_date: e.target.value})} />
                </div>
                <button type="submit" disabled={submittingGoal} className="btn-primary w-full">
                  {submittingGoal ? 'Creating...' : 'Create Goal'}
                </button>
              </form>
            </div>
          </div>
        )}

        {showSkillModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setShowSkillModal(false)}>
            <div className="w-full max-w-md card p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Add New Skill</h2>
                <button onClick={() => setShowSkillModal(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
              </div>
              <form onSubmit={handleCreateSkill} className="space-y-3">
                <div>
                  <label className="text-sm text-white/60">Skill Name *</label>
                  <input type="text" className="input w-full" placeholder="e.g., Python" value={skillName} onChange={(e) => setSkillName(e.target.value)} required />
                </div>
                <div>
                  <label className="text-sm text-white/60">Category (optional)</label>
                  <input type="text" className="input w-full" placeholder="e.g., Programming" value={skillCategory} onChange={(e) => setSkillCategory(e.target.value)} />
                </div>
                <button type="submit" disabled={submittingSkill} className="btn-primary w-full">
                  {submittingSkill ? 'Adding...' : 'Add Skill'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}