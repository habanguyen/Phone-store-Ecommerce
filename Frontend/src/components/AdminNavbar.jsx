import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

const AdminNavbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="admin-navbar">
      <div className="admin-navbar-left">
        <div>
          <h1>⚙️ Admin Dashboard</h1>
          <p>Quản lý hệ thống quản trị toàn diện</p>
        </div>
      </div>
      <div className="admin-navbar-right">
        <button className="btn btn-secondary" onClick={handleLogout}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Đăng xuất
        </button>
      </div>
    </nav>
  );
};

export default AdminNavbar;
