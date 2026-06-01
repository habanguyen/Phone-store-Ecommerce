import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api.js';

const getProductImage = (product) =>
  product.productImages?.[0]?.url || product.images?.[0] || product.thumbnail || 'https://via.placeholder.com/300';

const getProductCategory = (product) =>
  product.categoryRef?.name || product.category || 'Danh mục';

const getProductBrand = (product) =>
  product.brandRef?.name || product.brand || 'Thương hiệu';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'name');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'asc');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');

      const { data } = await api.get('/products', {
        params: { keyword, category }
      });

      let sortedProducts = [...data];
      if (sortBy === 'price') {
        sortedProducts.sort((a, b) => {
          const aPrice = a.variants?.[0]?.price || 0;
          const bPrice = b.variants?.[0]?.price || 0;
          return sortOrder === 'asc' ? aPrice - bPrice : bPrice - aPrice;
        });
      } else {
        sortedProducts.sort((a, b) => {
          const nameA = a.name?.toLowerCase() || '';
          const nameB = b.name?.toLowerCase() || '';
          if (nameA < nameB) return sortOrder === 'asc' ? -1 : 1;
          if (nameA > nameB) return sortOrder === 'asc' ? 1 : -1;
          return 0;
        });
      }

      setProducts(sortedProducts);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [keyword, category, sortBy, sortOrder]);

  useEffect(() => {
    setSearchParams({
      ...(keyword ? { keyword } : {}),
      ...(category ? { category } : {}),
      sortBy,
      sortOrder
    });
  }, [keyword, category, sortBy, sortOrder, setSearchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({
      ...(keyword ? { keyword } : {}),
      ...(category ? { category } : {}),
      sortBy,
      sortOrder
    });
  };

  const categories = [
    { label: 'Tất cả danh mục', value: '' },
    { label: 'Điện thoại', value: 'Smartphone' },
    { label: 'Tablet', value: 'Tablet' },
    { label: 'Phụ kiện', value: 'Accessory' }
  ];

  return (
    <div className="animate-fade">
      {/* Page Header */}
      <section className="page-hero">
        <div className="container">
          <h1 className="animate-slide">Tất cả sản phẩm</h1>
          <p className="animate-slide" style={{ animationDelay: '0.1s' }}>
            Khám phá bộ sưu tập điện thoại và tablet của chúng tôi
          </p>
        </div>
      </section>

      {/* Filters and Search */}
      <section className="section">
        <div className="container">
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '20px',
            marginBottom: '30px',
            alignItems: 'center'
          }}>
            {/* Search */}
            <form onSubmit={handleSearch} style={{ flex: '1', minWidth: '280px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  className="input"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm..."
                  style={{ flex: '1' }}
                />
                <button className="btn btn-primary" type="submit" style={{ padding: '12px 20px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  Tìm kiếm
                </button>
              </div>
            </form>

            {/* Category Filter */}
            <select
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ minWidth: '180px' }}
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              className="input"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              style={{ minWidth: '180px' }}
            >
              <option value="name-asc">Tên A-Z</option>
              <option value="name-desc">Tên Z-A</option>
              <option value="price-asc">Giá thấp đến cao</option>
              <option value="price-desc">Giá cao đến thấp</option>
            </select>
          </div>

          {/* Results */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ color: 'var(--text-light)' }}>Đang tải sản phẩm...</p>
            </div>
          ) : error ? (
            <div className="alert error" style={{ maxWidth: '600px', margin: '0 auto' }}>
              {error}
            </div>
          ) : (
            <>
              <p style={{ marginBottom: '24px', color: 'var(--text-light)', fontSize: '15px' }}>
                Tìm thấy <strong>{products.length}</strong> sản phẩm
              </p>
              
              <div className="products-grid">
                {products.map((product) => (
                  <div className="product-card animate-fade" key={product._id}>
                    <div className="image-wrapper">
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                      />
                    </div>
                    <div className="product-info">
                      <span className="product-brand">{getProductBrand(product)}</span>
                      <h4 className="product-title">
                        {product.name}
                      </h4>
                      <span className="product-meta">
                        {getProductCategory(product)}
                      </span>
                      <div className="product-price">
                        <span className="amount">
                          {product.variants?.[0]?.price ?
                            `${product.variants[0].price.toLocaleString()}₫` :
                            'Liên hệ'
                          }
                        </span>
                      </div>
                    </div>
                    <div className="product-actions">
                      <Link
                        to={`/product/${product._id}`}
                        className="btn-add"
                      >
                        Xem chi tiết
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              
              {products.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 0', border: '1px dashed var(--border-color)', borderRadius: '12px', marginTop: '20px' }}>
                  <p style={{ color: 'var(--text-lighter)', fontSize: '15px' }}>Không tìm thấy sản phẩm nào phù hợp với bộ lọc.</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Products;