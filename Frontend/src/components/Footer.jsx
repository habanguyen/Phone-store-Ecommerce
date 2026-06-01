const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>🏪 Minh Khang Store</h3>
            <p>Chuyên cung cấp điện thoại, tablet và phụ kiện chính hãng với giá cạnh tranh tốt nhất.</p>
            <ul style={{ marginTop: '12px', fontSize: '14px' }}>
              <li style={{ marginBottom: '6px' }}>📍 Cầu Nam Am, Nguyễn Bỉnh Khiêm, TP.HCM</li>
              <li style={{ marginBottom: '6px' }}>📞 Hotline: 1900 XXX XXX</li>
              <li style={{ marginBottom: '6px' }}>✉️ Email: support@minhkhang.com</li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>📋 Chính sách</h3>
            <ul>
              <li><a href="#">✓ Chính sách bảo hành</a></li>
              <li><a href="#">✓ Chính sách đổi trả</a></li>
              <li><a href="#">✓ Chính sách vận chuyển</a></li>
              <li><a href="#">✓ Chính sách bảo mật dữ liệu</a></li>
              <li><a href="#">✓ Điều khoản dịch vụ</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>🎯 Hỗ trợ khách hàng</h3>
            <ul>
              <li><a href="#">❓ Hướng dẫn mua hàng</a></li>
              <li><a href="#">💳 Hướng dẫn thanh toán</a></li>
              <li><a href="#">📦 Hướng dẫn giao hàng</a></li>
              <li><a href="#">💬 Chat trực tuyến</a></li>
              <li><a href="#">📧 Liên hệ với chúng tôi</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>🌐 Kết nối với chúng tôi</h3>
            <p style={{ fontSize: '14px', marginBottom: '12px' }}>Theo dõi tất cả cập nhật mới:</p>
            <div style={{ display: 'flex', gap: '14px', marginTop: '12px', fontSize: '20px' }}>
              <a href="#" title="Facebook" style={{ transition: 'transform 0.2s' }}>f</a>
              <a href="#" title="Instagram" style={{ transition: 'transform 0.2s' }}>📷</a>
              <a href="#" title="Twitter" style={{ transition: 'transform 0.2s' }}>𝕏</a>
              <a href="#" title="YouTube" style={{ transition: 'transform 0.2s' }}>▶</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2024 <strong>Minh Khang Store</strong> - Tất cả quyền được bảo lưu • Được hỗ trợ bởi Công nghệ hiện đại</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;