import React, { useState } from 'react';

const OrdersTab = ({
  orders,
  STATUS_LABELS,
  getAvailableStatuses,
  handleUpdateOrder,
  viewOrder,
  exportOrders,
  selectedOrder,
  closeOrderModal,
  formatCurrency
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="adm-card animate-fade">
      <div className="adm-card-title">
        <h3>Quản Lý Đơn Hàng</h3>
        <button className="adm-btn adm-btn-primary adm-btn-small" onClick={exportOrders}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Xuất Excel
        </button>
      </div>

      <div className="adm-action-bar">
        <div className="adm-action-bar-filters">
          <div className="adm-search-input-wrapper">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className="adm-input"
              placeholder="Tìm theo ID đơn hoặc Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="adm-input adm-select"
            style={{ width: '180px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="adm-table-wrapper">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Mã Đơn Hàng</th>
              <th>Khách Hàng</th>
              <th>Phương Thức & TT</th>
              <th>Tổng Tiền</th>
              <th>Trạng Thái</th>
              <th>Ngày Tạo</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>
                  Không tìm thấy đơn hàng nào.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const availableTransitions = getAvailableStatuses(order.status);
                const isPaid = order.paymentStatus === 'paid';
                const isOnlineWaitConfirm = !isPaid && ['bank_transfer', 'stripe'].includes(order.paymentMethod);

                return (
                  <tr key={order._id}>
                    <td style={{ fontWeight: '700', fontFamily: 'monospace' }}>#{order._id?.slice(-8)}</td>
                    <td>
                      <div style={{ color: '#fff', fontWeight: '600' }}>{order.user?.name || 'N/A'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--adm-text-muted)' }}>{order.user?.email}</div>
                    </td>
                    <td>
                      <div>
                        {order.paymentMethod === 'bank_transfer'
                          ? 'Chuyển khoản'
                          : order.paymentMethod === 'stripe'
                          ? 'Thẻ Stripe'
                          : 'Ship COD'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        <span
                          className={`adm-badge ${isPaid ? 'confirmed' : 'pending'}`}
                          style={{ padding: '2px 8px', fontSize: '11px' }}
                        >
                          {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </span>
                      </div>
                      {isOnlineWaitConfirm && (
                        <div style={{ marginTop: '4px', color: 'var(--adm-warning)', fontSize: '11px', fontStyle: 'italic' }}>
                          Chờ xác nhận thanh toán
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: '700', color: '#fff' }}>{formatCurrency(order.finalPrice)}</td>
                    <td>
                      <span className={`adm-badge ${order.status}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <select
                          className="adm-input adm-select adm-btn-small"
                          style={{ width: '130px', padding: '6px 12px', fontSize: '12px' }}
                          value={order.status}
                          disabled={availableTransitions.length === 0}
                          onChange={(e) => handleUpdateOrder(order._id, e.target.value)}
                        >
                          <option value={order.status} disabled>
                            {STATUS_LABELS[order.status] || order.status}
                          </option>
                          {availableTransitions.map((nextStatus) => (
                            <option key={nextStatus} value={nextStatus}>
                              {STATUS_LABELS[nextStatus] || nextStatus}
                            </option>
                          ))}
                        </select>
                        <button
                          className="adm-btn adm-btn-secondary adm-btn-small"
                          onClick={() => viewOrder(order._id)}
                        >
                          Xem
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div className="adm-modal-overlay" onClick={closeOrderModal}>
          <div className="adm-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>Đơn hàng #{selectedOrder._id}</h3>
              <button className="adm-modal-close" onClick={closeOrderModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>Khách hàng:</strong> {selectedOrder.user?.name} ({selectedOrder.user?.email})
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>Địa chỉ giao hàng:</strong> {selectedOrder.shippingAddress}
                </p>
                <p style={{ margin: '0' }}>
                  <strong>Ngày tạo:</strong> {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>Trạng thái thanh toán:</strong>{' '}
                  <span className={`adm-badge ${selectedOrder.paymentStatus === 'paid' ? 'confirmed' : 'pending'}`} style={{ padding: '2px 8px' }}>
                    {selectedOrder.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </span>
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  <strong>Phương thức:</strong> {
                    selectedOrder.paymentMethod === 'bank_transfer'
                      ? 'Chuyển khoản online'
                      : selectedOrder.paymentMethod === 'stripe'
                      ? 'Visa Stripe'
                      : 'Thanh toán khi nhận hàng'
                  }
                </p>
                <p style={{ margin: '0' }}>
                  <strong>Trạng thái vận chuyển:</strong>{' '}
                  <span className={`adm-badge ${selectedOrder.status}`} style={{ padding: '2px 8px' }}>
                    {STATUS_LABELS[selectedOrder.status] || selectedOrder.status}
                  </span>
                </p>
              </div>
            </div>

            {selectedOrder.paymentStatus !== 'paid' && ['bank_transfer', 'stripe'].includes(selectedOrder.paymentMethod) && (
              <div
                style={{
                  marginBottom: '24px',
                  padding: '16px',
                  background: 'var(--adm-warning-glow)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: '12px',
                  color: 'var(--adm-warning)',
                  fontSize: '13.5px',
                  lineHeight: '1.5'
                }}
              >
                <strong>Lưu ý xác nhận:</strong> Đây là giao dịch trực tuyến. Vui lòng kiểm tra sao kê tài khoản ngân hàng hoặc tài khoản Stripe trước khi xác nhận đơn hàng thành <strong>"Đã xác nhận" (Confirmed)</strong>.
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: '800', marginBottom: '12px' }}>Chi Tiết Sản Phẩm</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedOrder.items.map((it) => (
                  <div
                    key={it._id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--adm-border)',
                      borderRadius: '10px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '700', color: '#fff' }}>{it.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--adm-text-muted)', marginTop: '4px' }}>
                        Dung lượng: {it.size || 'N/A'} | Màu sắc: {it.color || 'N/A'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '600', color: '#fff' }}>{formatCurrency(it.price)}</div>
                      <div style={{ fontSize: '12px', color: 'var(--adm-text-darker)' }}>SL: {it.quantity}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid var(--adm-border)',
                paddingTop: '20px',
                marginBottom: '20px'
              }}
            >
              <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--adm-text-muted)' }}>Tổng Giá Trị Đơn Hàng</span>
              <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--adm-primary)' }}>
                {formatCurrency(selectedOrder.finalPrice)}
              </span>
            </div>

            <div style={{ textAlign: 'right' }}>
              <button className="adm-btn adm-btn-secondary" onClick={closeOrderModal}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersTab;
