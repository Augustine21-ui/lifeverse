// frontend/src/pages/GoalsPage.jsx
import { useState, useEffect } from 'react';
import { Plus, Target, CheckCircle2, Circle, Trash2, Calendar, ChevronDown, ChevronUp, Zap, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import PageBackground from '../components/PageBackground';

const CATEGORIES = ['study', 'fitness', 'personal', 'creative', 'social'];
const CAT_COLORS = {
  study: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
  fitness: 'text-green-400 bg-green-500/10 border-green-500/20',
  personal: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  creative: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  social: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
};

function GoalCard({ goal, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const progress = Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));

  const handleToggleMilestone = async (milestoneId) => {
    try {
      await api.toggleMilestone(goal.id, milestoneId);
      onUpdate();
    } catch (err) { console.error(err); }
  };

  const milestones = goal.milestones || [];

  return (
    <div className={`card transition-all duration-200 ${goal.status === 'completed' ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`badge border capitalize text-xs ${CAT_COLORS[goal.category] || 'text-white/50 bg-white/5 border-white/10'}`}>
              {goal.category}
            </span>
            {goal.status === 'completed' && (
              <span className="badge bg-green-500/10 border border-green-500/20 text-green-400 text-xs">Completed</span>
            )}
          </div>
          <h3 className="font-display font-semibold text-base leading-snug">{goal.title}</h3>
          {goal.description && <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{goal.description}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <div className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg">
            <Zap size={10} />
            <span>{goal.xp_reward}</span>
          </div>
          <button onClick={() => onDelete(goal.id)} className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-white/40 mb-1.5">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="xp-bar-track">
          <div className={`h-full rounded-full transition-all duration-700 ${progress >= 100 ? 'bg-green-500' : 'bg-gradient-to-r from-brand-500 to-violet-500'}`}
            style={{ width: `${progress}%` }} />
        </div>
      </div>

      {goal.due_date && (
        <div className="flex items-center gap-1.5 text-xs text-white/30 mb-3">
          <Calendar size={12} />
          <span>Due {new Date(goal.due_date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      )}

      {/* Milestones */}
      {milestones.length > 0 && (
        <div>
          <button onClick={() => setExpanded(p => !p)}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors w-full text-left">
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            <span>{milestones.filter(m => m.is_completed).length}/{milestones.length} milestones</span>
          </button>
          {expanded && (
            <div className="mt-3 space-y-2">
              {milestones.map(m => (
                <button key={m.id} onClick={() => handleToggleMilestone(m.id)}
                  className="flex items-center gap-2.5 w-full text-left group">
                  {m.is_completed
                    ? <CheckCircle2 size={15} className="text-green-400 shrink-0" />
                    : <Circle size={15} className="text-white/20 group-hover:text-white/40 shrink-0 transition-colors" />}
                  <span className={`text-sm ${m.is_completed ? 'line-through text-white/30' : 'text-white/70'}`}>{m.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CreateGoalModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', category: 'study', dueDate: '', milestones: [''] });
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));
  const setMilestone = (i, val) => setForm(p => {
    const m = [...p.milestones]; m[i] = val; return { ...p, milestones: m };
  });
  const addMilestone = () => setForm(p => ({ ...p, milestones: [...p.milestones, ''] }));
  const removeMilestone = (i) => setForm(p => ({ ...p, milestones: p.milestones.filter((_, j) => j !== i) }));
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const milestones = form.milestones.filter(m => m.trim()).map((title, idx) => ({
        id: idx + 1,
        title,
        is_completed: false
      }));
      await api.createGoal({ ...form, milestones });
      onCreated();
      onClose();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="w-full max-w-lg card glass-strong max-h-[90vh] overflow-y-auto">
        <h2 className="font-display font-bold text-xl mb-5">Create a new goal</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Goal title *</label>
            <input className="input" placeholder="e.g. Master calculus by end of term" value={form.title} onChange={set('title')} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none h-20" placeholder="What does success look like?" value={form.description} onChange={set('description')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select className="input cursor-pointer" value={form.category} onChange={set('category')}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Due date</label>
              <input type="date" className="input" value={form.dueDate} onChange={set('dueDate')} />
            </div>
          </div>
          {/* Milestones */}
          <div>
            <label className="label">Milestones</label>
            <div className="space-y-2">
              {form.milestones.map((m, i) => (
                <div key={i} className="flex gap-2">
                  <input className="input flex-1 text-sm" placeholder={`Milestone ${i + 1}`} value={m} onChange={e => setMilestone(i, e.target.value)} />
                  {form.milestones.length > 1 && (
                    <button type="button" onClick={() => removeMilestone(i)} className="text-white/30 hover:text-red-400 px-2 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addMilestone} className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 mt-1">
                <Plus size={13} /> Add milestone
              </button>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('active');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    try {
      const data = await api.getGoals({ status: filter });
      setGoals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to load goals', 'error');
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
  }, [filter]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this goal?')) return;
    try {
      await api.deleteGoal(id);
      setGoals(prev => prev.filter(g => g.id !== id));
      showToast('Goal deleted successfully');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to delete goal', 'error');
    }
  };

  return (
    <PageBackground imageUrl="/goals-bg.jpg">
      <div className="p-6 max-w-4xl mx-auto animate-fade-up relative">
        {toast && (
          <div className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white`}>
            {toast.msg}
          </div>
        )}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold">Goals</h1>
            <p className="text-white/40 text-sm mt-1">Track your learning objectives</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={18} /> New goal
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {['active', 'completed'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-150 capitalize
                ${filter === s ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-36 rounded-2xl glass shimmer" />)}
          </div>
        ) : goals.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {goals.map(goal => (
              <GoalCard key={goal.id} goal={goal} onUpdate={load} onDelete={handleDelete} />
            ))}
          </div>
        ) : (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <Target size={40} className="text-white/10 mb-4" />
            <h3 className="font-display font-semibold mb-2">No {filter} goals</h3>
            <p className="text-sm text-white/30 mb-5">Set your first goal and start earning XP</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus size={16} /> Create a goal
            </button>
          </div>
        )}

        {/* Modal */}
        {showCreate && <CreateGoalModal onClose={() => setShowCreate(false)} onCreated={load} />}
      </div>
    </PageBackground>
  );
}