import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import TaskModal from '../components/TaskModal';
import MembersList from '../components/MembersList';

const COLUMNS = [
  { key: 'todo', label: 'To Do', className: 'todo' },
  { key: 'in-progress', label: 'In Progress', className: 'in-progress' },
  { key: 'review', label: 'Review', className: 'review' },
  { key: 'done', label: 'Done', className: 'done' }
];

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isOverdue(date) {
  if (!date) return false;
  return new Date(date) < new Date() && new Date(date).toDateString() !== new Date().toDateString();
}

export default function ProjectBoard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateTask, setShowCreateTask] = useState(null); // column key
  const [showMembers, setShowMembers] = useState(false);

  // Create task form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newAssignee, setNewAssignee] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      const [projectRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks/project/${id}`)
      ]);
      setProject(projectRes.data);
      setTasks(tasksRes.data);
    } catch (err) {
      console.error('Failed to fetch project:', err);
      if (err.response?.status === 404 || err.response?.status === 403) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const getColumnTasks = (status) => {
    return tasks.filter((t) => t.status === status);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setCreateError('');

    try {
      const res = await api.post('/tasks', {
        title: newTitle,
        description: newDesc,
        project: id,
        status: showCreateTask,
        priority: newPriority,
        assignee: newAssignee || null,
        dueDate: newDueDate || null
      });
      setTasks([res.data, ...tasks]);
      setShowCreateTask(null);
      setNewTitle('');
      setNewDesc('');
      setNewPriority('medium');
      setNewAssignee('');
      setNewDueDate('');
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create task');
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const res = await api.put(`/tasks/${taskId}`, updates);
      setTasks(tasks.map((t) => (t._id === taskId ? res.data : t)));
      if (selectedTask && selectedTask._id === taskId) {
        setSelectedTask(res.data);
      }
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task and all its comments?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter((t) => t._id !== taskId));
      setSelectedTask(null);
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleProjectUpdate = (updatedProject) => {
    setProject(updatedProject);
  };

  const isOwner = project?.owner?._id === user?._id;

  if (loading) {
    return (
      <div className="app-main">
        <Navbar />
        <div className="app-content">
          <div className="loading">
            <div className="spinner"></div>
            Loading project...
          </div>
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="app-main">
      <Navbar />
      <div className="app-content">
        <div className="board-header">
          <div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')} style={{ marginBottom: 8 }}>
              ← Back to Projects
            </button>
            <h1>{project.title}</h1>
            {project.description && (
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', marginTop: 4 }}>
                {project.description}
              </p>
            )}
          </div>
          <div className="board-header-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => setShowMembers(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Members ({project.members?.length || 0})
            </button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="board-columns">
          {COLUMNS.map((col) => {
            const columnTasks = getColumnTasks(col.key);
            return (
              <div key={col.key} className="board-column">
                <div className={`column-header ${col.className}`}>
                  <span className="column-title">
                    {col.label}
                    <span className="column-count">{columnTasks.length}</span>
                  </span>
                  <button
                    className="column-add-btn"
                    onClick={() => setShowCreateTask(col.key)}
                    title={`Add task to ${col.label}`}
                  >
                    +
                  </button>
                </div>
                <div className="column-tasks">
                  {columnTasks.map((task) => (
                    <div
                      key={task._id}
                      className="task-card"
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="task-card-title">{task.title}</div>
                      <div className="task-card-meta">
                        <span className={`task-card-priority ${task.priority}`}>
                          {task.priority}
                        </span>
                        {task.assignee && (
                          <div className="task-card-assignee">
                            <div className="navbar-avatar small">
                              {getInitials(task.assignee.name)}
                            </div>
                            {task.assignee.name.split(' ')[0]}
                          </div>
                        )}
                      </div>
                      {task.dueDate && (
                        <div className={`task-card-due ${isOverdue(task.dueDate) ? 'overdue' : ''}`}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          {formatDate(task.dueDate)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Create Task Modal */}
        {showCreateTask && (
          <div className="modal-overlay" onClick={() => setShowCreateTask(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>New Task</h2>
                <button className="modal-close" onClick={() => setShowCreateTask(null)}>✕</button>
              </div>
              <form onSubmit={handleCreateTask}>
                <div className="modal-body">
                  {createError && <div className="auth-error">{createError}</div>}
                  <div className="form-group">
                    <label className="form-label" htmlFor="task-title">Title</label>
                    <input
                      id="task-title"
                      className="form-input"
                      type="text"
                      placeholder="What needs to be done?"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="task-desc">Description</label>
                    <textarea
                      id="task-desc"
                      className="form-input"
                      placeholder="Add more details..."
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      rows="3"
                    />
                  </div>
                  <div className="task-detail-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="task-priority">Priority</label>
                      <select
                        id="task-priority"
                        className="form-input"
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value)}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="task-assignee">Assignee</label>
                      <select
                        id="task-assignee"
                        className="form-input"
                        value={newAssignee}
                        onChange={(e) => setNewAssignee(e.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {project.members?.map((m) => (
                          <option key={m._id} value={m._id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="task-due">Due Date</label>
                    <input
                      id="task-due"
                      className="form-input"
                      type="date"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateTask(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Task Detail Modal */}
        {selectedTask && (
          <TaskModal
            task={selectedTask}
            project={project}
            onClose={() => setSelectedTask(null)}
            onUpdate={handleUpdateTask}
            onDelete={handleDeleteTask}
          />
        )}

        {/* Members Modal */}
        {showMembers && (
          <MembersList
            project={project}
            isOwner={isOwner}
            onClose={() => setShowMembers(false)}
            onUpdate={handleProjectUpdate}
          />
        )}
      </div>
    </div>
  );
}
