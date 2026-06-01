import { Link } from 'react-router-dom';

const Success = () => {
  return (
    <section className="section">
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <h1>Thanh toán thành công</h1>
        <p>Đơn hàng của bạn đã được tạo và đang chờ xử lý.</p>
        <Link to="/orders" className="button" style={{ marginTop: 24 }}>
          Xem đơn hàng
        </Link>
      </div>
    </section>
  );
};

export default Success;
