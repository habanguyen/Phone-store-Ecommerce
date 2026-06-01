import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import '@fortawesome/fontawesome-free/css/all.min.css'

const Register = () => {
  const [step, setStep] = useState(1);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [otp, setOtp] = useState('');
  const [testOtp, setTestOtp] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const validatePassword = (value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);
  const validatePhone = (value) => /^\d{10,11}$/.test(value);

  const getValidationError = () => {
    if (!name.trim() || name.trim().length < 2) {
      return 'Tên phải có ít nhất 2 ký tự.';
    }
    if (!validateEmail(email)) {
      return 'Email không hợp lệ.';
    }
    if (!validatePassword(password)) {
      return 'Mật khẩu phải tối thiểu 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.';
    }
    if (password !== confirmPassword) {
      return 'Mật khẩu xác nhận không khớp.';
    }
    if (!validatePhone(phone)) {
      return 'Số điện thoại phải gồm 10 hoặc 11 chữ số.';
    }
    if (!address.trim() || address.trim().length < 10) {
      return 'Địa chỉ phải mô tả chi tiết (ít nhất 10 ký tự): số nhà, phường/xã, quận/huyện, thành phố.';
    }
    return null;
  };

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();

    const validationError = getValidationError();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const { data } = await api.post('/auth/send-otp', {
        email,
      });

      setStep(2);
      setError('');
      setTestOtp(data.otp || '');
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi OTP. Vui lòng thử lại.');
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (!/^\d{6}$/.test(otp)) {
      setError('OTP phải gồm 6 chữ số.');
      return;
    }

    try {
      const { data } = await api.post('/auth/verify-otp', {
        email,
        otp,
        name,
        password,
        phone,
        address,
      });

      login(data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Xác thực OTP không thành công.');
    }
  };

  return (
    <section className="section animate-fade">
      <div className="container">
        <div className="auth-card">
          <h2 className="auth-title">Đăng ký</h2>
          <p className="auth-subtitle">Tạo tài khoản của bạn để trải nghiệm dịch vụ mua sắm tuyệt vời</p>

          {error && <div className="alert error">{error}</div>}

          {step === 1 && (
            <form className="auth-form" onSubmit={handleSendOTP}>
              <div className="form-group">
                <label>Họ và tên</label>
                <input
                  className="input"
                  placeholder="Nguyễn Văn A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

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
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    style={{ position: 'absolute', right: 12, top: 12, color: 'var(--text-light)', border: 'none', background: 'transparent' }}
                  >
                    {showPassword ? <i className="fa-solid fa-eye"></i> : <i className="fa-solid fa-eye-slash"></i>}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Xác nhận mật khẩu</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    style={{ position: 'absolute', right: 12, top: 12, color: 'var(--text-light)', border: 'none', background: 'transparent' }}
                  >
                    {showPassword ? <i className="fa-solid fa-eye"></i> : <i className="fa-solid fa-eye-slash"></i>}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Số điện thoại</label>
                <input
                  className="input"
                  placeholder="0912345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Địa chỉ nhận hàng</label>
                <textarea
                  className="input"
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, thành phố"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  rows={3}
                />
              </div>

              <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: '8px' }}>
                Gửi mã xác thực OTP
              </button>
            </form>
          )}

          {step === 2 && (
            <form className="auth-form" onSubmit={handleVerifyOTP}>
              <p className="otp-info" style={{ color: 'var(--text-light)', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>
                Mã xác thực đã được gửi tới <strong>{email}</strong>
              </p>

              {testOtp && (
                <div className="alert alert-info">
                  Mã OTP thử nghiệm: <strong>{testOtp}</strong>
                </div>
              )}

              <div className="form-group">
                <label>Mã xác thực OTP</label>
                <input
                  className="input"
                  placeholder="Nhập 6 chữ số OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>

              <div className="auth-actions" style={{ gap: '12px' }}>
                <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>
                  Xác nhận & Đăng ký
                </button>

                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setTestOtp('');
                  }}
                  style={{ width: '100%' }}
                >
                  Quay lại
                </button>
              </div>
            </form>
          )}

          <div className="auth-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '24px' }}>
            <span style={{ color: 'var(--text-light)' }}>Bạn đã có tài khoản? </span>
            <button
              className="auth-link"
              onClick={() => navigate('/login')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 'inherit' }}
            >
              Đăng nhập ngay
            </button>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Register;