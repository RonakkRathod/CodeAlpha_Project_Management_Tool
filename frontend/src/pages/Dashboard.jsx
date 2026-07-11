import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const PROJECT_COLORS = ['bg-blue', 'bg-green', 'bg-purple', 'bg-orange', 'bg-teal', 'bg-red', 'bg-pink', 'bg-indigo'];

function getProjectColor(index) {
  return PROJECT_COLORS[index % PROJECT_COLORS.length];
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);

    try {
      const res = await api.post('/projects', { title, description });
      setProjects([res.data, ...projects]);
      setShowCreate(false);
      setTitle('');
      setDescription('');
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (e, projectId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this project and all its tasks? This cannot be undone.')) return;

    try {
      await api.delete(`/projects/${projectId}`);
      setProjects(projects.filter((p) => p._id !== projectId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete project');
    }
  };

  return (
    <div className="app-main">
      <Navbar />
      <div className="app-content">
        <div className="dashboard-header">
          <h1>My Projects</h1>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + New Project
          </button>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <h3>No projects yet</h3>
            <p>Create your first project to get started</p>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              + Create Project
            </button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project, index) => (
              <div
                key={project._id}
                className="project-card"
                onClick={() => navigate(`/projects/${project._id}`)}
              >
                <button
                  className="project-card-delete"
                  onClick={(e) => handleDelete(e, project._id)}
                  title="Delete project"
                >
                  ✕
                </button>

                <div className="project-card-header">
                  <div className={`project-card-icon ${getProjectColor(index)}`}>
                    {project.title.slice(0, 2)}
                  </div>
                </div>

                <h3>{project.title}</h3>
                <p>{project.description || 'No description'}</p>

                <div className="project-card-footer">
                  <div className="project-card-stats">
                    <span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 11l3 3L22 4" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                      </svg>
                      {project.doneCount || 0}/{project.taskCount || 0} tasks
                    </span>
                    <span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      {project.members?.length || 0}
                    </span>
                  </div>

                  <div className="project-card-members">
                    {project.members?.slice(0, 3).map((member) => (
                      <div key={member._id} className="navbar-avatar" title={member.name}>
                        {getInitials(member.name)}
                      </div>
                    ))}
                    {project.members?.length > 3 && (
                      <div className="navbar-avatar" style={{ background: '#94a3b8' }}>
                        +{project.members.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Project Modal */}
        {showCreate && (
          <div className="modal-overlay" onClick={() => setShowCreate(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>New Project</h2>
                <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="modal-body">
                  {createError && <div className="auth-error">{createError}</div>}
                  <div className="form-group">
                    <label className="form-label" htmlFor="project-title">Project Name</label>
                    <input
                      id="project-title"
                      className="form-input"
                      type="text"
                      placeholder="e.g. Website Redesign"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="project-desc">Description</label>
                    <textarea
                      id="project-desc"
                      className="form-input"
                      placeholder="What's this project about?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows="3"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={creating}>
                    {creating ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
