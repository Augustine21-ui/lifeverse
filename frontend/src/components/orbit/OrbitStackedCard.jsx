// frontend/src/components/orbit/OrbitStackedCard.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Rocket, Target, CheckCircle, ChevronRight, Sparkles, AlertCircle
} from 'lucide-react';

const TYPE_META = {
  skill: {
    icon: AlertCircle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    label: 'Skill',
  },
  goal: {
    icon: Target,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    label: 'Goal',
  },
  task: {
    icon: CheckCircle,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    label: 'Task',
  },
};

export default function OrbitStackedCard({
  suggestions = [],
  loading = false,
  onSelectSuggestion,
}) {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);

  const handleAction = (s) => {
    if (onSelectSuggestion) {
      onSelectSuggestion(s);
      return;
    }

    // Default routing
    if (s.action === 'orbit') {
      navigate(`/orbit?subject=${encodeURIComponent(s.meta.subject)}&topic=${encodeURIComponent(s.meta.topic)}`);
    } else if (s.action === 'goal') {
      navigate(`/goals?id=${s.meta.goalId}`);
    } else if (s.action === 'task') {
      navigate('/dashboard');
    }
  };

  return (
    <div className="card orbit-card orbit-stacked-card">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="flex items-center gap-2">
            <Rocket size={18} className="text-purple-400" />
            Orbit
          </h3>
          <p className="orbit-sub">
            {suggestions.length > 0
              ? `${suggestions.length} suggestion${suggestions.length > 1 ? 's' : ''} from your profile`
              : 'AI-powered interactive learning'}
          </p>
        </div>
        <Sparkles size={20} className="text-purple-400 animate-pulse" />
      </div>

      {/* ─── Scrollable suggestion list ─────────────────────── */}
      {loading ? (
        <div className="orbit-stack-loading">Loading suggestions…</div>
      ) : suggestions.length === 0 ? (
        <div className="orbit-stack-empty">
          <p>No suggestions yet. Complete a task or goal to unlock.</p>
          <Link to="/orbit" className="launch-orbit-btn mt-3">
            🚀 Launch Orbit
          </Link>
        </div>
      ) : (
        <>
          <div className="orbit-stack-scroll">
            {suggestions.map((s, i) => {
              const meta = TYPE_META[s.type] || TYPE_META.task;
              const Icon = meta.icon;
              const isActive = i === activeIndex;
              return (
                <button
                  key={s.id}
                  className={`orbit-stack-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setActiveIndex(i);
                    handleAction(s);
                  }}
                >
                  <div className={`orbit-stack-icon ${meta.bg}`}>
                    <Icon size={16} className={meta.color} />
                  </div>
                  <div className="orbit-stack-body">
                    <div className="orbit-stack-title">{s.title}</div>
                    <div className="orbit-stack-subtitle">{s.subtitle}</div>
                  </div>
                  <ChevronRight size={16} className="orbit-stack-arrow" />
                </button>
              );
            })}
          </div>

          <Link to="/orbit" className="launch-orbit-btn mt-3">
            🚀 Open Orbit Hub
          </Link>
        </>
      )}
    </div>
  );
}