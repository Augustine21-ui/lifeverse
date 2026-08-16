// frontend/src/components/orbit/OrbitProgressCard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Brain, TrendingUp, Target, Rocket } from 'lucide-react';
import { orbitApi } from '../../services/orbitApi';

const OrbitProgressCard = () => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const data = await orbitApi.getProgress();
        setProgress(data);
      } catch (err) {
        console.error('Failed to fetch orbit progress:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
        <div className="space-y-2">
          <div className="h-3 bg-white/10 rounded w-2/3" />
          <div className="h-3 bg-white/10 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!progress || !progress.mastery || progress.mastery.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Brain size={18} className="text-purple-400" /> Orbit Progress
        </h3>
        <p className="text-sm text-white/40 mt-2">Start learning in Orbit to track your progress.</p>
        <Link to="/orbit" className="text-sm text-brand-400 hover:underline mt-2 inline-block">
          Launch Orbit 🚀
        </Link>
      </div>
    );
  }

  const topMastery = progress.mastery.slice(0, 3);
  const weaknesses = progress.weaknesses?.slice(0, 3) || [];

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Brain size={18} className="text-purple-400" /> Orbit Mastery
        </h3>
        <Link to="/orbit" className="text-xs text-brand-400 hover:underline flex items-center gap-1">
          <Rocket size={12} /> Launch
        </Link>
      </div>
      <div className="mt-3 space-y-2">
        {topMastery.map((m) => (
          <div key={`${m.subject}-${m.topic}`} className="flex items-center justify-between text-sm">
            <span className="text-white/70 truncate">{m.topic}</span>
            <span className="text-white/40">{m.mastery_level}%</span>
          </div>
        ))}
      </div>
      {weaknesses.length > 0 && (
        <div className="mt-3 pt-2 border-t border-white/10">
          <p className="text-xs text-white/40 flex items-center gap-1">
            <Target size={12} /> Weak areas: {weaknesses.map(w => w.concept).join(', ')}
          </p>
        </div>
      )}
      <Link to="/orbit" className="text-xs text-brand-400 hover:underline mt-2 inline-block">
        View full progress →
      </Link>
    </div>
  );
};

export default OrbitProgressCard;