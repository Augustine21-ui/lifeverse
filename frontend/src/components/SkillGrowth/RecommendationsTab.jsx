// frontend/src/components/SkillGrowth/RecommendationsTab.jsx
import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Loader2, Users, Briefcase, Puzzle, ExternalLink } from 'lucide-react';

export default function RecommendationsTab({ skillId, userId }) {
  const [recommendations, setRecommendations] = useState({ communities: [], projects: [], challenges: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [skillId]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/skills/${skillId}/recommendations`);
      setRecommendations(res);
    } catch (err) {
      console.error('Error loading recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader2 className="animate-spin text-brand-400" size={24} />;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Recommended for You</h3>
      
      <div className="space-y-4">
        {/* Communities */}
        <div>
          <h4 className="text-sm font-medium text-white/60 flex items-center gap-2"><Users size={16} /> Communities</h4>
          {recommendations.communities.length === 0 ? (
            <p className="text-white/40 text-sm">No community recommendations yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {recommendations.communities.map(c => (
                <div key={c.id} className="bg-white/5 p-2 rounded-lg flex items-center gap-2 text-sm">
                  <span>{c.name}</span>
                  <a href={`/communities/${c.id}`} className="text-brand-400 hover:underline"><ExternalLink size={14} /></a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Projects */}
        <div>
          <h4 className="text-sm font-medium text-white/60 flex items-center gap-2"><Briefcase size={16} /> Projects</h4>
          {recommendations.projects.length === 0 ? (
            <p className="text-white/40 text-sm">No project recommendations yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {recommendations.projects.map(p => (
                <div key={p.id} className="bg-white/5 p-2 rounded-lg text-sm">
                  <span>{p.title}</span>
                  <span className="text-xs text-white/40 ml-2">Difficulty: {p.difficulty_level}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Challenges */}
        <div>
          <h4 className="text-sm font-medium text-white/60 flex items-center gap-2"><Puzzle size={16} /> Challenges</h4>
          {recommendations.challenges.length === 0 ? (
            <p className="text-white/40 text-sm">No challenge recommendations yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {recommendations.challenges.map(c => (
                <div key={c.id} className="bg-white/5 p-2 rounded-lg text-sm">
                  <span>{c.title}</span>
                  <span className="text-xs text-white/40 ml-2">XP: {c.xp_reward}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}