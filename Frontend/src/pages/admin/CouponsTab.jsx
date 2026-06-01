import React from 'react';

const CouponsTab = ({
  coupons,
  couponForm,
  setCouponForm,
  editingCouponId,
  handleEditCoupon,
  handleDeleteCoupon,
  handleSaveCoupon,
  handleCancelCouponEdit,
  products,
  handleCouponFormChange,
  handleCouponProductsChange
}) => {
  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Coupon Form */}
      <div className="adm-card">
        <div className="adm-card-title">
          <h3>{editingCouponId ? 'Cập Nhật Mã Giảm Giá' : 'Tạo Mã Giảm Giá Mới'}</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="adm-form-row">
            <div className="adm-input-group">
              <label>Mã giảm giá</label>
              <input
                type="text"
                className="adm-input"
                placeholder="Ví dụ: SUMMER2026..."
                value={couponForm.code}
                onChange={(e) => handleCouponFormChange('code', e.target.value.toUpperCase())}
              />
              <span className="adm-input-hint">Ký tự viết hoa, không dấu, viết liền</span>
            </div>

            <div className="adm-input-group">
              <label>Loại giảm giá</label>
              <select
                className="adm-input adm-select"
                value={couponForm.type}
                onChange={(e) => handleCouponFormChange('type', e.target.value)}
              >
                <option value="fixed">Số tiền cố định (đ)</option>
                <option value="percent">Tỉ lệ phần trăm (%)</option>
              </select>
            </div>

            <div className="adm-input-group">
              <label>Giá trị giảm</label>
              <input
                type="number"
                className="adm-input"
                placeholder="Số tiền hoặc phần trăm..."
                value={couponForm.value}
                onChange={(e) => handleCouponFormChange('value', e.target.value)}
              />
            </div>
          </div>

          <div className="adm-form-row">
            <div className="adm-input-group">
              <label>Giá trị đơn tối thiểu (đ)</label>
              <input
                type="number"
                className="adm-input"
                placeholder="Áp dụng từ mức tiền..."
                value={couponForm.minOrder}
                onChange={(e) => handleCouponFormChange('minOrder', e.target.value)}
              />
            </div>

            <div className="adm-input-group">
              <label>Ngày hết hạn</label>
              <input
                type="date"
                className="adm-input"
                value={couponForm.expiredAt}
                onChange={(e) => handleCouponFormChange('expiredAt', e.target.value)}
              />
            </div>

            <div className="adm-input-group">
              <label>Giới hạn số lượng dùng</label>
              <input
                type="number"
                className="adm-input"
                placeholder="Số lần dùng tối đa..."
                value={couponForm.usageLimit}
                onChange={(e) => handleCouponFormChange('usageLimit', e.target.value)}
              />
              <span className="adm-input-hint">Nhập 0 nếu không giới hạn số lượng</span>
            </div>
          </div>

          <div className="adm-form-row">
            <div className="adm-input-group">
              <label>Phạm vi áp dụng</label>
              <select
                className="adm-input adm-select"
                value={couponForm.applyTo}
                onChange={(e) => handleCouponFormChange('applyTo', e.target.value)}
              >
                <option value="order">Toàn đơn hàng</option>
                <option value="product">Chỉ áp dụng cho sản phẩm cụ thể</option>
              </select>
            </div>

            <div className="adm-input-group" style={{ justifyContent: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', height: '100%', marginTop: '20px' }}>
                <input
                  type="checkbox"
                  checked={couponForm.isActive}
                  onChange={(e) => handleCouponFormChange('isActive', e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--adm-primary)' }}
                />
                <span style={{ fontSize: '14px', fontWeight: '700' }}>Kích hoạt hoạt động</span>
              </label>
            </div>
          </div>

          {couponForm.applyTo === 'product' && (
            <div className="adm-input-group animate-fade">
              <label>Chọn các sản phẩm áp dụng</label>
              <select
                className="adm-input"
                multiple
                value={couponForm.productIds}
                onChange={handleCouponProductsChange}
                style={{ minHeight: '150px', padding: '12px' }}
              >
                {products.map((p) => (
                  <option key={p._id} value={p._id} style={{ padding: '6px' }}>
                    {p.name}
                  </option>
                ))}
              </select>
              <span className="adm-input-hint">Nhấn giữ Ctrl (hoặc Cmd) để chọn nhiều sản phẩm</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button className="adm-btn adm-btn-primary" onClick={handleSaveCoupon}>
              {editingCouponId ? 'Cập Nhật Coupon' : 'Tạo Coupon'}
            </button>
            {editingCouponId && (
              <button className="adm-btn adm-btn-secondary" onClick={handleCancelCouponEdit}>
                Hủy Bỏ
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="adm-card">
        <div className="adm-card-title">
          <h3>Danh Sách Mã Giảm Giá</h3>
        </div>

        <div className="adm-table-wrapper">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Kiểu Giảm</th>
                <th>Giá Trị</th>
                <th>Áp Dụng</th>
                <th>Đơn Tối Thiểu</th>
                <th>Hạn Sử Dụng</th>
                <th>Đã Dùng / Giới Hạn</th>
                <th>Trạng Thái</th>
                <th style={{ textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '30px' }}>
                    Chưa có mã giảm giá nào được tạo.
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon._id}>
                    <td style={{ fontWeight: '800', color: '#fff', letterSpacing: '0.05em' }}>
                      {coupon.code}
                    </td>
                    <td>{coupon.type === 'percent' ? 'Phần trăm' : 'Tiền mặt'}</td>
                    <td style={{ fontWeight: '700', color: '#fff' }}>
                      {coupon.type === 'percent' ? `${coupon.value}%` : `${coupon.value?.toLocaleString()}₫`}
                    </td>
                    <td>{coupon.applyTo === 'product' ? `Sản phẩm (${coupon.productIds?.length || 0})` : 'Toàn đơn'}</td>
                    <td>{coupon.minOrder ? `${coupon.minOrder.toLocaleString()}₫` : 'Không yêu cầu'}</td>
                    <td>
                      {coupon.expiredAt
                        ? new Date(coupon.expiredAt).toLocaleDateString('vi-VN')
                        : 'Vô thời hạn'}
                    </td>
                    <td style={{ fontWeight: '600' }}>
                      {coupon.used || 0} / {coupon.usageLimit > 0 ? coupon.usageLimit : '∞'}
                    </td>
                    <td>
                      <span className={`adm-badge ${coupon.isActive ? 'confirmed' : 'pending'}`}>
                        {coupon.isActive ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          className="adm-btn adm-btn-secondary adm-btn-small"
                          onClick={() => handleEditCoupon(coupon)}
                        >
                          Sửa
                        </button>
                        <button
                          className="adm-btn adm-btn-danger adm-btn-small"
                          onClick={() => handleDeleteCoupon(coupon._id)}
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

export default CouponsTab;
