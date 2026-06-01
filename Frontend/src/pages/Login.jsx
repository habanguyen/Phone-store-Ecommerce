import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { data } = await api.post('/auth/login', {
        email,
        password,
      });

      login(data);
      const role = data?.user?.role;
      navigate((role === 'admin' || role === 'staff') ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <section className="section animate-fade">
      <div className="container">
        <div className="auth-card">
          <h2 className="auth-title">Đăng nhập</h2>
          <p className="auth-subtitle">Chào mừng trở lại! Đăng nhập để tiếp tục mua sắm</p>

          {error && <div className="alert error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Địa chỉ Email</label>
              <input
                className="input"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Mật khẩu</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: '8px' }}>
              Đăng nhập
            </button>
          </form>

          <div className="auth-actions">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => navigate('/register')}
            >
              Đăng ký tài khoản mới
            </button>

            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => navigate('/forgot-password')}
              style={{ fontSize: '13px', background: 'transparent', border: 'none', color: 'var(--text-light)', boxShadow: 'none' }}
            >
              Quên mật khẩu?
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;