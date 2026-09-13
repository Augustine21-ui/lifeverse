// frontend/src/pages/SkillsPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Target, Award, BarChart3,
  Loader2, Plus, X, ChevronRight, Sparkles,
  CheckCircle, Circle, Play
} from 'lucide-react';
import { useMood } from '../context/MoodContext';
import { useToast } from '../context/ToastContext';

// Predefined badge definitions (fallback if backend doesn't return all)
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

  // ─── Goal Modal state ──────────────────────────────────────────
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalForm, setGoalForm] = useState({
    title: '',
    description: '',
    category: 'academic',
    target_date: '',
    metadata: {}
  });
  const [submittingGoal, setSubmittingGoal] = useState(false);

  // ─── Skill Modal state ──────────────────────────────────────────
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [skillName, setSkillName] = useState('');
  const [skillCategory, setSkillCategory] = useState('');
  const [submittingSkill, setSubmittingSkill] = useState(false);

  // ─── Milestone toggle state ────────────────────────────────────
  const [togglingMilestone, setTogglingMilestone] = useState(null);
  const [expandedGoalId, setExpandedGoalId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryRes, goalsRes, userSkillsRes, earnedBadgesRes, rankingsRes] = await Promise.all([
        api.getSkillsSummary(),
        api.getGoals(),
        api.getUserSkills(),
        api.getUserBadges(),
        api.getLeaderboard ? api.getLeaderboard() : Promise.resolve({ weekly: { rank: 0 } })
      ]);

      // ─── Deduplicate user skills by name ──────────────────────
      const rawSkills = Array.isArray(userSkillsRes) ? userSkillsRes : (userSkillsRes?.userSkills || userSkillsRes?.data || []);
      const uniqueSkills = rawSkills.reduce((acc, skill) => {
        const name = skill.name || skill.skill_name;
        if (!acc.some(s => (s.name || s.skill_name) === name)) {
          acc.push(skill);
        }
        return acc;
      }, []);

      const earnedIds = (earnedBadgesRes || []).map(b => b.id);
      const achievementsData = BADGE_DEFINITIONS.map(b => ({
        ...b,
        earned: earnedIds.includes(b.id)
      }));

      setSummary(summaryRes?.summary || summaryRes || { level: 1, xp: 0, goalsCount: 0, skillsCount: 0, achievementsCount: 0 });
      setGoals(Array.isArray(goalsRes) ? goalsRes : (goalsRes?.goals || goalsRes?.data || []));
      setUserSkills(uniqueSkills);
      setAchievements(achievementsData);
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

  // ─── Phase C: Toggle milestone → mood ─────────────────────────
  const handleToggleMilestone = async (goalId, milestoneId) => {
    try {
      setTogglingMilestone(milestoneId);
      const res = await api.toggleMilestone(goalId, milestoneId);

      if (res?.moodEvent) {
        triggerMood(res.moodEvent, {
          meta: {
            goalId,
            progress: res.progress,
            xpAwarded: res.xpAwarded,
          },
        });
      }

      if (res?.xpAwarded > 0) {
        showToast(`🎉 Goal complete! +${res.xpAwarded} XP`);
      } else if (res?.allComplete) {
        showToast('🎉 All milestones complete!');
      }

      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to toggle milestone', 'error');
    } finally {
      setTogglingMilestone(null);
    }
  };

  // ─── Phase C: Submit practice → mood ──────────────────────────
  const handleSubmitPractice = async (skillId, score = 80) => {
    try {
      const numericSkillId = parseInt(skillId, 10);
      if (isNaN(numericSkillId)) {
        showToast('Invalid skill ID', 'error');
        return;
      }

      const res = await api.submitPracticeResult({
        skillId: numericSkillId,
        score: Number(score) || 80,   // ensure numeric
        timeSpent: 60,
      });

      if (res?.moodEvent) {
        triggerMood(res.moodEvent, {
          meta: {
            skillId: numericSkillId,
            progressPercent: res.progressPercent,
          },
        });
      }

      showToast(`+5 XP • Progress: ${res?.progressPercent || 0}%`);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to submit practice', 'error');
    }
  };

  // ─── Phase C: Complete goal directly ──────────────────────────
  const handleCompleteGoal = async (goalId) => {
    try {
      const res = await api.completeGoal(goalId);
      if (res?.moodEvent) {
        triggerMood(res.moodEvent);
      }
      if (res?.xpAwarded > 0) {
        showToast(`🎉 Goal complete! +${res.xpAwarded} XP`);
      }
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to complete goal', 'error');
    }
  };

  const safeSlice = (arr, start, end) => Array.isArray(arr) ? arr.slice(start, end) : [];

  const parseMilestones = (goal) => {
    let m = goal.milestones;
    if (typeof m === 'string') {
      try { m = JSON.parse(m); } catch { m = []; }
    }
    return Array.isArray(m) ? m : [];
  };

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
          <div className="text-6xl mb-4">🚀</div>
          <h3 className="text-2xl font-semibold text-white">Start building your skills</h3>
          <p className="text-white/60 max-w-md mx-auto mt-2">
            Skills are the building blocks of your career. Add your first skill and start tracking your progress.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <button
              onClick={() => setShowSkillModal(true)}
              className="btn-primary px-6 py-2.5 flex items-center gap-2"
            >
              <Plus size={18} /> Create Your First Skill
            </button>
            <button
              onClick={() => setShowGoalModal(true)}
              className="btn-secondary px-6 py-2.5 flex items-center gap-2"
            >
              <Target size={18} /> Set a Goal
            </button>
          </div>
          <div className="mt-6 text-sm text-white/40">
            <span>Suggested skills for you: </span>
            {['Mathematics', 'Programming', 'Communication'].map((skill, i) => (
              <button
                key={i}
                onClick={() => {
                  setSkillName(skill);
                  setShowSkillModal(true);
                }}
                className="text-brand-400 hover:underline mx-1"
              >
                {skill}
              </button>
            ))}
          </div>
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
              {userSkills.map(skill => {
                const skillId = skill.id || skill.skill_id;
                const skillName = skill.name || skill.skill_name;
                return (
                  <button
                    key={skillId}
                    onClick={() => setSelectedSkill(skill)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                      selectedSkill?.id === skillId || selectedSkill?.skill_id === skillId
                        ? 'bg-brand-500 text-white'
                        : 'bg-white/10 hover:bg-white/20 text-white/80'
                    }`}
                  >
                    {skillName}
                    <span className="text-xs opacity-60">
                      ({Math.round(skill.progress_percent || 0)}%)
                    </span>
                  </button>
                );
              })}
            </div>
            {selectedSkill && (
              <div className="mt-3 p-3 bg-white/5 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{selectedSkill.name || selectedSkill.skill_name}</h3>
                    <p className="text-xs text-white/40">
                      Progress: {Math.round(selectedSkill.progress_percent || 0)}%
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {/* ✅ FIXED: only pass skillId + score, no fake activityId */}
                    <button
                      onClick={() => handleSubmitPractice(
                        selectedSkill.id || selectedSkill.skill_id,
                        80
                      )}
                      className="text-xs px-3 py-1.5 bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 rounded-lg flex items-center gap-1 transition"
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
                <div className="w-full h-1.5 bg-white/10 rounded-full mt-2">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-violet-500 rounded-full transition-all"
                    style={{ width: `${selectedSkill.progress_percent || 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Goals Section */}
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
                {safeSlice(goals, 0, 5).map(goal => {
                  const milestones = parseMilestones(goal);
                  const isExpanded = expandedGoalId === goal.id;

                  return (
                    <div key={goal.id} className="p-3 bg-white/5 rounded-lg">
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setExpandedGoalId(isExpanded ? null : goal.id)}
                      >
                        <div className="flex-1">
                          <p className="font-medium">{goal.title}</p>
                          <div className="flex items-center gap-2 text-xs text-white/40 mt-1">
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
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs ${goal.completed ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {goal.completed ? '✅ Done' : 'Active'}
                          </span>
                          {!goal.completed && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCompleteGoal(goal.id);
                              }}
                              className="text-xs px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded"
                            >
                              Complete
                            </button>
                          )}
                          <ChevronRight size={16} className={`text-white/30 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-1 bg-white/10 rounded-full mt-2">
                        <div
                          className="h-full bg-gradient-to-r from-brand-500 to-violet-500 rounded-full transition-all"
                          style={{ width: `${goal.progress || 0}%` }}
                        />
                      </div>

                      {/* Milestones (expandable) */}
                      {isExpanded && milestones.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
                          <p className="text-xs text-white/40 mb-2">Milestones</p>
                          {milestones.map((m, idx) => {
                            const mid = m.id || idx;
                            return (
                              <button
                                key={mid}
                                onClick={() => handleToggleMilestone(goal.id, mid)}
                                disabled={togglingMilestone === mid}
                                className="w-full flex items-center gap-2 p-1.5 rounded hover:bg-white/5 transition text-left"
                              >
                                {m.completed ? (
                                  <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                                ) : (
                                  <Circle size={16} className="text-white/30 flex-shrink-0" />
                                )}
                                <span className={`text-sm ${m.completed ? 'text-white/40 line-through' : 'text-white/80'}`}>
                                  {m.title || m.name || `Milestone ${idx + 1}`}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {isExpanded && milestones.length === 0 && (
                        <p className="text-xs text-white/30 mt-3 pt-3 border-t border-white/10">
                          No milestones yet
                        </p>
                      )}
                    </div>
                  );
                })}
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
              {safeSlice(userSkills, 0, 6).map(skill => {
                const skillId = skill.id || skill.skill_id;
                const skillName = skill.name || skill.skill_name;
                return (
                  <div key={skillId} className="p-3 bg-white/5 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{skillName}</span>
                      <span className="text-xs text-white/40">{skill.level || 'Beginner'}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full mt-1">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-violet-500 rounded-full"
                        style={{ width: `${skill.progress_percent || 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Achievements Section */}
          <div className="card p-4 mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Award size={20} className="text-yellow-400" />
                Achievements
              </h2>
              <span className="text-sm text-white/40">
                {achievements.filter(b => b.earned).length} / {achievements.length} earned
              </span>
            </div>
            {achievements.length === 0 ? (
              <p className="text-white/40">No achievements yet. Keep learning!</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {achievements.map(badge => (
                  <div
                    key={badge.id}
                    className={`p-3 rounded-lg text-center transition-all ${
                      badge.earned ? 'bg-brand-500/10 border border-brand-400/30' : 'bg-white/5 opacity-60'
                    }`}
                  >
                    <div className="text-3xl mb-1">{badge.icon || '🏅'}</div>
                    <p className="text-xs font-medium truncate">{badge.name}</p>
                    <p className="text-[10px] text-white/40 truncate">{badge.description}</p>
                    <div className="mt-1 text-[10px]">
                      {badge.earned ? (
                        <span className="text-green-400">✅ Earned</span>
                      ) : (
                        <span className="text-white/30">🔒 Locked</span>
                      )}
                    </div>
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

      {/* ─── Goal Creation Modal ────────────────────────────────── */}
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
              <button type="submit" disabled={submittingGoal} className="btn-primary w-full">
                {submittingGoal ? 'Creating...' : 'Create Goal'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── Skill Creation Modal ────────────────────────────────── */}
      {showSkillModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowSkillModal(false)}
        >
          <div className="w-full max-w-md card p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New Skill</h2>
              <button onClick={() => setShowSkillModal(false)} className="text-white/40 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateSkill} className="space-y-3">
              <div>
                <label className="text-sm text-white/60">Skill Name *</label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="e.g., Python, JavaScript, Data Analysis"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm text-white/60">Category (optional)</label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="e.g., Programming, Design, Business"
                  value={skillCategory}
                  onChange={(e) => setSkillCategory(e.target.value)}
                />
              </div>
              <button type="submit" disabled={submittingSkill} className="btn-primary w-full">
                {submittingSkill ? 'Adding...' : 'Add Skill'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}