import React from 'react';
import AdminChatbox from '../../components/AdminChatbox.jsx';

const AdminAITab = ({
  adminType,
  setAdminType,
  adminPrompt,
  setAdminPrompt,
  fetchAdminInsight,
  loadingInsight,
  adminInsight
}) => {
  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* AI Chat Console */}
      <div className="adm-card">
        <div className="adm-card-title">
          <h3>Trợ Lý AI Quản Trị Hệ Thống</h3>
        </div>
        <AdminChatbox />
      </div>

      {/* AI Insight Generator */}
      <div className="adm-card">
        <div className="adm-card-title">
          <h3>Công Cụ Phân Tích & Viết Nội Dung Bằng AI</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p style={{ margin: 0, color: 'var(--adm-text-muted)', fontSize: '13.5px', lineHeight: '1.5' }}>
            Chọn lĩnh vực phân tích và cung cấp gợi ý để AI trích xuất phân tích thống kê chuyên sâu hoặc soạn thảo tài liệu Marketing, mô tả sản phẩm.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
            <div className="adm-input-group" style={{ flex: '1 0 240px' }}>
              <label>Chuyên mục AI hỗ trợ</label>
              <select
                className="adm-input adm-select"
                value={adminType}
                onChange={(e) => setAdminType(e.target.value)}
              >
                <option value="revenue">Phân tích doanh thu</option>
                <option value="inventory">Phân tích tồn kho</option>
                <option value="behavior">Phân tích hành vi khách hàng</option>
                <option value="product_content">Tạo nội dung sản phẩm</option>
                <option value="marketing">Tạo nội dung marketing</option>
                <option value="reviews">Quản lý đánh giá</option>
                <option value="orders">Thống kê đơn hàng</option>
                <option value="trend">Dự đoán xu hướng</option>
                <option value="system">Quản trị hệ thống</option>
                <option value="chatbot">Chatbot quản trị nội bộ</option>
              </select>
            </div>

            <div className="adm-input-group" style={{ flex: '2 0 320px' }}>
              <label>Từ khóa / Chi tiết gợi ý thêm</label>
              <input
                className="adm-input"
                placeholder="Ví dụ: Phân tích doanh số iPhone 15, Viết bài quảng cáo cho Samsung S24..."
                value={adminPrompt}
                onChange={(e) => setAdminPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchAdminInsight()}
              />
            </div>

            <button
              className="adm-btn adm-btn-primary"
              style={{ height: '46px' }}
              onClick={fetchAdminInsight}
              disabled={loadingInsight}
            >
              {loadingInsight ? (
                <>
                  <svg
                    style={{
                      animation: 'spin 1s linear infinite',
                      marginRight: '8px',
                      display: 'inline-block'
                    }}
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  >
                    <line x1="12" y1="2" x2="12" y2="6"></line>
                    <line x1="12" y1="18" x2="12" y2="22"></line>
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                    <line x1="2" y1="12" x2="6" y2="12"></line>
                    <line x1="18" y1="12" x2="22" y2="12"></line>
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                  </svg>
                  Đang xử lý...
                </>
              ) : (
                'Tạo insight'
              )}
            </button>
          </div>

          {adminInsight && (
            <div
              className="animate-fade"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--adm-border-hover)',
                borderRadius: '12px',
                padding: '24px',
                color: '#fff',
                fontSize: '14.5px',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.2)'
              }}
            >
              <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--adm-primary-hover)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Kết quả phân tích từ AI
              </h4>
              {adminInsight}
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminAITab;
