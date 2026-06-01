import { Link } from 'react-router-dom';

const Cancel = () => {
  return (
    <section className="section">
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <h1>Thanh toán bị hủy</h1>
        <p>Bạn có thể quay lại giỏ hàng để kiểm tra lại đơn hàng hoặc thử thanh toán lại.</p>
        <Link to="/cart" className="button" style={{ marginTop: 24 }}>
          Quay lại giỏ hàng
        </Link>
      </div>
    </section>
  );
};

export default Cancel;
