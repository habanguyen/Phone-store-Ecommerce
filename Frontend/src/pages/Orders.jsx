import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import api from '../api.js';

const statusLabels = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã huỷ'
};

const statusClasses = {
  pending: 'status-badge pending',
  confirmed: 'status-badge confirmed',
  shipping: 'status-badge shipping',
  delivered: 'status-badge delivered',
  cancelled: 'status-badge cancelled'
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  const loadOrders = async () => {
    try {
      const { data } = await api.get('/user/orders/my');
      setOrders(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải đơn hàng');
    }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const getShortAddress = (address) => {
    if (!address) return 'Chưa có địa chỉ';
    return address.length > 60 ? `${address.slice(0, 60)}...` : address;
  };

  const getItemSummary = (order) => {
    const count = order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
    const firstItem = order.items?.[0]?.name || 'Sản phẩm';
    return `${firstItem}${order.items?.length > 1 ? ` và ${order.items.length - 1} sản phẩm khác` : ''} (${count} cái)`;
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role === 'admin') {
      navigate('/admin');
    }
  }, [user, navigate]);

  return (
    <section className="section">
      <h2>Lịch sử đơn hàng</h2>
      {error && <div className="alert">{error}</div>}
      {orders.length === 0 ? (
        <p>Bạn chưa có đơn hàng nào. Hãy mua sắm và theo dõi đơn hàng tại đây.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Đơn hàng</th>
              <th>Địa chỉ</th>
              <th>Trạng thái</th>
              <th>Tổng</th>
              <th>Ngày</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td>
                  <Link to={`/orders/${order._id}`} style={{ color: '#1f5fbf', textDecoration: 'underline' }}>
                    {order._id}
                  </Link>
                </td>
                <td>{getItemSummary(order)}</td>
                <td>{getShortAddress(order.shippingAddress)}</td>
                <td>
                  <span className={statusClasses[order.status] || 'status-badge'}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </td>
                <td>{order.finalPrice?.toLocaleString()}₫</td>
                <td>{formatDate(order.createdAt)}</td>
                <td>
                  <Link to={`/orders/${order._id}`} className="button secondary">
                    Xem chi tiết
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};

export default Orders;
