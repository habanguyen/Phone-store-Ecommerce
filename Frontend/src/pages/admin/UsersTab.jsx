import React from 'react';

const UsersTab = ({
  users,
  userSearch,
  setUserSearch,
  newUser,
  setNewUser,
  loadUsers,
  editingUserId,
  setEditingUserId,
  handleCreateUser,
  handleUpdateUser,
  handleUserToggle,
  handleEditUser,
  handleDeleteUser,
  ROLE_LABELS,
  error,
  message,
  setError,
  setMessage
}) => {
  const handleCancel = () => {
    setEditingUserId(null);
    setNewUser({ name: '', email: '', password: '', role: 'user' });
    if (setError) setError('');
    if (setMessage) setMessage('');
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Form Section */}
      <div className="adm-card">
        <div className="adm-card-title">
          <h3>{editingUserId ? 'Cập Nhật Người Dùng' : 'Tạo Tài Khoản Mới'}</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', alignItems: 'end' }}>
          <div className="adm-input-group">
            <label>Tên hiển thị</label>
            <input
              type="text"
              className="adm-input"
              placeholder="Nhập họ và tên..."
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            />
          </div>

          <div className="adm-input-group">
            <label>Email đăng nhập</label>
            <input
              type="email"
              className="adm-input"
              placeholder="email@example.com"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            />
          </div>

          <div className="adm-input-group">
            <label>Mật khẩu {editingUserId && '(để trống nếu giữ nguyên)'}</label>
            <input
              type="password"
              className="adm-input"
              placeholder="Tối thiểu 6 ký tự"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            />
          </div>

          <div className="adm-input-group">
            <label>Vai trò</label>
            <select
              className="adm-input adm-select"
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            >
              <option value="user">Người dùng</option>
              <option value="staff">Nhân viên</option>
              <option value="admin">Quản trị viên</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="adm-btn adm-btn-primary"
              style={{ flex: 1 }}
              onClick={editingUserId ? handleUpdateUser : handleCreateUser}
            >
              {editingUserId ? 'Cập Nhật' : 'Lưu Lại'}
            </button>
            {editingUserId && (
              <button className="adm-btn adm-btn-secondary" onClick={handleCancel}>
                Hủy
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Listing Section */}
      <div className="adm-card">
        <div className="adm-card-title">
          <h3>Danh Sách Người Dùng</h3>
        </div>

        <div className="adm-action-bar">
          <div className="adm-action-bar-filters" style={{ width: '100%' }}>
            <div className="adm-search-input-wrapper">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                className="adm-input"
                placeholder="Tìm theo tên hoặc email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
              />
            </div>
            <button className="adm-btn adm-btn-secondary" onClick={loadUsers}>
              Tìm Kiếm
            </button>
          </div>
        </div>

        <div className="adm-table-wrapper">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Họ Tên</th>
                <th>Email</th>
                <th>Vai Trò</th>
                <th>Trạng Thái</th>
                <th style={{ textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>
                    Không tìm thấy thành viên nào.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id}>
                    <td style={{ fontWeight: '700', color: '#fff' }}>{user.name || 'Chưa cập nhật'}</td>
                    <td>{user.email}</td>
                    <td>
                      <span
                        className={`adm-badge ${
                          user.role === 'admin' ? 'delivered' : user.role === 'staff' ? 'shipping' : 'pending'
                        }`}
                        style={{ fontSize: '11px', padding: '2px 8px' }}
                      >
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`adm-badge ${user.isBlocked ? 'cancelled' : 'confirmed'}`}>
                        {user.isBlocked ? 'Đã khóa' : 'Đang hoạt động'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          className={`adm-btn adm-btn-small ${user.isBlocked ? 'adm-btn-success' : 'adm-btn-danger'}`}
                          onClick={() => handleUserToggle(user._id, user.isBlocked)}
                        >
                          {user.isBlocked ? 'Mở Khóa' : 'Khóa'}
                        </button>
                        <button
                          className="adm-btn adm-btn-secondary adm-btn-small"
                          onClick={() => handleEditUser(user)}
                        >
                          Sửa
                        </button>
                        <button
                          className="adm-btn adm-btn-danger adm-btn-small"
                          onClick={() => handleDeleteUser(user._id)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsersTab;
