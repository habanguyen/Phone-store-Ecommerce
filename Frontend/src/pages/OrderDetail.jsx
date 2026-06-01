import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../api.js';

const statusLabels = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy'
};

const paymentMethodLabels = {
  cod: 'Thanh toán khi nhận hàng',
  bank_transfer: 'Thanh toán chuyển khoản online',
  stripe: 'Visa quốc tế (Stripe)'
};

const bankInfo = {
  bankName: 'Ngân hàng MBank',
  accountNumber: '0338750266',
  accountName: 'Công ty Đào Lửa',
  branch: 'Chi nhánh Hà Nội'
};

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [message, setMessage] = useState('');
  const [polling, setPolling] = useState(false);

  const refreshOrderStatus = async () => {
    if (!order) return;
    try {
      const { data } = await api.get(`/user/orders/${order._id}`);
      setOrder(data);
      if (data.paymentStatus === 'paid') {
        setMessage('Thanh toán đã được xác nhận. Đơn hàng đang chờ admin xác nhận.');
        setPolling(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePaidClick = async () => {
    setError('');
    setMessage('Đang kiểm tra trạng thái thanh toán...');
    setPolling(true);
    await refreshOrderStatus();
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    setError('');
    setMessage('Đang huỷ đơn hàng...');
    try {
      const { data } = await api.put(`/user/orders/${order._id}/cancel`);
      setOrder(data);
      setMessage('Đơn hàng đã được hủy thành công.');
      setPolling(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể huỷ đơn hàng');
    }
  };

  useEffect(() => {
    if (!order || order.paymentStatus === 'paid' || !polling) return;
    const interval = setInterval(refreshOrderStatus, 10000);
    return () => clearInterval(interval);
  }, [order, polling]);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        setError('');
        const { data } = await api.get(`/user/orders/${id}`);
        setOrder(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Không tải được đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id]);

  const createQrPayment = async () => {
    if (!order) return;

    try {
      setError('');
      setMessage('Đang tạo mã QR thanh toán...');
      const { data } = await api.post(`/payments/checkout/${order._id}`);
      setPaymentUrl(data.url);
      setMessage('Quét mã QR hoặc mở trang thanh toán.');
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tạo mã QR thanh toán');
      setMessage('');
    }
  };

  const printInvoice = () => {
    if (!order) return;

    const printContent = document.getElementById('invoice');
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Hóa đơn #${order._id}</title>
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
    if (!order) return;
    const invoiceElement = document.getElementById('invoice');
    if (!invoiceElement) {
      setError('Không tìm thấy nội dung hóa đơn để xuất PDF.');
      return;
    }

    try {
      const canvas = await html2canvas(invoiceElement, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = pageWidth - 20;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      pdf.save(`invoice-${order._id}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      setError('Xuất PDF thất bại. Vui lòng thử lại.');
    }
  };

  const renderTimeline = (status) => {
    const steps = [
      { key: 'pending', label: 'Tiếp nhận đơn', icon: '📦' },
      { key: 'confirmed', label: 'Xác nhận đơn', icon: '✓' },
      { key: 'shipping', label: 'Đang giao', icon: '🚚' },
      { key: 'delivered', label: 'Hoàn tất', icon: '✓✓' }
    ];

    const activeIndex = steps.findIndex((step) => step.key === status);

    return (
      <div style={{ marginTop: 24 }}>
        <h3>Bản đồ hành trình</h3>
        <div style={{ padding: 24, background: 'white', borderRadius: 12, border: '1px solid #eee' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            {/* Timeline line */}
            <div
              style={{
                position: 'absolute',
                top: '24px',
                left: '0',
                right: '0',
                height: '2px',
                background: '#e0e0e0',
                zIndex: 1
              }}
            />
            {/* Active progress line */}
            {activeIndex >= 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '24px',
                  left: '0',
                  height: '2px',
                  background: '#10b981',
                  width: `${(activeIndex / (steps.length - 1)) * 100}%`,
                  zIndex: 1,
                  transition: 'width 0.3s ease'
                }}
              />
            )}

            {/* Step nodes */}
            {steps.map((step, index) => {
              const isActive = index <= activeIndex && status !== 'cancelled';
              const isCompleted = index < activeIndex && status !== 'cancelled';
              return (
                <div
                  key={step.key}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    zIndex: 2
                  }}
                >
                  {/* Circle node */}
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: isCompleted ? '#10b981' : isActive ? '#0ea5e9' : '#f0f0f0',
                      border: `3px solid ${isCompleted ? '#10b981' : isActive ? '#0ea5e9' : '#ddd'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isCompleted || isActive ? 'white' : '#999',
                      fontSize: 20,
                      fontWeight: 'bold',
                      marginBottom: 12
                    }}
                  >
                    {isCompleted ? '✓' : step.icon}
                  </div>
                  {/* Label */}
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: isActive ? '#0f4c81' : '#666',
                        marginBottom: 4
                      }}
                    >
                      {step.label}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: isCompleted ? '#10b981' : isActive ? '#0ea5e9' : '#999'
                      }}
                    >
                      {isCompleted ? 'Đã hoàn thành' : isActive ? 'Đang thực hiện' : 'Chưa đến'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {status === 'cancelled' && (
            <div
              style={{
                marginTop: 20,
                padding: 12,
                borderRadius: 10,
                background: '#fff1f0',
                border: '1px solid #ffccc7',
                textAlign: 'center',
                color: '#a8071a',
                fontWeight: 500
              }}
            >
              ❌ Đơn hàng bị huỷ
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <section className="section">
        <p>Đang tải chi tiết đơn hàng...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="section">
        <div className="alert">{error}</div>
        <Link to="/orders" className="button" style={{ marginTop: 16 }}>
          Quay lại đơn hàng
        </Link>
      </section>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <section className="section">
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <h2>Chi tiết đơn hàng</h2>
          <p>Mã đơn: <strong>{order._id}</strong></p>
        </div>
        <Link to="/orders" className="button secondary">
          Quay lại danh sách đơn hàng
        </Link>
      </div>

      {message && <div className="alert">{message}</div>}
      {error && <div className="alert">{error}</div>}

      <div style={{ display: 'grid', gap: 24 }}>
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 320px', padding: 20, border: '1px solid #eee', borderRadius: 12 }}>
              <h3>Thông tin đơn hàng</h3>
              {order.items?.length > 0 && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
                  <img
                    src={order.items[0].thumbnail || 'https://via.placeholder.com/80?text=No+Image'}
                    alt={order.items[0].name}
                    style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #ddd' }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: '#111' }}>
                      {order.items[0].name}
                    </div>
                    <div style={{ fontSize: 13, color: '#555' }}>
                      Số lượng: <strong>{order.items[0].quantity}</strong>
                    </div>
                    <div style={{ fontSize: 13, color: '#555' }}>
                      Giá: <strong>{order.items[0].price?.toLocaleString()}₫</strong>
                    </div>
                    {order.items.length > 1 && (
                      <div style={{ marginTop: 6, fontSize: 12, color: '#888' }}>
                        + {order.items.length - 1} sản phẩm khác
                      </div>
                    )}
                  </div>
                </div>
              )}
              <p>Trạng thái: <strong>{statusLabels[order.status] || order.status}</strong></p>
              <p>Phương thức thanh toán: <strong>{paymentMethodLabels[order.paymentMethod] || order.paymentMethod}</strong></p>
              <p>Thanh toán: <strong>{order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</strong></p>
              <p>Ngày đặt: <strong>{new Date(order.createdAt).toLocaleString()}</strong></p>
              <p>Địa chỉ giao hàng:</p>
              <p style={{ whiteSpace: 'pre-line' }}>{order.shippingAddress}</p>
            </div>

            <div style={{ flex: '1 1 320px', padding: 20, border: '1px solid #eee', borderRadius: 12 }}>
              <h3>Tóm tắt thanh toán</h3>
              <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span>Tạm tính</span>
                <strong>{order.totalPrice?.toLocaleString()}₫</strong>
              </div>
              <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span>Giảm giá</span>
                <strong>{order.discount?.toLocaleString() || 0}₫</strong>
              </div>
              <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span>Phí vận chuyển</span>
                <strong>{order.shippingFee?.toLocaleString() || 0}₫</strong>
              </div>
              <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span>Thuế</span>
                <strong>{order.tax?.toLocaleString() || 0}₫</strong>
              </div>
              <div style={{ borderTop: '1px solid #ddd', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                <span>Tổng thanh toán</span>
                <strong>{order.finalPrice?.toLocaleString()}₫</strong>
              </div>
            </div>
          </div>

          {renderTimeline(order.status)}

          <div style={{ padding: 20, border: '1px solid #eee', borderRadius: 12 }}>
            <h3>Danh sách sản phẩm</h3>
            <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
              {order.items.map((item) => (
                <div 
                  key={`${item.product}-${item.size}-${item.color}`}
                  style={{
                    display: 'flex',
                    gap: 16,
                    padding: 12,
                    border: '1px solid #f0f0f0',
                    borderRadius: 8,
                    background: '#fafafa',
                    alignItems: 'flex-start'
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{ flex: '0 0 100px' }}>
                    <img
                      src={item.thumbnail || 'https://via.placeholder.com/100?text=No+Image'}
                      alt={item.name}
                      style={{
                        width: '100px',
                        height: '100px',
                        objectFit: 'cover',
                        borderRadius: 6,
                        border: '1px solid #ddd'
                      }}
                    />
                  </div>

                  {/* Product Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: 16, color: '#1f2937' }}>
                      {item.name}
                    </h4>
                    
                    <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                      <div style={{ marginBottom: 4 }}>
                        <strong>Thuộc tính:</strong> {item.size || '-'} {item.size && item.color ? '/' : ''} {item.color || '-'}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
                      <div>
                        <span style={{ fontSize: 12, color: '#999' }}>Số lượng</span>
                        <div style={{ fontSize: 16, fontWeight: 600, color: '#1f5fbf' }}>
                          {item.quantity}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: 12, color: '#999' }}>Đơn giá</span>
                        <div style={{ fontSize: 16, fontWeight: 600 }}>
                          {item.price?.toLocaleString()}₫
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: 12, color: '#999' }}>Thành tiền</span>
                        <div style={{ fontSize: 16, fontWeight: 600, color: '#10b981' }}>
                          {(item.price * item.quantity)?.toLocaleString()}₫
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>


          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))' }}>
            {order.paymentMethod === 'stripe' && order.paymentStatus !== 'paid' && (
              <div style={{ padding: 20, border: '1px solid #eee', borderRadius: 12 }}>
                <h3>Thanh toán bằng QR</h3>
                <p>Đơn hàng chưa được thanh toán. Quét mã QR hoặc mở trang thanh toán để hoàn tất.</p>
                <button className="button" type="button" onClick={createQrPayment}>
                  Tạo mã QR thanh toán
                </button>
                {paymentUrl && (
                  <div style={{ marginTop: 18, textAlign: 'center' }}>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code?size=260x260&data=${encodeURIComponent(paymentUrl)}`}
                      alt="Mã QR thanh toán"
                      style={{ maxWidth: '100%', border: '1px solid #ddd', padding: 8, borderRadius: 12 }}
                    />
                    <div style={{ marginTop: 12 }}>
                      <a href={paymentUrl} target="_blank" rel="noreferrer" className="button">
                        Mở trang thanh toán
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {order.paymentMethod === 'bank_transfer' && order.paymentStatus !== 'paid' && (
              <div style={{ padding: 20, border: '1px solid #eee', borderRadius: 12, background: '#fbfbfb' }}>
                <h3>Thông tin chuyển khoản</h3>
                <p>Vui lòng chuyển khoản đúng số tiền bên dưới và ghi đúng mã đơn hàng.</p>
                <div style={{ marginTop: 12, textAlign: 'center' }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code?size=260x260&data=${encodeURIComponent(`Ngân hàng:${bankInfo.bankName};Số tài khoản:${bankInfo.accountNumber};Chủ tài khoản:${bankInfo.accountName};Chi nhánh:${bankInfo.branch};Số tiền:${order.finalPrice}₫;Mã đơn:${order._id}`)}`}
                    alt="QR chuyển khoản"
                    style={{ maxWidth: '100%', border: '1px solid #ddd', padding: 8, borderRadius: 12 }}
                  />
                </div>
                <div style={{ marginTop: 16 }}>
                  <div style={{ marginBottom: 8 }}><strong>Ngân hàng:</strong> {bankInfo.bankName}</div>
                  <div style={{ marginBottom: 8 }}><strong>Số tài khoản:</strong> {bankInfo.accountNumber}</div>
                  <div style={{ marginBottom: 8 }}><strong>Chủ tài khoản:</strong> {bankInfo.accountName}</div>
                  <div style={{ marginBottom: 8 }}><strong>Chi nhánh:</strong> {bankInfo.branch}</div>
                  <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: '#fff' }}>
                    <div><strong>Số tiền cần trả:</strong></div>
                    <div style={{ fontSize: 20, color: '#1f5fbf' }}>{order.finalPrice?.toLocaleString()}₫</div>
                    <div style={{ marginTop: 8 }}><strong>Mã đơn hàng:</strong> {order._id}</div>
                  </div>
                </div>
              </div>
            )}

            {['stripe', 'bank_transfer'].includes(order.paymentMethod) && order.paymentStatus !== 'paid' && order.status !== 'cancelled' && (
              <div style={{ padding: 20, border: '1px solid #eee', borderRadius: 12, background: '#fffbe6' }}>
                <h3>Hoàn tất thủ tục thanh toán</h3>
                <p>Nếu bạn đã thanh toán thành công, nhấn nút bên dưới để kiểm tra trạng thái thanh toán. Sau khi bấm, hệ thống sẽ tự động cập nhật.</p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
                  <button className="button" type="button" onClick={handlePaidClick} style={{ flex: '1 1 auto', minWidth: 160 }}>
                    ✓ Đã thanh toán
                  </button>
                  {order.status === 'pending' && order.paymentStatus !== 'paid' && (
                    <button className="button secondary" type="button" onClick={handleCancelOrder} style={{ flex: '1 1 auto', minWidth: 160, background: '#ff4d4f', color: 'white', border: 'none' }}>
                      ✕ Hủy đơn
                    </button>
                  )}
                </div>
                {polling && <p style={{ marginTop: 12 }}>⏳ Đang tự động kiểm tra trạng thái thanh toán...</p>}
              </div>
            )}

            {order.status === 'pending' && order.paymentStatus !== 'paid' && order.paymentMethod !== 'bank_transfer' && order.paymentMethod !== 'stripe' && (
              <div style={{ padding: 20, border: '1px solid #ffccc7', borderRadius: 12, background: '#fff1f0' }}>
                <h3>Hủy đơn hàng</h3>
                <p>Nếu bạn chưa hoàn tất thanh toán, bạn vẫn có thể hủy đơn.</p>
                <button className="button secondary" type="button" onClick={handleCancelOrder} style={{ background: '#ff4d4f', color: 'white', border: 'none' }}>
                  ✕ Hủy đơn hàng
                </button>
              </div>
            )}

            {order.paymentMethod === 'cod' && (
              <div style={{ padding: 20, border: '1px solid #eee', borderRadius: 12, background: '#f6ffed' }}>
                <h3>Thanh toán khi nhận hàng</h3>
                <p>Bạn sẽ thanh toán cho nhân viên giao hàng khi nhận sản phẩm.</p>
              </div>
            )}

            {(order.paymentStatus === 'paid' || order.status === 'delivered') && (
              <div id="invoice" style={{ width: '100%', maxWidth: 780, margin: '0 auto', padding: 18, border: '1px solid #ddd', borderRadius: 10, background: '#fff', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#0f4c81' }}>Cửa hàng Đào Lửa</div>
                    <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>Hóa đơn bán hàng điện tử</div>
                  </div>
                  <div style={{ minWidth: 180, textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: '#555' }}>Mã hoá đơn: <strong>{order._id}</strong></div>
                    <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>Ngày: <strong>{new Date(order.createdAt).toLocaleDateString()}</strong></div>
                    <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>Trạng thái: <strong>{statusLabels[order.status] || order.status}</strong></div>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr', marginBottom: 20 }}>
                  <div style={{ padding: 14, background: '#fbfcfe', borderRadius: 10, border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Thông tin khách hàng</div>
                    <div style={{ fontSize: 13, color: '#111' }}>{order.user?.name || order.user?.email || 'Khách hàng'}</div>
                    <div style={{ fontSize: 12, color: '#555', marginTop: 6 }}>{order.user?.email || 'Không có email'}</div>
                    <div style={{ fontSize: 12, color: '#555', marginTop: 10, whiteSpace: 'pre-line' }}>{order.shippingAddress}</div>
                  </div>
                  <div style={{ padding: 14, background: '#fbfcfe', borderRadius: 10, border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Thông tin đơn hàng</div>
                    <div style={{ fontSize: 12, color: '#333' }}>Thanh toán: <strong>{paymentMethodLabels[order.paymentMethod] || order.paymentMethod}</strong></div>
                    <div style={{ fontSize: 12, color: '#333', marginTop: 6 }}>TT thanh toán: <strong>{order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</strong></div>
                    <div style={{ fontSize: 12, color: '#333', marginTop: 6 }}>Ghi chú: <strong>{order.note || 'Không có'}</strong></div>
                  </div>
                </div>

                <div style={{ overflowX: 'auto', marginBottom: 20 }}>
                  <table className="table" style={{ width: '100%', minWidth: 620, borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#f5f7fb' }}>
                        <th style={{ padding: 10, textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Sản phẩm</th>
                        <th style={{ padding: 10, textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Thuộc tính</th>
                        <th style={{ padding: 10, textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Số lượng</th>
                        <th style={{ padding: 10, textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Đơn giá</th>
                        <th style={{ padding: 10, textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr key={`${item.product}-${item.size}-${item.color}`} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: 10, verticalAlign: 'top' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <img src={item.thumbnail || 'https://via.placeholder.com/50?text=No+Image'} alt={item.name} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 6, border: '1px solid #ddd' }} />
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: 10, verticalAlign: 'top' }}>{item.size || '-'}{item.size && item.color ? ' / ' : ''}{item.color || '-'}</td>
                          <td style={{ padding: 10, textAlign: 'center', verticalAlign: 'top' }}>{item.quantity}</td>
                          <td style={{ padding: 10, textAlign: 'right', verticalAlign: 'top' }}>{item.price?.toLocaleString()}₫</td>
                          <td style={{ padding: 10, textAlign: 'right', verticalAlign: 'top', fontWeight: 700, color: '#10b981' }}>{(item.price * item.quantity)?.toLocaleString()}₫</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                  <div style={{ width: 300, border: '1px solid #e5e7eb', borderRadius: 10, padding: 14, background: '#fbfcfe' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 12 }}>Tạm tính</span>
                      <strong style={{ fontSize: 12 }}>{order.totalPrice?.toLocaleString()}₫</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 12 }}>Giảm giá</span>
                      <strong style={{ fontSize: 12 }}>{order.discount?.toLocaleString() || 0}₫</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 12 }}>Phí vận chuyển</span>
                      <strong style={{ fontSize: 12 }}>{order.shippingFee?.toLocaleString() || 0}₫</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 12 }}>Thuế</span>
                      <strong style={{ fontSize: 12 }}>{order.tax?.toLocaleString() || 0}₫</strong>
                    </div>
                    <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                      <span style={{ fontSize: 13 }}>Tổng thanh toán</span>
                      <strong style={{ fontSize: 13 }}>{order.finalPrice?.toLocaleString()}₫</strong>
                    </div>
                  </div>
                </div>

                <div style={{ paddingTop: 14, borderTop: '1px solid #e5e7eb', color: '#555', fontSize: 12, display: 'grid', gap: 4 }}>
                  <div><strong>Liên hệ:</strong> Hotline 0338750266 | Email support@daolua.com</div>
                  <div><strong>Thanh toán:</strong> Chuyển khoản hoặc khi nhận hàng theo phương thức đơn.</div>
                  <div><strong>Bảo hành:</strong> Sản phẩm bảo hành 12 tháng theo chính sách cửa hàng.</div>
                </div>
              </div>
            )}

            {order.status === 'delivered' && (
              <div style={{ padding: 20, border: '2px solid #10b981', borderRadius: 12, background: '#f0fdf4' }}>
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
        </div>
      </div>
    </section>
  );
};

export default OrderDetail;
