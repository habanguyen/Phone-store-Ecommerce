import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api.js';

const getProductImageList = (product) => {
  if (!product) return ['https://via.placeholder.com/500'];
  const urls = [];
  if (product.thumbnail) urls.push(product.thumbnail);
  if (product.images && Array.isArray(product.images)) {
    urls.push(...product.images);
  }
  if (product.productImages && Array.isArray(product.productImages)) {
    urls.push(...product.productImages.map((img) => img.url || img));
  }
  if (product.variants && Array.isArray(product.variants)) {
    product.variants.forEach((variant) => {
      if (variant.images && Array.isArray(variant.images)) {
        urls.push(...variant.images);
      }
    });
  }
  const uniqueUrls = [...new Set(urls)].filter(Boolean);
  return uniqueUrls.length > 0 ? uniqueUrls : ['https://via.placeholder.com/500'];
};

const getProductCategory = (product) =>
  product.categoryRef?.name || product.category || 'General';

const getProductBrand = (product) =>
  product.brandRef?.name || product.brand || 'Thương hiệu';

const getProductPrice = (product) =>
  product.variants?.[0]?.price || product.sale_price || product.base_price || 0;

const findVariant = (product, size, color) =>
  product.variants?.find((variant) => {
    const variantSize = variant?.size || variant?.storage || '';
    const variantColor = variant?.color || variant?.color_name || '';
    return variantSize === size && variantColor === color;
  });

const getVariantField = (variant) => ({
  sizeField: variant?.size ? 'size' : variant?.storage ? 'storage' : '',
  colorField: variant?.color ? 'color' : variant?.color_name ? 'color_name' : ''
});

