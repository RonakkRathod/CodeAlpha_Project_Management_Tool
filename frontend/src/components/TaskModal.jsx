import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function TaskModal({ task, project, onClose, onUpdate, onDelete }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);
  const [sending, setSending] = useState(false);

  // Edit fields
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [assignee, setAssignee] = useState(task.assignee?._id || '');
  const [dueDate, setDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
  );
  const [editing, setEditing] = useState(false);

  const commentsEndRef = useRef(null);

  useEffect(() => {
    fetchComments();
  }, [task._id]);

  useEffect(() => {
    // Scroll to bottom when new comments arrive
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  const fetchComments = async () => {
    try {
      const res = await api.get(`/comments/task/${task._id}`);
      setComments(res.data);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSave = async () => {
    const updates = {};
    if (title !== task.title) updates.title = title;
    if (description !== (task.description || '')) updates.description = description;
    if (status !== task.status) updates.status = status;
    if (priority !== task.priority) updates.priority = priority;
    if (assignee !== (task.assignee?._id || '')) updates.assignee = assignee;
    if (dueDate !== (task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''))
      updates.dueDate = dueDate;

    if (Object.keys(updates).length > 0) {
      await onUpdate(task._id, updates);
    }
    setEditing(false);
  };

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    await onUpdate(task._id, { status: newStatus });
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSending(true);

    try {
      const res = await api.post('/comments', {
        text: commentText,
        taskId: task._id
      });
      setComments([...comments, res.data]);
      setCommentText('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      setComments(comments.filter((c) => c._id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal task-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ flex: 1 }}>
            {editing ? (
              <input
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ fontSize: '1rem', fontWeight: 600 }}
              />
            ) : (
              task.title
            )}
          </h2>
          <div style={{ display: 'flex', gap: 6 }}>
            {!editing ? (
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
                Edit
              </button>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={handleSave}>
                Save
              </button>
            )}
            <button
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--danger)' }}
              onClick={() => onDelete(task._id)}
            >
              Delete
            </button>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="task-modal-body">
          {/* Status Quick Toggle */}
          <div className="task-detail-section">
            <h3>Status</h3>
            <div style={{ display: 'flex', gap: 6 }}>
              {['todo', 'in-progress', 'review', 'done'].map((s) => (
                <button
                  key={s}
                  className={`btn btn-sm ${status === s ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleStatusChange(s)}
                  style={{ textTransform: 'capitalize', fontSize: '0.75rem' }}
                >
                  {s === 'in-progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="task-detail-section">
            <h3>Details</h3>
            {editing ? (
              <>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="3"
                    placeholder="Add description..."
                  />
                </div>
                <div className="task-detail-row">
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-input"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assignee</label>
                    <select
                      className="form-input"
                      value={assignee}
                      onChange={(e) => setAssignee(e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {project.members?.map((m) => (
                        <option key={m._id} value={m._id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input
                    className="form-input"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <div>
                <div className="task-detail-field">
                  <label>Description</label>
                  <div className="value" style={{ whiteSpace: 'pre-wrap' }}>
                    {task.description || <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No description</span>}
                  </div>
                </div>
                <div className="task-detail-row">
                  <div className="task-detail-field">
                    <label>Priority</label>
                    <div className="value">
                      <span className={`task-card-priority ${task.priority}`}>{task.priority}</span>
                    </div>
                  </div>
                  <div className="task-detail-field">
                    <label>Assignee</label>
                    <div className="value">
                      {task.assignee ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="navbar-avatar small">{getInitials(task.assignee.name)}</span>
                          {task.assignee.name}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Unassigned</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="task-detail-row">
                  <div className="task-detail-field">
                    <label>Due Date</label>
                    <div className="value">
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        : <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No due date</span>
                      }
                    </div>
                  </div>
                  <div className="task-detail-field">
                    <label>Created By</label>
                    <div className="value">{task.createdBy?.name || 'Unknown'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="comments-section">
            <h3>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Comments ({comments.length})
            </h3>

            <div className="comment-list">
              {loadingComments ? (
                <div className="loading" style={{ padding: '16px 0' }}>
                  <div className="spinner"></div>
                </div>
              ) : comments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                  No comments yet. Start the conversation!
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment._id} className="comment-item">
                    <div className="navbar-avatar small">{getInitials(comment.author?.name)}</div>
                    <div className="comment-body">
                      <div className="comment-header">
                        <span className="comment-author">{comment.author?.name}</span>
                        <span className="comment-time">{timeAgo(comment.createdAt)}</span>
                      </div>
                      <div className="comment-text">{comment.text}</div>
                      {comment.author?._id === user?._id && (
                        <button
                          className="comment-delete"
                          onClick={() => handleDeleteComment(comment._id)}
                          title="Delete comment"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={commentsEndRef} />
            </div>

            <form className="comment-form" onSubmit={handleAddComment}>
              <input
                className="form-input"
                type="text"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button
                className="btn btn-primary btn-sm"
                type="submit"
                disabled={!commentText.trim() || sending}
              >
                {sending ? '...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
