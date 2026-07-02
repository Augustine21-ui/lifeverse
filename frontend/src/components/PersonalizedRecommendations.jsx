import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Zap, Target, BookOpen, Briefcase, Lightbulb, RefreshCw } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function PersonalizedRecommendations() {
  const { showToast } = useToast();
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadRecommendations = async () => {
    try {
      const data = await api.getRecommendations();
      setRecs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateNew = async () => {
    setGenerating(true);
    try {
      await api.generatePersonalization();
      await loadRecommendations();
      showToast('✨ New personalized recommendations generated!');
    } catch (err) {
      console.error(err);
      showToast('Failed to generate recommendations. Please try again.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  const icons = {
    goal: <Target size={18} className="text-brand-400" />,
    challenge: <Zap size={18} className="text-amber-400" />,
    study: <BookOpen size={18} className="text-blue-400" />,
    career: <Briefcase size={18} className="text-green-400" />,
    extra: <Lightbulb size={18} className="text-purple-400" />,
  };

  if (loading) {
    return (
      <div className="card p-4 animate-pulse">
        <div className="h-6 w-48 bg-white/10 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-white/5 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">🎯 Your Personal Mentor</h2>
        <button
          onClick={generateNew}
          disabled={generating}
          className="btn-primary text-sm flex items-center gap-1"
        >
          <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
          {generating ? 'Generating...' : 'Refresh'}
        </button>
      </div>
      {recs.length === 0 ? (
        <p className="text-white/40 text-center py-4 text-sm">
          No recommendations yet. Click "Refresh" to get AI‑powered suggestions.
        </p>
      ) : (
        <div className="space-y-3">
          {recs.map((rec) => (
            <div key={rec.id} className="flex items-start gap-3 p-2 border-b border-white/10 last:border-0">
              <div className="mt-1">{icons[rec.type] || <Lightbulb size={18} />}</div>
              <div className="flex-1">
                <p className="font-medium text-sm">{rec.title}</p>
                <p className="text-xs text-white/60">{rec.description}</p>
                {rec.data && (
                  <button
                    onClick={async () => {
                      try {
                        await api.actOnRecommendation(rec.id);
                        showToast('Great! Marked as done.');
                        loadRecommendations();
                      } catch (err) {
                        console.error(err);
                        showToast('Failed to update.', 'error');
                      }
                    }}
                    className="text-xs text-brand-400 hover:underline mt-1"
                  >
                    Mark as done
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}