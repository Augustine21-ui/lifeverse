// frontend/src/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import {
  Users, School, Calendar, Activity, BarChart3,
  Settings, UserPlus, Search, Filter, Download, Edit, Trash2,
  Bell, Clock, CheckCircle, XCircle, AlertTriangle, Zap,
  Loader2, Plus, Save, X, RefreshCw
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer
} from 'recharts';
import PageBackground from '../components/PageBackground';

const COLORS = ['#3b82f6', '#7c3aed', '#10b981', '#f59e0b', '#ef4444'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState({ users: [], total: 0, page: 1, totalPages: 1 });
  const [subscriptions, setSubscriptions] = useState({ subscriptions: [], total: 0, page: 1, totalPages: 1 });
  const [performance, setPerformance] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Subscription modal states
  const [showSubModal, setShowSubModal] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [subForm, setSubForm] = useState({
    institution_name: '',
    plan: 'basic',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '',
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // Load data based on active tab
  useEffect(() => {
    loadData();
  }, [activeTab, users.page, subscriptions.page, search, roleFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const [statsRes, perfRes] = await Promise.all([
          api.adminGetStats(),
          api.adminGetPerformance(),
        ]);
        setStats(statsRes);
        setPerformance(perfRes);
      } else if (activeTab === 'users') {
        const data = await api.adminGetUsers({ search, role: roleFilter, page: users.page });
        setUsers(data);
      } else if (activeTab === 'subscriptions') {
        const data = await api.adminGetSubscriptions({ search, page: subscriptions.page });
        setSubscriptions(data);
      } else if (activeTab === 'announcements') {
        const data = await api.adminGetAnnouncements();
        setAnnouncements(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Export CSV ----------
  const exportUsersCSV = async () => {
    try {
      const res = await api.adminGetUsers({ limit: 9999 });
      const usersData = res.users;
      if (!usersData.length) return alert('No users to export');

      const headers = ['ID', 'Name', 'Username', 'Email', 'Role', 'Institution', 'XP', 'Level', 'Status'];
      const rows = usersData.map(u => [
        u.id,
        u.full_name,
        u.username,
        u.email,
        u.role,
        u.institution || '',
        u.xp,
        u.level,
        u.is_active ? 'Active' : 'Inactive'
      ]);
      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to export CSV');
    }
  };

  // ---------- Delete User ----------
  const handleDeleteUser = async (userId) => {
    if (!confirm('Delete this user? This action cannot be undone.')) return;
    try {
      await api.adminDeleteUser(userId);
      alert('User deleted successfully');
      // Refresh users list
      const data = await api.adminGetUsers({ search, role: roleFilter, page: users.page });
      setUsers(data);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to delete user');
    }
  };

  // ---------- Subscription CRUD ----------
  const openAddModal = () => {
    setEditingSub(null);
    setSubForm({
      institution_name: '',
      plan: 'basic',
      start_date: new Date().toISOString().slice(0, 10),
      end_date: '',
      is_active: true,
    });
    setShowSubModal(true);
  };

  const openEditModal = (sub) => {
    setEditingSub(sub);
    setSubForm({
      institution_name: sub.institution_name,
      plan: sub.plan,
      start_date: sub.start_date ? new Date(sub.start_date).toISOString().slice(0, 10) : '',
      end_date: sub.end_date ? new Date(sub.end_date).toISOString().slice(0, 10) : '',
      is_active: sub.is_active,
    });
    setShowSubModal(true);
  };

  const handleSubChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSubForm({ ...subForm, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingSub) {
        await api.adminUpdateSubscription(editingSub.id, subForm);
      } else {
        await api.adminCreateSubscription(subForm);
      }
      setShowSubModal(false);
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to save subscription');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSubActive = async (id, currentStatus) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this subscription?`)) return;
    try {
      await api.adminUpdateSubscription(id, { is_active: !currentStatus });
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to update subscription');
    }
  };

  // ---------- Render functions ----------
  const renderOverview = () => {
    if (!stats || !performance) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-brand-400" size={40} /></div>;
    const roleData = stats.usersByRole.map(r => ({ name: r.role, value: parseInt(r.count) }));
    const userGrowth = [
      { name: 'Week 1', users: 120 },
      { name: 'Week 2', users: 150 },
      { name: 'Week 3', users: 180 },
      { name: 'Week 4', users: 220 },
    ];

    return (
      <div>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-brand-500/20"><Users className="text-brand-400" size={24} /></div>
            <div><p className="text-white/40 text-sm">Total Users</p><p className="text-2xl font-bold">{stats.totalUsers}</p></div>
          </div>
          <div className="card p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-500/20"><Activity className="text-green-400" size={24} /></div>
            <div><p className="text-white/40 text-sm">Active Today</p><p className="text-2xl font-bold">{performance.activeLast7Days}</p></div>
          </div>
          <div className="card p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-amber-500/20"><School className="text-amber-400" size={24} /></div>
            <div><p className="text-white/40 text-sm">Schools</p><p className="text-2xl font-bold">{stats.totalSchools}</p></div>
          </div>
          <div className="card p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-purple-500/20"><Zap className="text-purple-400" size={24} /></div>
            <div><p className="text-white/40 text-sm">Subscriptions Active</p><p className="text-2xl font-bold">{stats.activeSubscriptions}</p></div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card p-4">
            <h3 className="font-semibold mb-2">User Growth</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#aaa" />
                <YAxis stroke="#aaa" />
                <Tooltip contentStyle={{ background: '#1a1a1a', border: 'none' }} />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card p-4">
            <h3 className="font-semibold mb-2">User Roles</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={roleData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={5} dataKey="value">
                  {roleData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1a1a', border: 'none' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Learners */}
        <div className="card p-4">
          <h3 className="font-semibold mb-2">Top Learners</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-white/40"><th className="text-left p-2">Name</th><th className="text-left p-2">Username</th><th className="text-right p-2">XP</th></tr></thead>
              <tbody>
                {performance.topLearners.map((u, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="p-2">{u.full_name}</td>
                    <td className="p-2">{u.username}</td>
                    <td className="p-2 text-right">{u.xp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderUsers = () => {
    return (
      <div>
        <div className="flex flex-wrap gap-4 mb-4">
          <input
            type="text"
            className="input flex-1 min-w-[200px]"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="input w-40" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="parent">Parent</option>
            <option value="admin">Admin</option>
          </select>
          <button className="btn-primary" onClick={exportUsersCSV}>
            <Download size={16} className="mr-1" /> Export CSV
          </button>
        </div>
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-white/5">
              <tr className="text-white/40">
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Username</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Role</th>
                <th className="p-3 text-left">Institution</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.users.map(u => (
                <tr key={u.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="p-3">{u.full_name}</td>
                  <td className="p-3">{u.username}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3"><span className="capitalize badge bg-white/10">{u.role}</span></td>
                  <td className="p-3">{u.institution || '-'}</td>
                  <td className="p-3">{u.is_active ? <CheckCircle size={16} className="text-green-400" /> : <XCircle size={16} className="text-red-400" />}</td>
                  <td className="p-3 flex gap-2">
                    <button className="text-white/40 hover:text-brand-400"><Edit size={16} /></button>
                    <button onClick={() => handleDeleteUser(u.id)} className="text-white/40 hover:text-red-400"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-white/40">Showing {users.users.length} of {users.total}</span>
          <div className="flex gap-2">
            <button disabled={users.page <= 1} onClick={() => setUsers({...users, page: users.page-1})} className="btn-secondary">Previous</button>
            <span className="px-3 py-1 bg-white/5 rounded">{users.page} / {users.totalPages}</span>
            <button disabled={users.page >= users.totalPages} onClick={() => setUsers({...users, page: users.page+1})} className="btn-secondary">Next</button>
          </div>
        </div>
      </div>
    );
  };

  const renderSubscriptions = () => {
    const subs = subscriptions.subscriptions;
    const isExpiringSoon = (endDate) => {
      if (!endDate) return false;
      const diff = new Date(endDate) - new Date();
      return diff < 30 * 24 * 60 * 60 * 1000 && diff > 0;
    };

    return (
      <div>
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            className="input flex-1"
            placeholder="Search schools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button onClick={openAddModal} className="btn-primary flex items-center gap-1">
            <Plus size={16} /> Add Subscription
          </button>
        </div>
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-white/5">
              <tr className="text-white/40">
                <th className="p-3 text-left">School</th>
                <th className="p-3 text-left">Plan</th>
                <th className="p-3 text-left">Start</th>
                <th className="p-3 text-left">End</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subs.map(s => {
                const active = s.is_active && (s.end_date === null || new Date(s.end_date) > new Date());
                const expiring = isExpiringSoon(s.end_date);
                return (
                  <tr key={s.id} className="border-t border-white/5 hover:bg-white/5">
                    <td className="p-3">{s.institution_name}</td>
                    <td className="p-3"><span className="capitalize badge bg-brand-500/20 text-brand-400">{s.plan}</span></td>
                    <td className="p-3">{s.start_date ? new Date(s.start_date).toLocaleDateString() : '-'}</td>
                    <td className="p-3">
                      {s.end_date ? new Date(s.end_date).toLocaleDateString() : '∞'}
                      {expiring && <span className="ml-2 text-xs text-amber-400">(expires soon)</span>}
                    </td>
                    <td className="p-3">
                      {active ? (
                        <span className="flex items-center gap-1 text-green-400"><CheckCircle size={14} /> Active</span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-400"><XCircle size={14} /> Inactive</span>
                      )}
                    </td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => openEditModal(s)} className="text-white/40 hover:text-brand-400"><Edit size={16} /></button>
                      <button onClick={() => toggleSubActive(s.id, s.is_active)} className="text-white/40 hover:text-amber-400">
                        {s.is_active ? <XCircle size={16} /> : <RefreshCw size={16} />}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {subs.length === 0 && (
                <tr><td colSpan="6" className="p-6 text-center text-white/40">No subscriptions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-white/40">Showing {subs.length} of {subscriptions.total}</span>
          <div className="flex gap-2">
            <button disabled={subscriptions.page <= 1} onClick={() => setSubscriptions({...subscriptions, page: subscriptions.page-1})} className="btn-secondary">Previous</button>
            <span className="px-3 py-1 bg-white/5 rounded">{subscriptions.page} / {subscriptions.totalPages}</span>
            <button disabled={subscriptions.page >= subscriptions.totalPages} onClick={() => setSubscriptions({...subscriptions, page: subscriptions.page+1})} className="btn-secondary">Next</button>
          </div>
        </div>
      </div>
    );
  };

  const renderAnnouncements = () => {
    return (
      <div>
        <button className="btn-primary mb-4" onClick={() => { /* Open modal for new announcement */ }}>New Announcement</button>
        <div className="space-y-4">
          {announcements.map(a => (
            <div key={a.id} className="card p-4">
              <h3 className="font-bold">{a.title}</h3>
              <p className="text-white/60 text-sm mt-1">{a.content}</p>
              <div className="flex gap-2 mt-2 text-xs text-white/40">
                <span>By {a.author_name}</span>
                <span>{new Date(a.created_at).toLocaleString()}</span>
                <span>Target: {a.target_roles ? a.target_roles.join(', ') : 'All'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Subscription Modal
  const SubscriptionModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setShowSubModal(false)}>
      <div className="w-full max-w-md card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{editingSub ? 'Edit Subscription' : 'Add Subscription'}</h2>
          <button onClick={() => setShowSubModal(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubSubmit} className="space-y-4">
          <div>
            <label className="label">Institution Name *</label>
            <input
              type="text"
              name="institution_name"
              className="input"
              placeholder="e.g., Sunshine Academy"
              value={subForm.institution_name}
              onChange={handleSubChange}
              required
              disabled={!!editingSub}
            />
          </div>
          <div>
            <label className="label">Plan</label>
            <select name="plan" className="input" value={subForm.plan} onChange={handleSubChange}>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Date</label>
              <input type="date" name="start_date" className="input" value={subForm.start_date} onChange={handleSubChange} required />
            </div>
            <div>
              <label className="label">End Date (optional)</label>
              <input type="date" name="end_date" className="input" value={subForm.end_date} onChange={handleSubChange} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="is_active" checked={subForm.is_active} onChange={handleSubChange} />
            <label className="text-sm text-white/70">Active</label>
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : (editingSub ? 'Update' : 'Create')}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <PageBackground imageUrl="/admin-bg.jpg">
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-white/40 mb-6">Manage Lifeverse platform</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-2 flex-wrap">
          {['overview', 'users', 'subscriptions', 'announcements'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg capitalize transition ${activeTab===tab ? 'bg-brand-500 text-white' : 'hover:bg-white/10 text-white/60'}`}>
              {tab}
            </button>
          ))}
        </div>

        {loading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-brand-400" size={40} /></div> : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'subscriptions' && renderSubscriptions()}
            {activeTab === 'announcements' && renderAnnouncements()}
          </>
        )}
      </div>

      {/* Subscription Modal */}
      {showSubModal && <SubscriptionModal />}
    </PageBackground>
  );
}