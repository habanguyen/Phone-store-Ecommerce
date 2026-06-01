import React from 'react';

const FeedbackTab = ({
  feedbacks,
  loadFeedbacks,
  viewFeedback,
  handleUpdateFeedbackStatus,
  selectedFeedback,
  setSelectedFeedback,
  replyMessage,
  setReplyMessage,
  handleReply,
  closeFeedbackModal
}) => {
  return (
    <div className="adm-card animate-fade">
      <div className="adm-card-title">
        <h3>Ý Kiến & Phản Hồi Khách Hàng</h3>
        <button className="adm-btn adm-btn-secondary adm-btn-small" onClick={loadFeedbacks}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '4px' }}>
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
          </svg>
          Tải Lại
        </button>
      </div>

      <div className="adm-table-wrapper">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Mã Phản Hồi</th>
              <th>Khách Hàng</th>
              <th>Tiêu Đề</th>
              <th>Trạng Thái</th>
              <th>Ngày Gửi</th>
              <th style={{ textAlign: 'right' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {feedbacks.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>
                  Chưa nhận được góp ý/phản hồi nào từ khách hàng.
                </td>
              </tr>
            ) : (
              feedbacks.map((f) => (
                <tr key={f._id}>
                  <td style={{ fontFamily: 'monospace' }}>#{f._id?.slice(-8)}</td>
                  <td>
                    <div style={{ color: '#fff', fontWeight: '600' }}>{f.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--adm-text-muted)' }}>{f.email}</div>
                  </td>
                  <td style={{ fontWeight: '600', color: '#fff' }}>{f.subject}</td>
                  <td>
                    <span
                      className={`adm-badge ${
                        f.status === 'new'
                          ? 'pending'
                          : f.status === 'in_progress'
                          ? 'shipping'
                          : 'confirmed'
                      }`}
                    >
                      {f.status === 'new'
                        ? 'Mới nhận'
                        : f.status === 'in_progress'
                        ? 'Đang xử lý'
                        : 'Đã giải quyết'}
                    </span>
                  </td>
                  <td>{new Date(f.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        className="adm-btn adm-btn-secondary adm-btn-small"
                        onClick={() => viewFeedback(f._id)}
                      >
                        Chi Tiết
                      </button>
                      <button
                        className={`adm-btn adm-btn-small ${f.status === 'new' ? 'adm-btn-primary' : 'adm-btn-success'}`}
                        disabled={f.status === 'resolved'}
                        onClick={() =>
                          handleUpdateFeedbackStatus(
                            f._id,
                            f.status === 'new' ? 'in_progress' : 'resolved'
                          )
                        }
                      >
                        {f.status === 'new' ? 'Xử Lý' : f.status === 'in_progress' ? 'Giải Quyết' : 'Hoàn Tất'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedFeedback && (
        <div className="adm-modal-overlay" onClick={closeFeedbackModal}>
          <div className="adm-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>Chi Tiết Phản Hồi #{selectedFeedback._id?.slice(-8)}</h3>
              <button className="adm-modal-close" onClick={closeFeedbackModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <p style={{ margin: '0 0 8px' }}><strong>Họ và tên:</strong> {selectedFeedback.name}</p>
                <p style={{ margin: '0 0 8px' }}><strong>Email:</strong> {selectedFeedback.email}</p>
                <p style={{ margin: '0' }}><strong>Điện thoại:</strong> {selectedFeedback.phone || 'N/A'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>Trạng thái xử lý:</strong>{' '}
                  <span
                    className={`adm-badge ${
                      selectedFeedback.status === 'new'
                        ? 'pending'
                        : selectedFeedback.status === 'in_progress'
                        ? 'shipping'
                        : 'confirmed'
                    }`}
                  >
                    {selectedFeedback.status === 'new'
                      ? 'Mới nhận'
                      : selectedFeedback.status === 'in_progress'
                      ? 'Đang xử lý'
                      : 'Đã xử lý xong'}
                  </span>
                </p>
                <p style={{ margin: '0' }}>
                  <strong>Ngày gửi:</strong> {new Date(selectedFeedback.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--adm-border)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px'
              }}
            >
              <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--adm-text-muted)', textTransform: 'uppercase' }}>
                Tiêu đề: {selectedFeedback.subject}
              </h4>
              <p style={{ margin: 0, color: '#fff', fontSize: '14.5px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {selectedFeedback.message}
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--adm-text-muted)', marginBottom: '8px' }}>
                Nội dung phản hồi / Ghi chú của Admin
              </label>
              {selectedFeedback.reply && (
                <div
                  style={{
                    padding: '12px 16px',
                    background: 'var(--adm-success-glow)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '10px',
                    color: '#fff',
                    marginBottom: '12px',
                    fontSize: '14px',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  <strong>Phản hồi trước đó:</strong> {selectedFeedback.reply}
                </div>
              )}
              {selectedFeedback.status !== 'resolved' ? (
                <textarea
                  className="adm-input adm-textarea"
                  placeholder="Nhập câu trả lời gửi đến khách hàng hoặc ghi chú lưu lại..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  style={{ minHeight: '120px' }}
                />
              ) : (
                <p style={{ fontStyle: 'italic', color: 'var(--adm-text-darker)', fontSize: '13px' }}>
                  Ý kiến phản hồi này đã được đánh dấu hoàn tất. Không thể thay đổi phản hồi.
                </p>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              {selectedFeedback.status !== 'resolved' && (
                <button className="adm-btn adm-btn-primary" onClick={handleReply} disabled={!replyMessage.trim()}>
                  Gửi Phản Hồi
                </button>
              )}
              <button className="adm-btn adm-btn-secondary" onClick={closeFeedbackModal}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackTab;
