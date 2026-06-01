import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import api from '../api.js';

const Cart = () => {
  const [cart, setCart] = useState({ items: [] });
  const [error, setError] = useState('');
  const [quantities, setQuantities] = useState({});
  const navigate = useNavigate();

  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role === 'admin') {
      navigate('/admin');
    }
  }, [user, navigate]);

  const loadCart = async () => {
    try {
      const { data } = await api.get('/cart');
      setCart(data || { items: [] });
      // initialize local quantity inputs to avoid immediate API calls while typing
      const q = {};
      (data?.items || []).forEach((it) => { q[it._id] = it.quantity; });
      setQuantities(q);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load cart');
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const handleQuantityChange = async (itemId, quantity) => {
    // guard: ensure integer >= 1
    const q = Math.max(1, parseInt(quantity || 0, 10) || 1);
    try {
      const { data } = await api.put(`/cart/${itemId}`, { quantity: q });
      setCart(data);
      setQuantities((prev) => ({ ...prev, [itemId]: q }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update quantity');
    }
  };

  const handleRemove = async (itemId) => {
    try {
      const { data } = await api.delete(`/cart/${itemId}`);
      setCart(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove item');
    }
  };

  if (!cart) return <p>Loading...</p>;

  const totalPrice = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <section className="section">
      <h2>Your Cart</h2>
      {error && <div className="alert">{error}</div>}
      {cart.items.length === 0 ? (
        <p>No items in cart. <Link to="/">Browse products</Link>.</p>
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Variant</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {cart.items.map((item) => (
                <tr key={item._id}>
                  <td>{item.product?.name || 'Product'}</td>
                  <td>{item.size} / {item.color}</td>
                  <td>
                      <input
                        className="input"
                        type="number"
                        min="1"
                        value={quantities[item._id] ?? item.quantity}
                        onChange={(e) => setQuantities((prev) => ({ ...prev, [item._id]: e.target.value }))}
                        onBlur={(e) => handleQuantityChange(item._id, e.target.value)}
                      />
                  </td>
                  <td>{item.price?.toLocaleString()}₫</td>
                  <td>{(item.price * item.quantity)?.toLocaleString()}₫</td>
                  <td>
                    <button className="button secondary" onClick={() => handleRemove(item._id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>Total:</strong> {totalPrice.toLocaleString()}₫
            </div>
            <button className="button" onClick={() => navigate('/checkout')}>
              Checkout
            </button>
          </div>
        </>
      )}
    </section>
  );
};

export default Cart;