const getVariantLabel = (field) => {
  if (field === 'storage') return 'Dung lượng';
  if (field === 'size') return 'Size';
  if (field === 'color_name' || field === 'color') return 'Màu sắc';
  return 'Lựa chọn';
};

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [sizeField, setSizeField] = useState('');
  const [colorField, setColorField] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const navigate = useNavigate();

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get(`/products/${id}`);
      if (!data) {
        setError('Không tìm thấy sản phẩm');
        setProduct(null);
        return;
      }
      setProduct(data);
      if (data.variants?.length > 0) {
        const { sizeField: sf, colorField: cf } = getVariantField(data.variants[0]);
        setSizeField(sf);
        setColorField(cf);
        setSelectedSize(data.variants[0]?.[sf] || '');
        setSelectedColor(data.variants[0]?.[cf] || '');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải sản phẩm');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
  }, [id]);

  useEffect(() => {
    if (product) {
      setSelectedImageIndex(0);
      fetchReviews();
    }
  }, [product]);

  useEffect(() => {
    const imageUrls = getProductImageList(product || {});
    if (selectedImageIndex >= imageUrls.length) {
      setSelectedImageIndex(Math.max(imageUrls.length - 1, 0));
    }
  }, [product, selectedImageIndex]);

  const fetchReviews = async () => {
    try {
      const { data } = await api.get(`/reviews/product/${id}`);
      setReviews(data.reviews || []);
      setAverageRating(data.averageRating || 0);
      setReviewCount(data.reviewCount || 0);
    } catch (err) {
      console.error('Could not load reviews:', err);
    }
  };

  const submitReview = async () => {
    try {
      setReviewMessage('');
      await api.post('/reviews', {
        productId: id,
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment
      });
      setReviewTitle('');
      setReviewComment('');
      setReviewRating(5);
      setReviewMessage('Cảm ơn bạn đã gửi đánh giá!');
      fetchReviews();
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setReviewMessage(err.response?.data?.message || 'Không thể gửi đánh giá.');
      }
    }
  };

  const handleAddToCart = async () => {
    try {
      await api.post('/cart', { productId: id, size: selectedSize, color: selectedColor, quantity });
      setMessage('Added to cart');
      setTimeout(() => setMessage(''), 2500);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setMessage(err.response?.data?.message || 'Error adding to cart');
      }
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <div className="alert" style={{ textAlign: 'center' }}>{error}</div>;
  if (!product) return <p>Không có dữ liệu sản phẩm.</p>;

  const imageUrls = getProductImageList(product);
  const selectedVariant = findVariant(product, selectedSize, selectedColor);
  const selectedPrice = selectedVariant?.price || getProductPrice(product);

  const showPrevious = imageUrls.length > 1 && selectedImageIndex > 0;
  const showNext = imageUrls.length > 1 && selectedImageIndex < imageUrls.length - 1;

  // Gather unique variants
  const uniqueSizes = product.variants?.length
    ? [...new Set(product.variants.map((v) => v[sizeField]).filter(Boolean))]
    : [];
  const uniqueColors = product.variants?.length
    ? [...new Set(product.variants.map((v) => v[colorField]).filter(Boolean))]
    : [];

  return (
    <div className="animate-fade">
      <section className="section" style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '40px', border: '1px solid var(--border-color)', marginBottom: '32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px' }}>
          {/* Image Slider */}
          <div>
            <div style={{ position: 'relative', textAlign: 'center', background: '#0A0A0C', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '360px' }}>
              <img
                src={imageUrls[selectedImageIndex]}
                alt={`${product.name} ${selectedImageIndex + 1}`}
                style={{ maxWidth: '100%', maxHeight: '420px', objectFit: 'contain', borderRadius: '8px' }}
              />
              {showPrevious && (
                <button
                  type="button"
                  onClick={() => setSelectedImageIndex((prev) => prev - 1)}
                  style={{
                    position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', cursor: 'pointer', borderRadius: '50%',
                    fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-color)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
                >
                  ‹
                </button>
              )}
              {showNext && (
                <button
                  type="button"
                  onClick={() => setSelectedImageIndex((prev) => prev + 1)}
                  style={{
                    position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', cursor: 'pointer', borderRadius: '50%',
                    fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-color)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
                >
                  ›
                </button>
              )}
            </div>
            {imageUrls.length > 1 && (
              <>
                <p style={{ marginTop: 12, textAlign: 'center', color: 'var(--text-light)', fontSize: '13px' }}>
                  Ảnh <strong>{selectedImageIndex + 1}</strong> trên {imageUrls.length}
                </p>
                <div style={{ display: 'flex', gap: 10, marginTop: 12, justifyContent: 'center', flexWrap: 'wrap', padding: '4px 0' }}>
                  {imageUrls.map((url, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedImageIndex(index)}
                      style={{
                        border: index === selectedImageIndex ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                        padding: '4px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: index === selectedImageIndex ? 'rgba(229,9,20,0.05)' : '#0A0A0C',
                        cursor: 'pointer',
                        width: 70,
                        height: 70,
                        flex: '0 0 auto',
                        transition: 'all 0.25s'
                      }}
                    >
                      <img
                        src={url}
                        alt={`${product.name} thumb ${index + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }}
                      />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Product Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <span className="product-brand" style={{ fontSize: '14px' }}>{getProductBrand(product)}</span>
              <h2 style={{ fontSize: '32px', fontWeight: '800', marginTop: '6px', marginBottom: '8px' }}>{product.name}</h2>
              <span className="badge" style={{ background: 'var(--secondary-color)', border: '1px solid var(--border-color)', color: 'var(--text-light)' }}>{getProductCategory(product)}</span>
            </div>

            <div style={{ background: '#0A0A0C', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-light)', marginBottom: '4px' }}>Giá sản phẩm:</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--primary-color)' }}>
                {selectedPrice.toLocaleString()}₫
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', fontSize: '14px', color: 'var(--text-light)' }}>
                <span style={{ color: '#FFD166' }}>★</span>
                <span><strong>{averageRating.toFixed(1)}</strong> / 5 ({reviewCount} đánh giá từ khách hàng)</span>
              </div>
            </div>

            <p style={{ color: 'var(--text-light)', fontSize: '15px', lineHeight: '1.7' }}>{product.description}</p>

            {/* Variant Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              {sizeField && uniqueSizes.length > 0 && (
                <div>
                  <span style={{ display: 'block', marginBottom: '10px', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-light)', letterSpacing: '0.05em' }}>
                    {getVariantLabel(sizeField)}
                  </span>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {uniqueSizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          setSelectedSize(size);
                          const compatible = product.variants.find((v) => v[sizeField] === size);
                          if (compatible && colorField) {
                            setSelectedColor(compatible[colorField]);
                          }
                        }}
                        style={{
                          padding: '10px 18px',
                          borderRadius: '8px',
                          border: selectedSize === size ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                          background: selectedSize === size ? 'rgba(229, 9, 20, 0.1)' : 'var(--secondary-color)',
                          color: selectedSize === size ? '#FFFFFF' : 'var(--text-light)',
                          fontWeight: '700',
                          fontSize: '13px',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {colorField && uniqueColors.length > 0 && (
                <div>
                  <span style={{ display: 'block', marginBottom: '10px', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-light)', letterSpacing: '0.05em' }}>
                    {getVariantLabel(colorField)}
                  </span>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {uniqueColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          setSelectedColor(color);
                          const compatible = product.variants.find((v) => v[colorField] === color);
                          if (compatible && sizeField) {
                            setSelectedSize(compatible[sizeField]);
                          }
                        }}
                        style={{
                          padding: '10px 18px',
                          borderRadius: '8px',
                          border: selectedColor === color ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                          background: selectedColor === color ? 'rgba(229, 9, 20, 0.1)' : 'var(--secondary-color)',
                          color: selectedColor === color ? '#FFFFFF' : 'var(--text-light)',
                          fontWeight: '700',
                          fontSize: '13px',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div>
                <span style={{ display: 'block', marginBottom: '10px', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-light)', letterSpacing: '0.05em' }}>
                  Số lượng
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    style={{
                      width: '40px', height: '40px', borderRadius: '8px', border: '1px solid var(--border-color)',
                      background: 'var(--secondary-color)', color: '#fff', fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                  >
                    -
                  </button>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    style={{ width: '60px', textAlign: 'center', padding: '10px', height: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => prev + 1)}
                    style={{
                      width: '40px', height: '40px', borderRadius: '8px', border: '1px solid var(--border-color)',
                      background: 'var(--secondary-color)', color: '#fff', fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button className="btn btn-primary" onClick={handleAddToCart} style={{ width: '100%', padding: '16px', fontSize: '16px', borderRadius: '10px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '8px' }}>
                  <circle cx="8" cy="21" r="1"></circle>
                  <circle cx="19" cy="21" r="1"></circle>
                  <path d="m2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
                </svg>
                Thêm vào giỏ hàng
              </button>
              {message && (
                <div className={`alert ${message.includes('Added') || message.includes('giỏ hàng') ? 'success' : 'error'}`} style={{ marginTop: '8px' }}>
                  {message}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Review Section */}
      <section className="section" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Đánh giá sản phẩm</h3>
          <span style={{ color: 'var(--text-light)', fontSize: '15px' }}><strong>{reviewCount}</strong> đánh giá</span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'start' }}>
          {/* Reviews List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {reviews.length ? (
              reviews.map((review) => (
                <div key={review._id} className="card" style={{ padding: '20px', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h5 style={{ fontSize: '15px', fontWeight: '700', margin: 0 }}>{review.title || 'Đánh giá chất lượng'}</h5>
                    <div style={{ color: '#FFD166', fontSize: '13px' }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} style={{ opacity: i < review.rating ? 1 : 0.2 }}>★</span>
                      ))}
                    </div>
                  </div>
                  <p style={{ color: 'var(--text-light)', fontSize: '14px', marginBottom: '12px' }}>{review.comment}</p>
                  <div style={{ fontSize: '12px', color: 'var(--text-lighter)' }}>
                    Bởi <strong>{review.user?.name || review.user?.email || 'Khách hàng'}</strong> | {new Date(review.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
                <p style={{ color: 'var(--text-light)' }}>Chưa có đánh giá nào cho sản phẩm này.</p>
              </div>
            )}
          </div>

          {/* Review Form */}
          <div className="form-card" style={{ maxWidth: '100%', margin: 0 }}>
            <h4 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px', color: '#FFFFFF' }}>Gửi đánh giá của bạn</h4>
            
            <div className="form-group">
              <label>Tiêu đề</label>
              <input
                className="input"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="Tiêu đề ngắn gọn"
              />
            </div>
            
            <div className="form-group">
              <label>Đánh giá (Số sao)</label>
              <select className="input" value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))}>
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value} style={{ background: 'var(--bg-card)', color: '#fff' }}>{value} sao</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Nội dung</label>
              <textarea
                className="input"
                rows={4}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Chia sẻ cảm nhận chi tiết của bạn về sản phẩm này..."
              />
            </div>
            
            <button className="btn btn-primary" onClick={submitReview} style={{ width: '100%', padding: '12px' }}>Gửi đánh giá</button>
            {reviewMessage && (
              <div className={`alert ${reviewMessage.includes('Cảm ơn') ? 'success' : 'error'}`} style={{ marginTop: '16px' }}>
                {reviewMessage}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProductDetail;
