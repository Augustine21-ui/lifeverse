// frontend/src/pages/SkillsPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, Target, Award, BarChart3, 
  User, Zap, Calendar, ArrowRight, 
  CheckCircle, Clock, Plus, Edit, Trash2,
  Loader2, ChevronDown, ChevronUp, Star, X,
  Layers, Briefcase, Puzzle, Users, Lightbulb
} from 'lucide-react';
import ProjectsTab from '../components/SkillGrowth/ProjectsTab';
import ChallengesTab from '../components/SkillGrowth/ChallengesTab';
import PracticeTab from '../components/SkillGrowth/PracticeTab';
import RecommendationsTab from '../components/SkillGrowth/RecommendationsTab';

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
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'projects', 'challenges', 'practice', 'community'
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [skillProgress, setSkillProgress] = useState(null);

  // ... (existing state for modals, etc.)

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

      setSummary(summaryRes?.summary || summaryRes || { level: 1, xp: 0, goalsCount: 0, skillsCount: 0, achievementsCount: 0 });
      setGoals(Array.isArray(goalsRes) ? goalsRes : (goalsRes?.goals || goalsRes?.data || []));
      setUserSkills(Array.isArray(userSkillsRes) ? userSkillsRes : (userSkillsRes?.userSkills || userSkillsRes?.data || []));
      setAchievements(Array.isArray(achievementsRes) ? achievementsRes : (achievementsRes?.badges || achievementsRes?.data || []));
      setRankings(rankingsRes || { weekly: { rank: 0 }, school: { rank: 0 }, challenge: { rank: 0 }, overall: { rank: 0 } });
      
      // If there are user skills, select the first one
      if (userSkills.length > 0 && !selectedSkill) {
        setSelectedSkill(userSkills[0]);
        await loadSkillProgress(userSkills[0].skill_id);
      }
    } catch (err) {
      console.error('Error loading skills data:', err);
      setGoals([]);
      setUserSkills([]);
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSkillProgress = async (skillId) => {
    try {
      const progress = await api.getSkillProgress(skillId);
      setSkillProgress(progress);
    } catch (err) {
      console.error('Error loading skill progress:', err);
    }
  };

  const handleSkillSelect = (skill) => {
    setSelectedSkill(skill);
    loadSkillProgress(skill.skill_id);
  };

  const safeSlice = (arr, start, end) => {
    return Array.isArray(arr) ? arr.slice(start, end) : [];
  };

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

      {/* Summary Cards (unchanged) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {/* ... summary cards ... */}
      </div>

      {/* Skill Selector */}
      {userSkills.length > 0 && (
        <div className="mb-6">
          <label className="text-sm text-white/60 block mb-2">Select a skill to focus on:</label>
          <div className="flex flex-wrap gap-2">
            {userSkills.map(skill => (
              <button
                key={skill.skill_id}
                onClick={() => handleSkillSelect(skill)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  selectedSkill?.skill_id === skill.skill_id
                    ? 'bg-brand-500 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-white/80'
                }`}
              >
                {skill.name} {skill.progress_percent > 0 && `(${Math.round(skill.progress_percent)}%)`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      {selectedSkill && (
        <>
          <div className="flex border-b border-white/10 mb-6">
            {['overview', 'projects', 'challenges', 'practice', 'community'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab
                    ? 'border-brand-400 text-white'
                    : 'border-transparent text-white/40 hover:text-white/70'
                }`}
              >
                {tab === 'overview' && 'Overview'}
                {tab === 'projects' && 'Projects'}
                {tab === 'challenges' && 'Challenges'}
                {tab === 'practice' && 'Practice'}
                {tab === 'community' && 'Community'}
              </button>
            ))}
          </div>

          <div className="card p-4">
            {activeTab === 'overview' && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Progress Overview</h3>
                {skillProgress ? (
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-32 h-32 rounded-full border-4 border-brand-400 flex items-center justify-center">
                        <span className="text-3xl font-bold">{skillProgress.progress.overall}%</span>
                      </div>
                      <div className="flex-1">
                        <div className="grid grid-cols-2 gap-2">
                          <div><span className="text-white/40">Projects:</span> {skillProgress.progress.projectScore}%</div>
                          <div><span className="text-white/40">Challenges:</span> {skillProgress.progress.challengeScore}%</div>
                          <div><span className="text-white/40">Practice:</span> {skillProgress.progress.practiceScore}%</div>
                          <div><span className="text-white/40">Community:</span> {skillProgress.progress.communityScore}%</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-white/40">
                      <p>Projects completed: {skillProgress.progress.details.projects.completed} / {skillProgress.progress.details.projects.total}</p>
                      <p>Challenges completed: {skillProgress.progress.details.challenges.completed} / {skillProgress.progress.details.challenges.total}</p>
                      <p>Practice avg score: {skillProgress.progress.details.practice.avgScore}%</p>
                      <p>Community interactions: {skillProgress.progress.details.community.interactions}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-white/40">No progress data yet. Start by joining a project or challenge.</p>
                )}
              </div>
            )}
            {activeTab === 'projects' && <ProjectsTab skillId={selectedSkill.skill_id} userId={user.id} />}
            {activeTab === 'challenges' && <ChallengesTab skillId={selectedSkill.skill_id} userId={user.id} />}
            {activeTab === 'practice' && <PracticeTab skillId={selectedSkill.skill_id} userId={user.id} />}
            {activeTab === 'community' && <RecommendationsTab skillId={selectedSkill.skill_id} userId={user.id} />}
          </div>
        </>
      )}

      {/* Existing sections (Goals, Skills, Achievements, Rankings) - keep them below */}
    </div>
  );
}