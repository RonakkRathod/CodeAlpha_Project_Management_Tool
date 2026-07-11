import { useState } from 'react';
import api from '../api/axios';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

export default function MembersList({ project, isOwner, onClose, onUpdate }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');
    setAdding(true);

    try {
      const res = await api.post(`/projects/${project._id}/members`, { email });
      onUpdate(res.data);
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member from the project?')) return;

    try {
      const res = await api.delete(`/projects/${project._id}/members/${userId}`);
      onUpdate(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Project Members</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="members-section">
            <div className="members-list">
              {project.members?.map((member) => (
                <div key={member._id} className="member-tag">
                  <div className="navbar-avatar">{getInitials(member.name)}</div>
                  <span>{member.name}</span>
                  {member._id === project.owner?._id && (
                    <span className="member-owner-badge">Owner</span>
                  )}
                  {isOwner && member._id !== project.owner?._id && (
                    <button
                      className="member-remove"
                      onClick={() => handleRemoveMember(member._id)}
                      title="Remove member"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {isOwner && (
              <>
                <form className="member-add-form" onSubmit={handleAddMember}>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="Add member by email..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <button className="btn btn-primary btn-sm" type="submit" disabled={adding}>
                    {adding ? '...' : 'Add'}
                  </button>
                </form>
                {error && (
                  <div className="auth-error" style={{ marginTop: 10 }}>
                    {error}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
