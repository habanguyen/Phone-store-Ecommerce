import React from 'react';

const DashboardStats = ({ orders, products, feedbacks, report, isAdmin, formatCurrency }) => {
  return (
    <div className="adm-stats-grid">
      <div className="adm-stat-card info">
        <div className="adm-stat-icon-wrapper">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
        </div>
        <div className="adm-stat-info">
          <div className="adm-stat-label">Đơn Hàng</div>
          <div className="adm-stat-value">{orders.length}</div>
          <div className="adm-stat-note">Tổng đơn trong hệ thống</div>
        </div>
      </div>

      <div className="adm-stat-card primary">
        <div className="adm-stat-icon-wrapper">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
            <polygon points="12 22.08 12 12 3 6.92 3 17.08 12 22.08"></polygon>
            <polygon points="12 22.08 12 12 21 6.92 21 17.08 12 22.08"></polygon>
            <polygon points="12 12 3 6.92 12 1.84 21 6.92 12 12"></polygon>
          </svg>
        </div>
        <div className="adm-stat-info">
          <div className="adm-stat-label">Sản Phẩm</div>
          <div className="adm-stat-value">{products.length}</div>
          <div className="adm-stat-note">Sản phẩm đang được bày bán</div>
        </div>
      </div>

      <div className="adm-stat-card warning">
        <div className="adm-stat-icon-wrapper">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
        <div className="adm-stat-info">
          <div className="adm-stat-label">Phản Hồi</div>
          <div className="adm-stat-value">{feedbacks.length}</div>
          <div className="adm-stat-note">Đóng góp ý kiến khách hàng</div>
        </div>
      </div>

      {isAdmin && (
        <div className="adm-stat-card success">
          <div className="adm-stat-icon-wrapper">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div className="adm-stat-info">
            <div className="adm-stat-label">Doanh Thu</div>
            <div className="adm-stat-value">{formatCurrency(report?.totalRevenue || 0)}</div>
            <div className="adm-stat-note">Tổng tích lũy hoàn thành</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardStats;
