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
  const openModal = (type, item = null, initialFormData = null) => {
    setModalType(type);
    setEditingItem(item);
    setFormData(initialFormData || (item ? { ...item } : {}));
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
        if (editingItem && editingItem.id) {
          await api.updateGroup(editingItem.id, formData);
        } else {
          await api.createGroup(formData);
        }
      } else if (modalType === 'resource') {
        // ✅ Auto‑set targetId for institution resources
        let resourceData = { ...formData };
        if (formData.targetType === 'institution') {
          resourceData.targetId = user?.institution_id;
        }
        if (!resourceData.targetId) {
          alert('Target ID is required. Please select a group or provide institution ID.');
          setSubmitting(false);
          return;
        }
        await api.createResource(resourceData);
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

  // ---------- Render functions (unchanged) ----------
  // (Keep all render functions identical to your current version)
  // For brevity, I'm not repeating them – they remain exactly as you have them.

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
          // For institution, we don't need user input – will be auto‑filled in handleSubmit
          <p className="text-sm text-white/40">Will be linked to your institution automatically.</p>
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