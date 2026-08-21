// frontend/src/pages/InstitutionDashboard.jsx
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import {
  Users, BookOpen, FileText, Calendar, Loader2,
  Plus, Edit, Trash2, Upload, Download, Link as LinkIcon,
  Megaphone, Paperclip, UserPlus, X, Check
} from 'lucide-react';

export default function InstitutionDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [csvFile, setCsvFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const csvInputRef = useRef(null);

  // ---- Timetable state ----
  const [selectedGroup, setSelectedGroup] = useState('');
  const [timetableEntries, setTimetableEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  // ---- Resources state ----
  const [targetType, setTargetType] = useState('institution');
  const [targetId, setTargetId] = useState('');
  const [resourceList, setResourceList] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);

  // ---- Hierarchy state ----
  const [hierarchy, setHierarchy] = useState([]);
  const [loadingHierarchy, setLoadingHierarchy] = useState(false);

  // Fetch dashboard data
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getInstitutionDashboard();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load hierarchy
  const loadHierarchy = async () => {
    setLoadingHierarchy(true);
    try {
      const res = await api.getHierarchy();
      setHierarchy(res);
    } catch (err) {
      console.error('Error loading hierarchy:', err);
    } finally {
      setLoadingHierarchy(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Load hierarchy when switching to groups tab
  useEffect(() => {
    if (activeTab === 'groups') {
      loadHierarchy();
    }
  }, [activeTab]);

  // Load timetable when selectedGroup changes
  useEffect(() => {
    if (selectedGroup) {
      loadTimetable(selectedGroup);
    }
  }, [selectedGroup]);

  const loadTimetable = async (groupId) => {
    if (!groupId) return;
    setLoadingEntries(true);
    try {
      const res = await api.getTimetableByGroup(groupId);
      setTimetableEntries(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEntries(false);
    }
  };

  // Load resources when target changes
  useEffect(() => {
    if (targetId) {
      loadResources();
    }
  }, [targetType, targetId]);

  const loadResources = async () => {
    if (!targetId) return;
    setLoadingResources(true);
    try {
      const res = await api.getResources(targetType, targetId);
      setResourceList(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingResources(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-400" size={40} /></div>;
  if (!data) return <div className="p-6 text-center text-white/60">No data available</div>;

  const { stats, students, teachers, groups } = data;

  // ---------- Modal helpers ----------
  const openModal = (type, item = null) => {
    console.log('🔍 Opening modal with item:', item);
    setModalType(type);
    setEditingItem(item);
    setFormData(item ? { ...item } : {});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setEditingItem(null);
    setFormData({});
    setCsvFile(null);
  };

  // ---------- Submit handlers ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (modalType === 'group') {
        // Determine if we're editing or creating
        let groupId = editingItem?.id || formData?.id;
        if (editingItem && !groupId) {
          console.error('❌ Missing group ID for update:', { editingItem, formData });
          alert('Error: missing group ID. Please refresh and try again.');
          setSubmitting(false);
          return;
        }
        if (groupId) {
          // ✅ Update existing group
          const id = parseInt(groupId);
          if (isNaN(id)) {
            alert('Invalid group ID');
            setSubmitting(false);
            return;
          }
          console.log('🔄 Updating group with ID:', id, 'data:', formData);
          await api.updateGroup(id, formData);
        } else {
          // ✅ Create new group
          console.log('🆕 Creating new group:', formData);
          await api.createGroup(formData);
        }
      } else if (modalType === 'resource') {
        await api.createResource(formData);
      } else if (modalType === 'announcement') {
        await api.createAnnouncement(formData);
      } else if (modalType === 'assign') {
        await api.assignTeacher(formData);
      }
      await loadData();
      if (activeTab === 'groups') loadHierarchy();
      closeModal();
    } catch (err) {
      console.error(err);
      alert('Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      await api.uploadTimetableCSV(formData);
      alert('Timetable uploaded successfully');
      setCsvFile(null);
      if (csvInputRef.current) csvInputRef.current.value = '';
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (type, id) => {
    if (!id) {
      alert('Invalid ID');
      return;
    }
    if (!confirm(`Delete this ${type}?`)) return;
    try {
      if (type === 'group') await api.deleteGroup(id);
      await loadData();
      if (activeTab === 'groups') loadHierarchy();
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };

  // ---------- GroupTree component ----------
  const GroupTree = ({ node, onEdit, onDelete, onAddChild }) => {
    const [expanded, setExpanded] = useState(true);
    const icon = node.type === 'department' ? '🏛️' : node.type === 'course' ? '📘' : '📄';
    return (
      <div className="ml-4">
        <div className="flex items-center gap-2 py-1 hover:bg-white/5 rounded px-2">
          {node.children && node.children.length > 0 && (
            <button onClick={() => setExpanded(!expanded)} className="text-white/40">
              {expanded ? '▼' : '▶'}
            </button>
          )}
          <span>{icon}</span>
          <span className="font-medium">{node.name}</span>
          <span className="text-xs text-white/40 ml-2">{node.type}</span>
          <div className="ml-auto flex gap-1">
            <button onClick={() => onAddChild(node)} className="text-white/30 hover:text-brand-400" title="Add child">
              <Plus size={14} />
            </button>
            <button onClick={() => onEdit(node)} className="text-white/30 hover:text-brand-400" title="Edit">
              <Edit size={14} />
            </button>
            <button onClick={() => onDelete(node)} className="text-white/30 hover:text-red-400" title="Delete">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        {expanded && node.children && node.children.length > 0 && (
          <div>
            {node.children.map(child => (
              <GroupTree key={child.id} node={child} onEdit={onEdit} onDelete={onDelete} onAddChild={onAddChild} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // ---------- Render functions ----------
  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold">{stats.totalStudents}</div>
          <div className="text-sm text-white/40">Students</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold">{stats.totalTeachers}</div>
          <div className="text-sm text-white/40">Teachers</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold">{stats.totalGroups}</div>
          <div className="text-sm text-white/40">Groups</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold">{stats.totalResources}</div>
          <div className="text-sm text-white/40">Resources</div>
        </div>
      </div>
      <div className="card p-4">
        <h3 className="font-semibold mb-2">Recent Activity</h3>
        <p className="text-white/40 text-sm">No recent activity yet.</p>
      </div>
    </div>
  );

  const renderStudents = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Students</h2>
        <button className="btn-secondary text-sm" onClick={() => openModal('assign')}>
          <UserPlus size={16} className="inline mr-1" /> Assign Group
        </button>
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr className="text-white/40">
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Group</th>
              <th className="p-3 text-left">Level</th>
              <th className="p-3 text-left">Year</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id} className="border-t border-white/5 hover:bg-white/5">
                <td className="p-3">{s.full_name}</td>
                <td className="p-3">{s.group_name || '—'} ({s.group_type || '—'})</td>
                <td className="p-3 capitalize">{s.education_level || '—'}</td>
                <td className="p-3">{s.year_of_study || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTeachers = () => (
    <div>
      <h2 className="text-xl font-semibold mb-4">Teachers</h2>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr className="text-white/40">
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Assigned Groups</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map(t => (
              <tr key={t.id} className="border-t border-white/5 hover:bg-white/5">
                <td className="p-3">{t.full_name}</td>
                <td className="p-3">
                  {t.assigned_groups && t.assigned_groups.length > 0
                    ? t.assigned_groups.map(g => g.group_name).join(', ')
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderGroups = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Hierarchy</h2>
        <button className="btn-primary text-sm" onClick={() => openModal('group', { type: 'department' })}>
          <Plus size={16} className="inline mr-1" /> Add Department
        </button>
      </div>
      <div className="card p-4">
        {loadingHierarchy ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-brand-400" size={24} /></div>
        ) : hierarchy.length === 0 ? (
          <p className="text-white/40">No groups yet. Start by adding a department.</p>
        ) : (
          hierarchy.map(node => (
            <GroupTree
              key={node.id}
              node={node}
              onEdit={(item) => {
                console.log('✏️ Editing item from GroupTree:', item);
                openModal('group', item);
              }}
              onDelete={(item) => handleDelete('group', item.id)}
              onAddChild={(parent) => {
                let childType = '';
                if (parent.type === 'department') childType = 'course';
                else if (parent.type === 'course') childType = 'stream';
                else return;
                openModal('group', { parentGroupId: parent.id, type: childType });
              }}
            />
          ))
        )}
      </div>
    </div>
  );

  const renderTimetable = () => (
    <div>
      <h2 className="text-xl font-semibold mb-4">Timetable</h2>
      <div className="flex flex-wrap gap-4 mb-4">
        <select
          className="input flex-1 min-w-[200px]"
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
        >
          <option value="">Select a group</option>
          {groups.map(g => (
            <option key={g.id} value={g.id}>{g.name} ({g.type})</option>
          ))}
        </select>
        <label className="btn-secondary text-sm cursor-pointer">
          <Upload size={16} className="inline mr-1" /> Upload CSV
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              setCsvFile(e.target.files[0]);
              if (e.target.files[0]) handleCsvUpload();
            }}
          />
        </label>
      </div>
      {selectedGroup && (
        <div className="card overflow-x-auto p-0">
          {loadingEntries ? (
            <div className="p-4 text-center"><Loader2 className="animate-spin text-brand-400" size={24} /></div>
          ) : timetableEntries.length === 0 ? (
            <p className="p-4 text-white/40">No timetable entries for this group.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr className="text-white/40">
                  <th className="p-3 text-left">Day</th>
                  <th className="p-3 text-left">Start</th>
                  <th className="p-3 text-left">End</th>
                  <th className="p-3 text-left">Subject</th>
                  <th className="p-3 text-left">Teacher</th>
                  <th className="p-3 text-left">Room</th>
                </tr>
              </thead>
              <tbody>
                {timetableEntries.map(t => (
                  <tr key={t.id} className="border-t border-white/5">
                    <td className="p-3 capitalize">{t.day_of_week}</td>
                    <td className="p-3">{t.start_time?.slice(0,5)}</td>
                    <td className="p-3">{t.end_time?.slice(0,5)}</td>
                    <td className="p-3">{t.subject}</td>
                    <td className="p-3">{t.teacher_name || '—'}</td>
                    <td className="p-3">{t.room || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );

  const renderResources = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Resources</h2>
        <button className="btn-primary text-sm" onClick={() => openModal('resource')}>
          <Plus size={16} className="inline mr-1" /> Add Resource
        </button>
      </div>
      <div className="flex flex-wrap gap-4 mb-4">
        <select className="input w-40" value={targetType} onChange={(e) => setTargetType(e.target.value)}>
          <option value="institution">Institution</option>
          <option value="academic_group">Group</option>
        </select>
        {targetType === 'academic_group' ? (
          <select className="input flex-1" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
            <option value="">Select a group</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        ) : (
          <input type="number" className="input w-40" placeholder="Institution ID" value={targetId} onChange={(e) => setTargetId(e.target.value)} />
        )}
        <button className="btn-secondary text-sm" onClick={loadResources}>Refresh</button>
      </div>
      <div className="space-y-3">
        {resourceList.map(r => (
          <div key={r.id} className="card p-3 flex justify-between items-center">
            <div>
              <p className="font-medium">{r.title}</p>
              <p className="text-sm text-white/40">{r.description}</p>
              <div className="flex gap-2 text-xs text-white/30">
                <span>{r.resource_type}</span>
                <span>· {new Date(r.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            {r.file_url && (
              <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline">
                <LinkIcon size={16} />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderAnnouncements = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Announcements</h2>
        <button className="btn-primary text-sm" onClick={() => openModal('announcement')}>
          <Megaphone size={16} className="inline mr-1" /> New Announcement
        </button>
      </div>
      <div className="space-y-3">
        {data.announcements?.map(a => (
          <div key={a.id} className="card p-4 border-l-4 border-brand-500">
            <h3 className="font-semibold">{a.title}</h3>
            <p className="text-sm text-white/70 mt-1">{a.content}</p>
            <div className="flex gap-3 text-xs text-white/40 mt-2">
              <span>By {a.author_name}</span>
              <span>· {new Date(a.created_at).toLocaleDateString()}</span>
              <span>Target: {a.target_roles?.join(', ') || 'All'}</span>
            </div>
          </div>
        ))}
        {(!data.announcements || data.announcements.length === 0) && (
          <p className="text-white/40">No announcements yet.</p>
        )}
      </div>
    </div>
  );

  // ---------- Modals ----------
  const renderModal = () => {
    if (!showModal) return null;

    const renderGroupForm = () => (
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="text" className="input w-full" placeholder="Name" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
        <select className="input w-full" value={formData.type || ''} onChange={(e) => setFormData({...formData, type: e.target.value})} required>
          <option value="">Select Type</option>
          <option value="department">Department</option>
          <option value="course">Course</option>
          <option value="stream">Stream</option>
          <option value="class">Class</option>
        </select>
        <select className="input w-full" value={formData.educationLevel || ''} onChange={(e) => setFormData({...formData, educationLevel: e.target.value})}>
          <option value="">Education Level</option>
          <option value="higher">Higher</option>
          <option value="lower">Lower</option>
        </select>
        <select className="input w-full" value={formData.parentGroupId || ''} onChange={(e) => setFormData({...formData, parentGroupId: e.target.value})}>
          <option value="">Parent Group (optional)</option>
          {groups.filter(g => g.id !== editingItem?.id).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <button type="submit" disabled={submitting} className="btn-primary w-full">{submitting ? 'Saving...' : editingItem ? 'Update' : 'Create'}</button>
      </form>
    );

    const renderResourceForm = () => (
      <form onSubmit={handleSubmit} className="space-y-3">
        <select className="input w-full" value={formData.targetType || 'academic_group'} onChange={(e) => setFormData({...formData, targetType: e.target.value})} required>
          <option value="academic_group">Group</option>
          <option value="institution">Institution</option>
        </select>
        {formData.targetType === 'academic_group' ? (
          <select className="input w-full" value={formData.targetId || ''} onChange={(e) => setFormData({...formData, targetId: parseInt(e.target.value)})} required>
            <option value="">Select Group</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        ) : (
          <input type="number" className="input w-full" placeholder="Institution ID" value={formData.targetId || ''} onChange={(e) => setFormData({...formData, targetId: parseInt(e.target.value)})} required />
        )}
        <input type="text" className="input w-full" placeholder="Title" value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
        <textarea className="input w-full" rows="2" placeholder="Description" value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} />
        <input type="text" className="input w-full" placeholder="File URL" value={formData.fileUrl || ''} onChange={(e) => setFormData({...formData, fileUrl: e.target.value})} />
        <select className="input w-full" value={formData.resourceType || 'file'} onChange={(e) => setFormData({...formData, resourceType: e.target.value})}>
          <option value="file">File</option>
          <option value="video">Video</option>
          <option value="link">Link</option>
          <option value="document">Document</option>
        </select>
        <button type="submit" disabled={submitting} className="btn-primary w-full">{submitting ? 'Uploading...' : 'Upload Resource'}</button>
      </form>
    );

    const renderAnnouncementForm = () => (
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="text" className="input w-full" placeholder="Title" value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
        <textarea className="input w-full" rows="4" placeholder="Content" value={formData.content || ''} onChange={(e) => setFormData({...formData, content: e.target.value})} required />
        <div>
          <label className="text-sm text-white/40">Target Roles</label>
          <select className="input w-full" value={formData.targetRoles || 'student'} onChange={(e) => setFormData({...formData, targetRoles: [e.target.value]})}>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="parent">Parents</option>
            <option value="all">All</option>
          </select>
        </div>
        <button type="submit" disabled={submitting} className="btn-primary w-full">{submitting ? 'Publishing...' : 'Publish Announcement'}</button>
      </form>
    );

    const renderAssignForm = () => (
      <form onSubmit={handleSubmit} className="space-y-3">
        <select className="input w-full" value={formData.teacherId || ''} onChange={(e) => setFormData({...formData, teacherId: parseInt(e.target.value)})} required>
          <option value="">Select Teacher</option>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
        </select>
        <select className="input w-full" value={formData.academicGroupId || ''} onChange={(e) => setFormData({...formData, academicGroupId: parseInt(e.target.value)})} required>
          <option value="">Select Group</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <button type="submit" disabled={submitting} className="btn-primary w-full">{submitting ? 'Assigning...' : 'Assign Teacher'}</button>
      </form>
    );

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && closeModal()}>
        <div className="w-full max-w-md card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {modalType === 'group' && (editingItem ? 'Edit Group' : 'New Group')}
              {modalType === 'resource' && 'Upload Resource'}
              {modalType === 'announcement' && 'New Announcement'}
              {modalType === 'assign' && 'Assign Teacher to Group'}
            </h2>
            <button onClick={closeModal} className="text-white/40 hover:text-white"><X size={20} /></button>
          </div>
          {modalType === 'group' && renderGroupForm()}
          {modalType === 'resource' && renderResourceForm()}
          {modalType === 'announcement' && renderAnnouncementForm()}
          {modalType === 'assign' && renderAssignForm()}
        </div>
      </div>
    );
  };

  // ---------- Main render ----------
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">🏫 Institution Dashboard</h1>
      <p className="text-white/40 mb-6">Manage your institution's learning environment</p>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <Users className="text-brand-400" size={24} />
            <div><p className="text-white/40 text-sm">Students</p><p className="text-2xl font-bold">{stats.totalStudents}</p></div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <Users className="text-green-400" size={24} />
            <div><p className="text-white/40 text-sm">Teachers</p><p className="text-2xl font-bold">{stats.totalTeachers}</p></div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <BookOpen className="text-yellow-400" size={24} />
            <div><p className="text-white/40 text-sm">Groups</p><p className="text-2xl font-bold">{stats.totalGroups}</p></div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <FileText className="text-purple-400" size={24} />
            <div><p className="text-white/40 text-sm">Resources</p><p className="text-2xl font-bold">{stats.totalResources}</p></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 mb-6">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'students', label: 'Students' },
          { id: 'teachers', label: 'Teachers' },
          { id: 'groups', label: 'Groups' },
          { id: 'timetable', label: 'Timetable' },
          { id: 'resources', label: 'Resources' },
          { id: 'announcements', label: 'Announcements' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`px-4 py-2 capitalize transition ${activeTab === tab.id ? 'border-b-2 border-brand-500 text-white' : 'text-white/40 hover:text-white'}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'students' && renderStudents()}
      {activeTab === 'teachers' && renderTeachers()}
      {activeTab === 'groups' && renderGroups()}
      {activeTab === 'timetable' && renderTimetable()}
      {activeTab === 'resources' && renderResources()}
      {activeTab === 'announcements' && renderAnnouncements()}

      {/* Modal */}
      {renderModal()}
    </div>
  );
}