import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../AuthContext.jsx';

const Profile = () => {
  const { user, token, login, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role === 'admin') {
      navigate('/admin');
    }
  }, [user, navigate]);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [infoMessage, setInfoMessage] = useState('');
  const [infoError, setInfoError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [otp, setOtp] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setInfoError('');
    setInfoMessage('');

    try {
      const { data } = await api.put('/auth/me', {
        name,
        phone,
        address,
        avatar
      });

      login({ token, user: data });
      setInfoMessage('Cập nhật thông tin cá nhân thành công.');
    } catch (err) {
      setInfoError(err.response?.data?.message || 'Cập nhật thất bại.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordMessage('');

    try {
      await api.put('/auth/me/password', {
        currentPassword,
        newPassword
      });
      setCurrentPassword('');
      setNewPassword('');
      setPasswordMessage('Đổi mật khẩu thành công.');
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Đổi mật khẩu thất bại.');
    }
  };

  const handleSendDeleteOtp = async () => {
    setDeleteError('');
    setDeleteMessage('');

    try {
      await api.post('/auth/me/send-delete-otp');
      setOtpSent(true);
      setDeleteMessage('OTP đã được gửi đến email của bạn.');
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Không thể gửi OTP.');
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteError('');
    setDeleteMessage('');
    setIsDeleting(true);

    try {
      await api.delete('/auth/me', { data: { otp } });
      logout();
      navigate('/');
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Xóa tài khoản thất bại.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 900 }}>
        <div className="card">
          <div className="card-body">
            <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Quản lý tài khoản</h2>

            <div style={{ display: 'grid', gap: 24 }}>
              <div className="card" style={{ padding: 20, background: '#fafafa' }}>
                <h3>Thông tin cá nhân</h3>
                {infoMessage && <div className="alert success">{infoMessage}</div>}
                {infoError && <div className="alert">{infoError}</div>}
                <form onSubmit={handleUpdateProfile}>
                  <input
                    className="input"
                    placeholder="Tên"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <input
                    className="input"
                    placeholder="Số điện thoại"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ marginTop: 16 }}
                  />
                  <input
                    className="input"
                    placeholder="Địa chỉ"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    style={{ marginTop: 16 }}
                  />
                  <input
                    className="input"
                    placeholder="URL ảnh đại diện"
                    value={avatar || ''}
                    onChange={(e) => setAvatar(e.target.value)}
                    style={{ marginTop: 16 }}
                  />
                  {avatar && (
                    <div style={{ marginTop: 16, textAlign: 'center' }}>
                      <img
                        src={avatar}
                        alt="Avatar preview"
                        style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '1px solid #ddd' }}
                        onError={(e) => { e.target.src = ''; }}
                      />
                    </div>
                  )}
                  <button className="button" type="submit" style={{ marginTop: 20 }}>
                    Cập nhật thông tin
                  </button>
                </form>
              </div>

              <div className="card" style={{ padding: 20, background: '#fafafa' }}>
                <h3>Đổi mật khẩu</h3>
                {passwordMessage && <div className="alert success">{passwordMessage}</div>}
                {passwordError && <div className="alert">{passwordError}</div>}
                <form onSubmit={handleChangePassword}>
                  <input
                    className="input"
                    type="password"
                    placeholder="Mật khẩu hiện tại"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <input
                    className="input"
                    type="password"
                    placeholder="Mật khẩu mới"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ marginTop: 16 }}
                  />
                  <button className="button" type="submit" style={{ marginTop: 20 }}>
                    Đổi mật khẩu
                  </button>
                </form>
              </div>

              <div className="card" style={{ padding: 20, background: '#fff2f2' }}>
                <h3>Xóa tài khoản</h3>
                <p>Việc xóa tài khoản sẽ xóa tất cả dữ liệu cá nhân và lịch sử đặt hàng của bạn. Vui lòng xác nhận OTP/email trước khi xóa.</p>
                {deleteMessage && <div className="alert success">{deleteMessage}</div>}
                {deleteError && <div className="alert">{deleteError}</div>}
                <button className="button secondary" type="button" onClick={handleSendDeleteOtp}>
                  Gửi mã OTP xác nhận
                </button>
                {otpSent && (
                  <form onSubmit={handleDeleteAccount} style={{ marginTop: 16 }}>
                    <input
                      className="input"
                      placeholder="Nhập mã OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                    <button className="button" type="submit" disabled={isDeleting} style={{ marginTop: 16 }}>
                      {isDeleting ? 'Đang xóa...' : 'Xóa tài khoản'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Profile;
