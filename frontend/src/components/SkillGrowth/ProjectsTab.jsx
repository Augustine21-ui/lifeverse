// frontend/src/components/SkillGrowth/ProjectsTab.jsx
import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Loader2, Plus, CheckCircle, Clock, Edit2 } from 'lucide-react';

export default function ProjectsTab({ skillId, userId }) {
  const [projects, setProjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [contribNote, setContribNote] = useState('');
  const [status, setStatus] = useState('assigned');

  useEffect(() => {
    loadData();
  }, [skillId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projectsRes, assignmentsRes] = await Promise.all([
        api.get(`/skills/${skillId}/projects`),
        api.get(`/skills/${skillId}/my-projects`)
      ]);
      setProjects(projectsRes);
      setAssignments(assignmentsRes);
    } catch (err) {
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (projectId) => {
    try {
      await api.post('/projects/assign', { projectId });
      await loadData(); // refresh
    } catch (err) {
      alert(err.error || 'Failed to assign project');
    }
  };

  const handleUpdate = async (assignmentId) => {
    try {
      await api.put(`/project-assignments/${assignmentId}`, {
        status,
        contribution_notes: contribNote
      });
      await loadData();
      setSelectedProject(null);
      setContribNote('');
    } catch (err) {
      alert(err.error || 'Failed to update contribution');
    }
  };

  if (loading) return <Loader2 className="animate-spin text-brand-400" size={24} />;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">Projects</h3>
      </div>
      {projects.length === 0 ? (
        <p className="text-white/40">No projects available for this skill yet.</p>
      ) : (
        <div className="space-y-3">
          {projects.map(proj => {
            const assignment = assignments.find(a => a.project_id === proj.id);
            return (
              <div key={proj.id} className="bg-white/5 p-3 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{proj.title}</h4>
                    <p className="text-sm text-white/60">{proj.description}</p>
                    <p className="text-xs text-white/40">Difficulty: {proj.difficulty_level}</p>
                  </div>
                  <div>
                    {assignment ? (
                      <span className={`px-2 py-1 rounded text-xs ${
                        assignment.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        assignment.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {assignment.status}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAssign(proj.id)}
                        className="btn-primary text-sm flex items-center gap-1"
                      >
                        <Plus size={14} /> Assign
                      </button>
                    )}
                  </div>
                </div>
                {assignment && assignment.status !== 'completed' && (
                  <div className="mt-2 flex gap-2 items-center">
                    <button
                      onClick={() => setSelectedProject(assignment.id)}
                      className="text-xs text-brand-400 hover:underline flex items-center gap-1"
                    >
                      <Edit2 size={12} /> Update Progress
                    </button>
                  </div>
                )}
                {selectedProject === assignment?.id && (
                  <div className="mt-2 bg-white/5 p-2 rounded">
                    <textarea
                      className="input w-full text-sm"
                      rows="2"
                      placeholder="Add contribution notes..."
                      value={contribNote}
                      onChange={(e) => setContribNote(e.target.value)}
                    />
                    <div className="flex gap-2 mt-2">
                      <select
                        className="input text-sm"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                      >
                        <option value="assigned">Assigned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                      <button
                        onClick={() => handleUpdate(assignment.id)}
                        className="btn-primary text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setSelectedProject(null)}
                        className="btn-secondary text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}