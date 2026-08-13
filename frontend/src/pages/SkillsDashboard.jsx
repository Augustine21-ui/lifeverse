// frontend/src/pages/SkillsDashboard.jsx
import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function SkillsDashboard() {
  const [data, setData] = useState({ subjects: [], topics: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMastery().then(res => {
      setData(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading skills...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">📊 Your Skills</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.subjects.map(sub => (
          <div key={sub.subject} className="card p-4">
            <h3 className="text-white font-bold">{sub.subject}</h3>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${sub.averageMastery}%` }} />
              </div>
              <span className="text-white/60 text-sm">{sub.averageMastery}%</span>
            </div>
            <p className="text-white/40 text-xs mt-1">{sub.topicCount} topics</p>
          </div>
        ))}
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-white mb-4">Topic Breakdown</h2>
        <div className="space-y-3">
          {data.topics.map(t => (
            <div key={`${t.subject}-${t.topic}`} className="card p-3 flex items-center justify-between">
              <div>
                <span className="text-white/80 font-medium">{t.topic}</span>
                <span className="text-white/40 text-sm ml-3">{t.subject}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${Math.round(t.mastery_score)}%` }} />
                </div>
                <span className="text-white/60 text-sm">{Math.round(t.mastery_score)}%</span>
                <span className="text-white/40 text-xs">({t.activities_attempted} attempts)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}