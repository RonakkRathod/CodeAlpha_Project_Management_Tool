import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        ProBoard
      </div>

      {user && (
        <div className="navbar-right">
          <div className="navbar-user">
            <div className="navbar-avatar">{getInitials(user.name)}</div>
            <span>{user.name}</span>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      )}
    </nav>
  );
}
