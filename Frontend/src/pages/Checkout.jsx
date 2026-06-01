import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../api.js';
import provincesData from '../data/tinh_tp.json';
import districtsData from '../data/quan_huyen.json';
import wardsData from '../data/xa_phuong.json';

const statusLabels = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy'
};

const Checkout = () => {
  const [cart, setCart] = useState({ items: [] });
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [ward, setWard] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [coupon, setCoupon] = useState('');
  const [couponResponse, setCouponResponse] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [createdOrder, setCreatedOrder] = useState(null);
  const [polling, setPolling] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role === 'admin') {
      navigate('/admin');
    }
  }, [user, navigate]);

  const bankQrText = createdOrder
    ? `Ngân hàng:${'MBank'};Số tài khoản:${'0338750266'};Chủ tài khoản:${'Công ty Đào Lửa'};Chi nhánh:${'Hà Nội'};Số tiền:${createdOrder.finalPrice}₫;Mã đơn:${createdOrder._id}`
    : '';

  const refreshCreatedOrderStatus = async () => {
    if (!createdOrder) return;
    try {
      const { data } = await api.get(`/user/orders/${createdOrder._id}`);
      setCreatedOrder(data);
      if (data.paymentStatus === 'paid') {
        setMessage('Thanh toán đã được xác nhận. Đơn hàng đang chờ xác nhận admin.');
        setPolling(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePaidClick = async () => {
    if (!createdOrder) return;
    setError('');
    setMessage('Đang kiểm tra trạng thái thanh toán...');
    setPolling(true);
    await refreshCreatedOrderStatus();
  };

  const handleCancelOrder = async () => {
    if (!createdOrder) return;
    setError('');
    setMessage('Đang huỷ đơn hàng...');
    try {
      const { data } = await api.put(`/user/orders/${createdOrder._id}/cancel`);
      setCreatedOrder(data);
      setMessage('Đơn hàng đã được hủy thành công.');
      setPolling(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể huỷ đơn hàng');
    }
  };

  const printInvoice = () => {
    if (!createdOrder) return;

    const printContent = document.getElementById('invoice');
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Hóa đơn #${createdOrder._id}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; color: #111827; background: #fff; }
            #invoice { width: 100%; max-width: 780px; margin: 0 auto; }
            .invoice-title { font-size: 28px; font-weight: 900; color: #0f4c81; text-align: center; margin-bottom: 6px; }
            .invoice-subtitle { font-size: 12px; text-transform: uppercase; letter-spacing: 0.18em; color: #64748b; text-align: center; margin-bottom: 18px; }
            .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 22px; font-size: 12px; }
            .invoice-table th, .invoice-table td { padding: 10px; border: 1px solid #dbeafe; }
            .invoice-table th { background: #eff6ff; color: #0f172a; font-weight: 700; text-align: left; }
            .invoice-table td { color: #334155; vertical-align: top; }
            .summary-box { display: flex; justify-content: flex-end; }
            .summary-card { width: 320px; padding: 16px; border-radius: 12px; background: #f8fafc; border: 1px solid #cbd5e1; }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; color: #334155; font-size: 12px; }
            .summary-row.total { font-size: 14px; font-weight: 800; color: #0f172a; border-top: 1px solid #cbd5e1; padding-top: 10px; margin-top: 10px; }
            .invoice-note { margin-top: 18px; font-size: 12px; color: #475569; line-height: 1.6; }
            .invoice-info-box { padding: 14px; border-radius: 14px; background: #f8fafc; border: 1px solid #e2e8f0; }
            .invoice-info-title { font-size: 13px; font-weight: 700; margin-bottom: 10px; color: #0f172a; }
            .invoice-info-text { font-size: 12px; color: #334155; line-height: 1.6; }
            .invoice-small { font-size: 12px; color: #64748b; }
            img { max-width: 100%; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const exportInvoicePdf = async () => {
    if (!createdOrder) return;
    const invoiceElement = document.getElementById('invoice');
    if (!invoiceElement) return;

    const canvas = await html2canvas(invoiceElement, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = pageWidth - 20;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
    let position = 10;

    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    pdf.save(`invoice-${createdOrder._id}.pdf`);
  };

  useEffect(() => {
    if (!createdOrder || createdOrder.paymentStatus === 'paid' || !polling) return;
    const interval = setInterval(refreshCreatedOrderStatus, 10000);
    return () => clearInterval(interval);
  }, [createdOrder, polling]);

  const provinces = useMemo(() => Object.values(provincesData), []);
  const districts = useMemo(
    () => province ? Object.values(districtsData).filter((item) => item.parent_code === province) : [],
    [province]
  );
  const wards = useMemo(
    () => district ? Object.values(wardsData).filter((item) => item.parent_code === district) : [],
    [district]
  );

  const subtotal = cart.items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
  const shippingFee = province ? 30000 : 0;
  const discount = couponResponse?.discount || 0;
  const tax = Math.round((subtotal - discount + shippingFee) * 0.1);
  const total = subtotal - discount + shippingFee + tax;

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const { data } = await api.get('/cart');
      setCart(data || { items: [] });
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được giỏ hàng');
    }
  };

  const handleApplyCoupon = async () => {
    if (!coupon) {
      setCouponError('Nhập mã giảm giá trước khi áp dụng.');
      return;
    }

    setApplyingCoupon(true);
    setCouponError('');
    setCouponResponse(null);

    try {
      const { data } = await api.post('/coupons/validate', {
        code: coupon,
        totalPrice: subtotal,
        items: cart.items.map((item) => ({
          product: item.product?._id || item.product,
          price: item.price,
          quantity: item.quantity
        }))
      });
      setCouponResponse({ code: coupon.toUpperCase(), discount: data.discount });
      setCouponError('');
      setMessage('Mã giảm giá đã áp dụng.');
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Mã giảm giá không hợp lệ');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponResponse(null);
    setCoupon('');
    setMessage('Mã giảm giá đã được gỡ.');
    setCouponError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!fullName || !phone || !province || !district || !ward || !detailAddress) {
      setError('Vui lòng điền đầy đủ thông tin giao hàng.');
      return;
    }

    const provinceLabel = provinces.find((item) => item.code === province)?.name_with_type || '';
    const districtLabel = districts.find((item) => item.code === district)?.name_with_type || '';
    const wardLabel = wards.find((item) => item.code === ward)?.name_with_type || '';
    const shippingAddress = `${fullName}, ${phone}, ${detailAddress}, ${wardLabel}, ${districtLabel}, ${provinceLabel}`;

    setLoading(true);

    try {
      setPaymentUrl('');
      setCreatedOrder(null);
      const { data: order } = await api.post('/user/orders', {
        shippingAddress,
        couponCode: couponResponse?.code || undefined,
        shippingFee,
        tax,
        paymentMethod
      });

      setCreatedOrder(order);

      if (paymentMethod === 'stripe') {
        const { data: paymentResult } = await api.post(`/payments/checkout/${order._id}`);
        setPaymentUrl(paymentResult.url);
        setMessage('Đơn hàng đã được tạo. Quét mã QR hoặc mở trang thanh toán để hoàn tất.');
      } else if (paymentMethod === 'bank_transfer') {
        setMessage('Đơn hàng đã được tạo. Vui lòng chuyển khoản theo thông tin bên dưới.');
      } else {
        setMessage('Đơn hàng đã được tạo. Bạn sẽ thanh toán khi nhận hàng.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Thanh toán thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section">
      <div style={{ marginBottom: 24 }}>
        <h1>Thanh toán</h1>
      </div>

      {message && <div className="alert">{message}</div>}
      {error && <div className="alert">{error}</div>}
      {couponError && <div className="alert">{couponError}</div>}

      <div className="checkout-layout">
        <div className="checkout-card">
          <h3>Thông tin giao hàng</h3>
          <div className="checkout-field">
            <label>Họ và tên</label>
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nhập họ và tên" />
          </div>

          <div className="checkout-field">
            <label>Số điện thoại</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Nhập số điện thoại" />
          </div>

          <div className="checkout-row">
            <div className="checkout-field">
              <label>Tỉnh / Thành phố</label>
              <select className="input" value={province} onChange={(e) => { setProvince(e.target.value); setDistrict(''); setWard(''); }}>
                <option value="">Chọn tỉnh/thành</option>
                {provinces.map((item) => (
                  <option key={item.code} value={item.code}>{item.name_with_type}</option>
                ))}
              </select>
            </div>
            <div className="checkout-field">
              <label>Quận / Huyện</label>
              <select className="input" value={district} onChange={(e) => { setDistrict(e.target.value); setWard(''); }} disabled={!province}>
                <option value="">Chọn quận/huyện</option>
                {districts.map((item) => (
                  <option key={item.code} value={item.code}>{item.name_with_type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="checkout-field">
            <label>Xã / Phường</label>
            <select className="input" value={ward} onChange={(e) => setWard(e.target.value)} disabled={!district}>
              <option value="">Chọn xã/phường</option>
              {wards.map((item) => (
                <option key={item.code} value={item.code}>{item.name_with_type}</option>
              ))}
            </select>
          </div>

          <div className="checkout-field">
            <label>Địa chỉ chi tiết</label>
            <input className="input" value={detailAddress} onChange={(e) => setDetailAddress(e.target.value)} placeholder="Số nhà, ngõ, tên đường" />
          </div>

          <div className="checkout-row" style={{ alignItems: 'flex-end' }}>
            <div className="checkout-field" style={{ marginBottom: 0, flex: 1 }}>
              <label>Phương thức thanh toán</label>
              <div style={{ display: 'grid', gap: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  Thanh toán khi nhận hàng
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank_transfer"
                    checked={paymentMethod === 'bank_transfer'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  Thanh toán chuyển khoản online
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="stripe"
                    checked={paymentMethod === 'stripe'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  Thanh toán Visa quốc tế (Stripe)
                </label>
              </div>
            </div>

          {couponResponse && (
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: 10, borderRadius: 8, background: '#f0fdf4', border: '1px solid #d1fae5' }}>
                <strong>Mã đã áp dụng:</strong> {couponResponse.code} — Giảm {couponResponse.discount?.toLocaleString() || 0}₫
              </div>
              <button className="button secondary" type="button" onClick={handleRemoveCoupon} style={{ background: '#fff', color: '#111' }}>
                Xóa mã
              </button>
            </div>
          )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                className="input"
                placeholder="Mã giảm giá"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                style={{ minWidth: 160 }}
              />
              <button
              type="button"
              className="button secondary"
              style={{ maxWidth: 120, marginTop: 24 }}
              onClick={handleApplyCoupon}
              disabled={applyingCoupon || !coupon || subtotal === 0}
            >
              Áp dụng
            </button>
            </div>
          </div>

          <button className="button" type="button" onClick={handleSubmit} disabled={loading || cart.items.length === 0}>
            Đặt hàng và thanh toán
          </button>

          {paymentUrl && (
            <div style={{ marginTop: 24, padding: 20, border: '1px solid #ddd', borderRadius: 12, background: '#fbfbfb' }}>
              <h3>Thanh toán bằng mã QR</h3>
              <p>Quét mã QR để thanh toán hoặc nhấn nút bên dưới để mở trang thanh toán.</p>
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code?size=250x250&data=${encodeURIComponent(paymentUrl)}`}
                  alt="QR thanh toán"
                  style={{ maxWidth: '100%', border: '1px solid #ddd', borderRadius: 12, padding: 8 }}
                />
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <a href={paymentUrl} target="_blank" rel="noreferrer" className="button">
                  Mở trang thanh toán
                </a>
                <span style={{ alignSelf: 'center', color: '#555' }}>Hoặc quét mã QR bằng điện thoại của bạn.</span>
              </div>
            </div>
          )}

          {createdOrder && ['stripe', 'bank_transfer'].includes(createdOrder.paymentMethod) && createdOrder.paymentStatus !== 'paid' && createdOrder.status !== 'cancelled' && (
            <div style={{ marginTop: 24, padding: 20, border: '1px solid #ddd', borderRadius: 12, background: '#fffbe6' }}>
              <h3>Hoàn tất thủ tục thanh toán</h3>
              <p>Nếu bạn đã hoàn tất thanh toán, nhấn nút bên dưới để kiểm tra trạng thái. Hệ thống sẽ tự động làm mới sau khi bạn chọn xong.</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
                <button className="button" type="button" onClick={handlePaidClick} style={{ flex: '1 1 auto', minWidth: 160 }}>
                  ✓ Đã thanh toán
                </button>
                {createdOrder.status === 'pending' && createdOrder.paymentStatus !== 'paid' && (
                  <button className="button secondary" type="button" onClick={handleCancelOrder} style={{ flex: '1 1 auto', minWidth: 160, background: '#ff4d4f', color: 'white', border: 'none' }}>
                    ✕ Hủy đơn
                  </button>
                )}
              </div>
              {polling && <p style={{ marginTop: 12 }}>⏳ Đang tự động kiểm tra trạng thái thanh toán...</p>}
            </div>
          )}

          {createdOrder && createdOrder.status === 'pending' && createdOrder.paymentStatus !== 'paid' && createdOrder.paymentMethod !== 'bank_transfer' && createdOrder.paymentMethod !== 'stripe' && (
            <div style={{ marginTop: 24, padding: 20, border: '1px solid #ffccc7', borderRadius: 12, background: '#fff1f0' }}>
              <h3>Hủy đơn hàng</h3>
              <p>Nếu bạn chưa hoàn tất thanh toán, bạn có thể hủy đơn hàng tại đây.</p>
              <button className="button secondary" type="button" onClick={handleCancelOrder} style={{ background: '#ff4d4f', color: 'white', border: 'none' }}>
                ✕ Hủy đơn hàng
              </button>
            </div>
          )}

          {createdOrder && createdOrder.paymentMethod === 'bank_transfer' && (
            <div style={{ marginTop: 24, padding: 20, border: '1px solid #ddd', borderRadius: 12, background: '#fbfbfb' }}>
              <h3>Thanh toán chuyển khoản</h3>
              <p>Vui lòng chuyển khoản đúng số tiền sau và ghi chú mã đơn hàng.</p>
              <div style={{ marginTop: 12, textAlign: 'center' }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code?size=260x260&data=${encodeURIComponent(bankQrText)}`}
                  alt="QR chuyển khoản"
                  style={{ maxWidth: '100%', border: '1px solid #ddd', borderRadius: 12, padding: 8 }}
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <div style={{ marginBottom: 8 }}><strong>Ngân hàng:</strong> MBank</div>
                <div style={{ marginBottom: 8 }}><strong>Số tài khoản:</strong> 0338750266</div>
                <div style={{ marginBottom: 8 }}><strong>Chủ tài khoản:</strong> Công ty Đào Lửa</div>
                <div style={{ marginBottom: 8 }}><strong>Chi nhánh:</strong> Hà Nội</div>
                <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: '#fff' }}>
                  <div><strong>Số tiền cần chuyển:</strong></div>
                  <div style={{ fontSize: 20, color: '#1f5fbf' }}>{createdOrder.finalPrice?.toLocaleString()}₫</div>
                  <div style={{ marginTop: 8 }}><strong>Mã đơn hàng:</strong> {createdOrder._id}</div>
                </div>
              </div>
            </div>
          )}

          {createdOrder && createdOrder.paymentMethod === 'cod' && (
            <div style={{ marginTop: 24, padding: 20, border: '1px solid #ddd', borderRadius: 12, background: '#f6ffed' }}>
              <h3>Thanh toán khi nhận hàng</h3>
              <p>Đơn hàng của bạn đã được tạo. Nhân viên giao hàng sẽ thu tiền khi giao sản phẩm.</p>
            </div>
          )}

          {createdOrder && createdOrder.paymentStatus === 'paid' && (
            <div id="invoice" style={{ width: '100%', maxWidth: 780, margin: '0 auto', padding: 22, border: '1px solid #d1d5db', borderRadius: 14, background: '#ffffff', boxSizing: 'border-box', color: '#111827' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ minWidth: 220 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0f4c81' }}>CỬA HÀNG ĐÀO LỬA</div>
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 6 }}>Địa chỉ: 123 Lê Lợi, Hà Nội</div>
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>Hotline: 0338750266 | Email: support@daolua.com</div>
                </div>
                <div style={{ minWidth: 220, textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Mã hóa đơn</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{createdOrder._id}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 10 }}>Ngày lập</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{new Date(createdOrder.createdAt).toLocaleDateString()}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 10 }}>Trạng thái</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{statusLabels[createdOrder.status] || createdOrder.status}</div>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#0f4c81', letterSpacing: 1.2 }}>HÓA ĐƠN</div>
                <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.4, color: '#64748b', marginTop: 6 }}>Hóa đơn bán hàng điện tử</div>
              </div>

              <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr', marginBottom: 22 }}>
                <div style={{ padding: 14, borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: '#0f172a' }}>Thông tin khách hàng</div>
                  <div style={{ fontSize: 12, color: '#334155' }}>{createdOrder.user?.name || createdOrder.user?.email || 'Khách hàng'}</div>
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 6 }}>{createdOrder.user?.email || 'Không có email'}</div>
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 10, whiteSpace: 'pre-line' }}>{createdOrder.shippingAddress}</div>
                </div>
                <div style={{ padding: 14, borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: '#0f172a' }}>Thông tin đơn hàng</div>
                  <div style={{ fontSize: 12, color: '#334155', marginBottom: 6 }}>Phương thức: <strong>{createdOrder.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : createdOrder.paymentMethod === 'bank_transfer' ? 'Thanh toán chuyển khoản online' : 'Visa quốc tế (Stripe)'}</strong></div>
                  <div style={{ fontSize: 12, color: '#334155', marginBottom: 6 }}>TT thanh toán: <strong>{createdOrder.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</strong></div>
                  <div style={{ fontSize: 12, color: '#334155' }}>Ghi chú: <strong>{createdOrder.note || 'Không có'}</strong></div>
                </div>
              </div>

              <div style={{ overflowX: 'auto', marginBottom: 22 }}>
                <table className="invoice-table" style={{ width: '100%', minWidth: 620, borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#eff6ff' }}>
                      <th style={{ padding: 10, textAlign: 'left', border: '1px solid #dbeafe' }}>Sản phẩm</th>
                      <th style={{ padding: 10, textAlign: 'left', border: '1px solid #dbeafe' }}>Thuộc tính</th>
                      <th style={{ padding: 10, textAlign: 'center', border: '1px solid #dbeafe' }}>SL</th>
                      <th style={{ padding: 10, textAlign: 'right', border: '1px solid #dbeafe' }}>Đơn giá</th>
                      <th style={{ padding: 10, textAlign: 'right', border: '1px solid #dbeafe' }}>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {createdOrder.items.map((item) => (
                      <tr key={`${item.product}-${item.size}-${item.color}`} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: 10, verticalAlign: 'top' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <img src={item.thumbnail || 'https://via.placeholder.com/50?text=No+Image'} alt={item.name} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8, border: '1px solid #d1d5db' }} />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{item.name}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: 10, verticalAlign: 'top', color: '#334155' }}>{item.size || '-'}{item.size && item.color ? ' / ' : ''}{item.color || '-'}</td>
                        <td style={{ padding: 10, textAlign: 'center', verticalAlign: 'top', color: '#334155' }}>{item.quantity}</td>
                        <td style={{ padding: 10, textAlign: 'right', verticalAlign: 'top', color: '#334155' }}>{item.price?.toLocaleString()}₫</td>
                        <td style={{ padding: 10, textAlign: 'right', verticalAlign: 'top', fontWeight: 700, color: '#0f4c81' }}>{(item.price * item.quantity)?.toLocaleString()}₫</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 22 }}>
                <div style={{ width: 320, padding: 16, borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 12, color: '#334155' }}>
                    <span>Tạm tính</span>
                    <strong>{createdOrder.totalPrice?.toLocaleString()}₫</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 12, color: '#334155' }}>
                    <span>Giảm giá</span>
                    <strong>{createdOrder.discount?.toLocaleString() || 0}₫</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 12, color: '#334155' }}>
                    <span>Phí vận chuyển</span>
                    <strong>{createdOrder.shippingFee?.toLocaleString() || 0}₫</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 12, color: '#334155' }}>
                    <span>Thuế</span>
                    <strong>{createdOrder.tax?.toLocaleString() || 0}₫</strong>
                  </div>
                  <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                    <span>Tổng thanh toán</span>
                    <strong>{createdOrder.finalPrice?.toLocaleString()}₫</strong>
                  </div>
                </div>
              </div>

              <div style={{ paddingTop: 14, borderTop: '1px solid #e5e7eb', color: '#475569', fontSize: 12, display: 'grid', gap: 4 }}>
                <div><strong>Liên hệ:</strong> Hotline 0338750266 | Email support@daolua.com</div>
                <div><strong>Bảo hành:</strong> Sản phẩm bảo hành 12 tháng theo chính sách cửa hàng.</div>
                <div><strong>Ghi chú:</strong> Vui lòng giữ hóa đơn để đối chiếu khi cần.</div>
              </div>
            </div>
          )}

          {createdOrder && createdOrder.status === 'delivered' && (
            <div style={{ marginTop: 24, padding: 20, border: '2px solid #10b981', borderRadius: 12, background: '#f0fdf4' }}>
              <h3 style={{ color: '#10b981' }}>📄 Xuất hóa đơn điện tử</h3>
              <p style={{ color: '#555' }}>Đơn hàng đã hoàn thành. Bạn có thể tải, in hoặc lưu hóa đơn để có lịch sử mua hàng.</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
                <button className="button" type="button" onClick={exportInvoicePdf} style={{ flex: '1 1 auto', minWidth: 140, background: '#10b981' }}>
                  💾 Tải PDF
                </button>
                <button className="button" type="button" onClick={printInvoice} style={{ flex: '1 1 auto', minWidth: 140 }}>
                  🖨️ In hóa đơn
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="summary-card">
          <h3>Tóm tắt đơn hàng</h3>
          <div style={{ marginBottom: 12, color: '#555' }}>
            {cart.items.length} sản phẩm trong đơn hàng
          </div>
          <div className="order-summary">
            {cart.items.map((item) => (
              <div key={item._id} className="summary-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <strong>{item.product?.name || 'Sản phẩm'}</strong>
                  <span>{item.price?.toLocaleString()}₫</span>
                </div>
                <div style={{ fontSize: 14, color: '#666', margin: '6px 0' }}>
                  Thuộc tính: {item.size || '-'} / {item.color || '-'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#444' }}>
                  <span>Số lượng:</span>
                  <span>{item.quantity}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #eaeaea', paddingTop: 16, marginTop: 16 }}>
            <div className="summary-row">
              <span>Tạm tính:</span>
              <span>{subtotal.toLocaleString()}₫</span>
            </div>
            <div className="summary-row">
              <span>Giảm giá:</span>
              <span>{discount > 0 ? `- ${discount.toLocaleString()}₫` : '0₫'}</span>
            </div>
            <div className="summary-row">
              <span>Phí vận chuyển:</span>
              <span>{province ? `${shippingFee.toLocaleString()}₫` : 'Chưa chọn tỉnh'}</span>
            </div>
            <div className="summary-row">
              <span>Thuế VAT:</span>
              <span>{subtotal > 0 ? `${tax.toLocaleString()}₫` : '0₫'}</span>
            </div>
            <div className="summary-total">
              <span>Thành tiền:</span>
              <span>{total.toLocaleString()}₫</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Checkout;
