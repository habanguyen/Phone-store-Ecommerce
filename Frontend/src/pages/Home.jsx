import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api.js';

const getProductImage = (product) =>
  product.productImages?.[0]?.url || product.images?.[0] || product.thumbnail || 'https://via.placeholder.com/300';

const getProductCategory = (product) =>
  product.categoryRef?.name || product.category || 'Danh mục';

const getProductBrand = (product) =>
  product.brandRef?.name || product.brand || 'Thương hiệu';

const Home = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/products', { params: { keyword } });
      setProducts(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Fetch products failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const { data } = await api.get('/ai/recommendations', { params: { keyword } });
      setRecommendations(data.recommendations);
    } catch (err) {
      setError('Không thể tải gợi ý sản phẩm');
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchRecommendations();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(keyword.trim())}`);
    }
  };

  return (
    <div className="animate-fade">
      {/* Hero Banner */}
      <section className="hero">
        <div className="container">
          <h1 className="animate-slide">
            Chào mừng đến với Minh Khang Store
          </h1>
          <p className="animate-slide" style={{ animationDelay: '0.1s' }}>
            Nơi cung cấp điện thoại và tablet chính hãng với giá tốt nhất thị trường
          </p>
          <div className="animate-slide" style={{ animationDelay: '0.2s', marginTop: '16px' }}>
            <Link to="/products" className="btn btn-primary" style={{ fontSize: '16px', padding: '14px 28px' }}>
              Mua ngay <span style={{ marginLeft: '4px' }}>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section">
        <div className="container">
          <h2 style={{ justifyContent: 'center', marginBottom: '32px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 6h16M4 12h16M4 18h7"></path>
            </svg>
            Danh mục sản phẩm
          </h2>
          <div className="grid grid-3">
            <Link to="/products?category=Smartphone" className="card" style={{ textAlign: 'center', padding: '30px 20px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.3))' }}>📱</div>
              <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Điện thoại</h3>
              <p style={{ fontSize: '13px' }}>Smartphone các hãng hàng đầu</p>
            </Link>
            <Link to="/products?category=Tablet" className="card" style={{ textAlign: 'center', padding: '30px 20px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.3))' }}>💻</div>
              <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Tablet</h3>
              <p style={{ fontSize: '13px' }}>Máy tính bảng đa dụng</p>
            </Link>
            <Link to="/products?category=Accessory" className="card" style={{ textAlign: 'center', padding: '30px 20px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.3))' }}>🔌</div>
              <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Phụ kiện</h3>
              <p style={{ fontSize: '13px' }}>Ốp lưng, sạc nhanh, tai nghe</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section" style={{ borderTop: '1px solid var(--border-color)', background: 'linear-gradient(180deg, rgba(255,255,255,0.01) 0%, transparent 100%)' }}>
        <div className="container">
          <h2 style={{ justifyContent: 'center', marginBottom: '32px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
            Sản phẩm nổi bật
          </h2>
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '40px 0' }}>Đang tải sản phẩm...</p>
          ) : error ? (
            <p className="alert error" style={{ maxWidth: '600px', margin: '0 auto' }}>{error}</p>
          ) : (
            <div className="products-grid">
              {products.slice(0, 8).map((product) => (
                <div className="product-card" key={product._id}>
                  <div className="image-wrapper">
                    <img src={getProductImage(product)} alt={product.name} />
                  </div>
                  <div className="product-info">
                    <span className="product-brand">{getProductBrand(product)}</span>
                    <h4 className="product-title">{product.name}</h4>
                    <span className="product-meta">{getProductCategory(product)}</span>
                    <div className="product-price">
                      <span className="amount">
                        {product.variants?.[0]?.price ? `${product.variants[0].price.toLocaleString()}₫` : 'Liên hệ'}
                      </span>
                    </div>
                  </div>
                  <div className="product-actions">
                    <Link to={`/product/${product._id}`} className="btn-add">
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section className="section" style={{ borderTop: '1px solid var(--border-color)' }}>
          <div className="container">
            <h2 style={{ justifyContent: 'center', marginBottom: '32px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9.812 17.29a.587.587 0 0 0 .188.423l2.84 2.84c.11.11.26.17.42.17s.31-.06.42-.17l2.84-2.84a.587.587 0 0 0 .188-.423v-2.313m-6.896 0H16.8"></path>
                <path d="M12 2a5 5 0 0 1 5 5c0 2.95-2.28 4.75-4.1 6.1-.24.18-.4.43-.4.73v1.67h-1v-1.67c0-.3-.16-.55-.4-.73C9.28 11.75 7 9.95 7 7a5 5 0 0 1 5-5z"></path>
              </svg>
              Gợi ý dành riêng cho bạn
            </h2>
            <div className="products-grid">
              {recommendations.slice(0, 4).map((product) => (
                <div className="product-card" key={product._id}>
                  <div className="image-wrapper">
                    <img src={getProductImage(product)} alt={product.name} />
                  </div>
                  <div className="product-info">
                    <span className="product-brand">{getProductBrand(product)}</span>
                    <h4 className="product-title">{product.name}</h4>
                    <span className="product-meta">{getProductCategory(product)}</span>
                  </div>
                  <div className="product-actions">
                    <Link to={`/product/${product._id}`} className="btn-add">
                      Xem ngay
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
