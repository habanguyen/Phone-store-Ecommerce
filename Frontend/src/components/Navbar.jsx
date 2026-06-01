import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { useState } from 'react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 3H5a2 2 0 0 0-2 2v4m0 0a9 9 0 1 0 18 0m0 0V5a2 2 0 0 0-2-2h-4m0 0V1m0 6v4m0 0l-4-4m4 4l4-4"></path>
          </svg>
          Minh Khang Store
        </Link>

        <div className="navbar-menu">
          <Link to="/">Trang chủ</Link>
          <Link to="/products">Sản phẩm</Link>
          {user && user.role !== 'admin' && <Link to="/profile">Tài khoản</Link>}
          {user && user.role !== 'admin' && <Link to="/orders">Đơn hàng</Link>}
          <Link to="/about">Giới thiệu</Link>
          <Link to="/contact">Liên hệ</Link>
        </div>

        <div className="navbar-actions">
          <form className="search-bar" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" title="Tìm kiếm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </button>
          </form>

          {(!user || user.role !== 'admin') && (
            <Link to="/cart" className="cart-icon" title="Giỏ hàng">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="8" cy="21" r="1"></circle>
                <circle cx="19" cy="21" r="1"></circle>
                <path d="m2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
              </svg>
            </Link>
          )}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>
                👤 {user.name}
              </span>
              {(user.role === 'admin' || user.role === 'staff') && (
                <Link to="/admin" className="btn btn-primary btn-small">
                  Admin
                </Link>
              )}
              <button className="btn btn-secondary btn-small" onClick={handleLogout}>
                Đăng xuất
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link to="/login" className="btn btn-secondary btn-small">Đăng nhập</Link>
              <Link to="/register" className="btn btn-primary btn-small">Đăng ký</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
