// frontend/src/pages/OpportunitiesPage.jsx
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Loader2, Briefcase, Calendar, Users, ExternalLink } from 'lucide-react';
import PageBackground from '../components/PageBackground';

const typeIcons = {
  internship: Briefcase,
  event: Calendar,
  competition: Users,
};

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState({});

  const loadData = async () => {
    try {
      const [opps, apps] = await Promise.all([
        api.getOpportunities(),
        api.getMyApplications(),
      ]);
      setOpportunities(opps);
      setApplications(apps);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApply = async (id) => {
    setApplying(prev => ({ ...prev, [id]: true }));
    try {
      await api.applyOpportunity(id);
      alert('Application submitted! +XP awarded');
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setApplying(prev => ({ ...prev, [id]: false }));
    }
  };

  const hasApplied = (oppId) => applications.some(app => app.id === oppId);

  if (loading) {
    return (
      <PageBackground imageUrl="/opportunities-bg.jpg">
        <div className="p-6 flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-brand-400" size={40} />
        </div>
      </PageBackground>
    );
  }

  return (
    <PageBackground imageUrl="/opportunities-bg.jpg">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Opportunities Hub</h1>
        {opportunities.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-white/40">No opportunities available at the moment.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {opportunities.map(opp => {
              const Icon = typeIcons[opp.type] || Briefcase;
              const applied = hasApplied(opp.id);
              return (
                <div key={opp.id} className="card p-5">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <Icon size={24} className="text-brand-400" />
                      <div>
                        <h2 className="text-xl font-semibold">{opp.title}</h2>
                        <p className="text-white/60 mt-1">{opp.description}</p>
                        <div className="flex gap-3 mt-2 text-sm">
                          <span className="capitalize badge bg-white/10">{opp.type}</span>
                          <span>{opp.organization}</span>
                          <span>Deadline: {new Date(opp.deadline).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-amber-400 text-sm">+{opp.xp_reward} XP</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <a href={opp.link} target="_blank" rel="noopener noreferrer" className="btn-secondary inline-flex items-center gap-2">
                      View Details <ExternalLink size={14} />
                    </a>
                    {!applied ? (
                      <button onClick={() => handleApply(opp.id)} disabled={applying[opp.id]} className="btn-primary">
                        {applying[opp.id] ? <Loader2 size={16} className="animate-spin" /> : 'Apply'}
                      </button>
                    ) : (
                      <span className="text-green-400">✔ Applied</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageBackground>
  );
}