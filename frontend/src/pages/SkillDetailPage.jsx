// frontend/src/pages/SkillDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useMood } from '../context/MoodContext';
import { useToast } from '../context/ToastContext';
import {
  TrendingUp, Target, Award, BarChart3, Loader2,
  ArrowLeft, Play, Trophy, Rocket, Lightbulb,
  CheckCircle, Circle, ChevronRight, Sparkles
} from 'lucide-react';

export default function SkillDetailPage() {
  const { subjectId: skillId } = useParams();   // route uses :subjectId
  const navigate = useNavigate();
  const { triggerMood } = useMood();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [userSkill, setUserSkill] = useState(null);
  const [practiceResults, setPracticeResults] = useState([]);
  const [projects, setProjects] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (skillId) loadSkill();
  }, [skillId]);

  const loadSkill = async () => {
    setLoading(true);
    try {
      const [progressRes, practiceRes, projectsRes, challengesRes, recsRes] = await Promise.all([
        api.getSkillProgress(skillId).catch(() => null),
        api.getUserPracticeResults(skillId).catch(() => ({ results: [] })),
        api.getUserProjects(skillId).catch(() => ({ projects: [] })),
        api.getUserChallengeSubmissions(skillId).catch(() => ({ submissions: [] })),
        api.getRecommendations(skillId).catch(() => ({ recommendations: [] })),
      ]);

      setUserSkill(progressRes?.progress || null);
      setPracticeResults(practiceRes?.results || []);
      setProjects(projectsRes?.projects || []);
      setChallenges(challengesRes?.submissions || []);
      setRecommendations(recsRes?.recommendations || []);
    } catch (err) {
      console.error('Skill detail load error:', err);
      showToast('Failed to load skill details', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ─── Phase C: Practice submit → mood ───────────────────────
  const handleSubmitPractice = async (score = 80) => {
    try {
      setSubmitting(true);
      const numericSkillId = parseInt(skillId, 10);
      if (isNaN(numericSkillId)) {
        showToast('Invalid skill ID', 'error');
        return;
      }

      const res = await api.submitPracticeResult({
        skillId: numericSkillId,
        score: Number(score) || 80,
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
      await loadSkill();
    } catch (err) {
      showToast(err.message || 'Failed to submit practice', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-brand-400" size={40} />
      </div>
    );
  }

  const skillName = userSkill?.skill_name || userSkill?.name || `Skill #${skillId}`;
  const progress = userSkill?.progress_percent || 0;
  const level = userSkill?.level || 'Beginner';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* ─── Back + Title ──────────────────────────────────── */}
      <button
        onClick={() => navigate('/skills')}
        className="text-white/50 hover:text-white flex items-center gap-1 mb-4 text-sm"
      >
        <ArrowLeft size={16} /> Back to Skills
      </button>

      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold mb-1">{skillName}</h1>
          <p className="text-white/50 text-sm">
            Level: <span className="text-white/80">{level}</span> • Progress: {Math.round(progress)}%
          </p>
        </div>
        <button
          onClick={() => handleSubmitPractice(80)}
          disabled={submitting}
          className="btn-primary px-5 py-2.5 flex items-center gap-2"
        >
          <Play size={16} /> {submitting ? 'Submitting...' : 'Practice Now'}
        </button>
      </div>

      {/* ─── Progress bar ─────────────────────────────────── */}
      <div className="card p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-white/60">Skill Progress</span>
          <span className="text-sm font-semibold text-white">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-violet-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {progress >= 100 && (
          <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
            <CheckCircle size={12} /> Skill mastered!
          </p>
        )}
      </div>

      {/* ─── Stats Grid ───────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card p-4 text-center">
          <Rocket size={20} className="mx-auto mb-1 text-blue-400" />
          <div className="text-xl font-bold">{projects.length}</div>
          <div className="text-xs text-white/40">Projects</div>
        </div>
        <div className="card p-4 text-center">
          <Trophy size={20} className="mx-auto mb-1 text-yellow-400" />
          <div className="text-xl font-bold">{challenges.length}</div>
          <div className="text-xs text-white/40">Challenges</div>
        </div>
        <div className="card p-4 text-center">
          <BarChart3 size={20} className="mx-auto mb-1 text-green-400" />
          <div className="text-xl font-bold">{practiceResults.length}</div>
          <div className="text-xs text-white/40">Practice Sessions</div>
        </div>
      </div>

      {/* ─── Projects ─────────────────────────────────────── */}
      <div className="card p-4 mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
          <Rocket size={18} className="text-blue-400" /> Projects
        </h2>
        {projects.length === 0 ? (
          <p className="text-white/40 text-sm">No projects assigned yet.</p>
        ) : (
          <div className="space-y-2">
            {projects.map((p) => (
              <div key={p.id} className="p-3 bg-white/5 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-xs text-white/40">{p.status || 'In progress'}</p>
                </div>
                <ChevronRight size={16} className="text-white/30" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Challenges ───────────────────────────────────── */}
      <div className="card p-4 mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
          <Trophy size={18} className="text-yellow-400" /> Challenges
        </h2>
        {challenges.length === 0 ? (
          <p className="text-white/40 text-sm">No challenges attempted yet.</p>
        ) : (
          <div className="space-y-2">
            {challenges.map((c) => (
              <div key={c.id} className="p-3 bg-white/5 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-medium">{c.title || `Challenge #${c.challenge_id}`}</p>
                  <p className="text-xs text-white/40">
                    Status: {c.status || 'submitted'}
                  </p>
                </div>
                {c.status === 'approved' ? (
                  <CheckCircle size={18} className="text-green-400" />
                ) : (
                  <Circle size={18} className="text-white/30" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Recommendations ─────────────────────────────── */}
      <div className="card p-4 mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
          <Lightbulb size={18} className="text-amber-400" /> Recommendations
        </h2>
        {recommendations.length === 0 ? (
          <p className="text-white/40 text-sm">
            Complete more practice to unlock personalized recommendations.
          </p>
        ) : (
          <div className="space-y-2">
            {recommendations.map((r, i) => (
              <div key={i} className="p-3 bg-white/5 rounded-lg flex items-center gap-2">
                <Sparkles size={16} className="text-amber-400 flex-shrink-0" />
                <span className="text-sm text-white/80">{r.title || r.message || 'Try another practice session'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Quick Link back to Skills Hub ────────────────── */}
      <div className="text-center">
        <Link to="/skills" className="text-brand-400 hover:underline text-sm">
          ← Return to Skills Hub
        </Link>
      </div>
    </div>
  );
}