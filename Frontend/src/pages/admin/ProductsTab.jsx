import React, { useState } from 'react';

const ProductsTab = ({
  products,
  exportProducts,
  editingProductId,
  productForm,
  setProductForm,
  brands,
  categories,
  handleImageFilesChange,
  variantInput,
  setVariantInput,
  handleAddVariant,
  variantEditIndex,
  handleCancelVariantEdit,
  handleEditVariant,
  handleRemoveVariant,
  handleSaveProduct,
  handleCancelEdit,
  handleEditProduct,
  handleDeleteProduct,
  formatCurrency
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const pBrand = product.brand || product.brandRef?.name || '';
    const matchesBrand = selectedBrand === 'all' || pBrand === selectedBrand;
    
    const pCat = product.category || product.categoryRef?.name || '';
    const matchesCategory = selectedCategory === 'all' || pCat === selectedCategory;

    return matchesSearch && matchesBrand && matchesCategory;
  });

  const handleRemoveImage = (indexToRemove) => {
    const updatedImages = productForm.images.filter((_, idx) => idx !== indexToRemove);
    const updatedFiles = productForm.imageFiles.filter((_, idx) => idx !== indexToRemove);
    const updatedExisting = productForm.existingImages.filter((_, idx) => {
      // Find if this image was part of existing images
      const imgUrl = productForm.images[indexToRemove];
      return _ !== imgUrl;
    });

    setProductForm({
      ...productForm,
      images: updatedImages,
      imageFiles: updatedFiles,
      existingImages: updatedExisting
    });
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Product Creator Form */}
      <div className="adm-card">
        <div className="adm-card-title">
          <h3>{editingProductId ? 'Chỉnh Sửa Sản Phẩm' : 'Tạo Sản Phẩm Mới'}</h3>
          {editingProductId && (
            <button className="adm-btn adm-btn-secondary adm-btn-small" onClick={handleCancelEdit}>
              Hủy Chỉnh Sửa
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="adm-form-row">
            <div className="adm-input-group">
              <label>Tên sản phẩm</label>
              <input
                type="text"
                className="adm-input"
                placeholder="Nhập tên sản phẩm..."
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              />
              <span className="adm-input-hint">Ví dụ: iPhone 15 Pro Max 256GB</span>
            </div>

            <div className="adm-input-group">
              <label>Thương hiệu</label>
              <input
                className="adm-input"
                list="brand-options-list"
                placeholder="Chọn hoặc nhập mới thương hiệu"
                value={productForm.brand}
                onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
              />
              <datalist id="brand-options-list">
                {brands.map((b) => (
                  <option key={b._id || b.slug} value={b.name} />
                ))}
              </datalist>
              <span className="adm-input-hint">Ví dụ: Apple, Samsung, Xiaomi</span>
            </div>

            <div className="adm-input-group">
              <label>Danh mục</label>
              <input
                className="adm-input"
                list="category-options-list"
                placeholder="Chọn hoặc nhập mới danh mục"
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
              />
              <datalist id="category-options-list">
                {categories.map((c) => (
                  <option key={c._id || c.slug} value={c.name} />
                ))}
              </datalist>
              <span className="adm-input-hint">Ví dụ: Smartphone, Tablet, Accessory</span>
            </div>
          </div>

          <div className="adm-input-group">
            <label>Mô tả chi tiết sản phẩm</label>
            <textarea
              className="adm-input adm-textarea"
              placeholder="Nhập mô tả sản phẩm, thông số kỹ thuật..."
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
            />
          </div>

          {/* Media uploader area */}
          <div className="adm-input-group">
            <label>Hình ảnh sản phẩm</label>
            <div
              style={{
                border: '2px dashed var(--adm-border)',
                borderRadius: '12px',
                padding: '30px',
                textAlign: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.01)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'var(--adm-transition-fast)'
              }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--adm-primary)')}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--adm-border)')}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageFilesChange}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  cursor: 'pointer',
                  width: '100%',
                  height: '100%'
                }}
              />
              <svg
                width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ color: 'var(--adm-text-muted)', marginBottom: '10px' }}
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              <p style={{ margin: 0, fontWeight: '700', fontSize: '14px', color: '#fff' }}>
                Kéo thả hoặc nhấp để tải ảnh lên
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--adm-text-darker)' }}>
                Chấp nhận định dạng JPG, PNG, WEBP. Tải lên được nhiều tệp.
              </p>
            </div>

            {productForm.images && productForm.images.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                  gap: '12px',
                  marginTop: '16px'
                }}
              >
                {productForm.images.map((img, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: '100%',
                      paddingBottom: '100%',
                      position: 'relative',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1.5px solid var(--adm-border)'
                    }}
                  >
                    <img
                      src={img}
                      alt={`Preview ${idx}`}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: 'rgba(0,0,0,0.6)',
                        border: 'none',
                        color: 'var(--adm-danger)',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifycontent: 'center',
                        padding: 0,
                        cursor: 'pointer'
                      }}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Variants section */}
          <div
            style={{
              border: '1px solid var(--adm-border)',
              borderRadius: '12px',
              padding: '20px',
              backgroundColor: 'rgba(255,255,255,0.01)'
            }}
          >
            <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: '800', marginBottom: '16px' }}>
              Quản Lý Cấu Hình (Variants)
            </h4>
            <div className="adm-form-row">
              <div className="adm-input-group">
                <label>Dung lượng</label>
                <input
                  type="text"
                  className="adm-input"
                  placeholder="Ví dụ: 128GB, 256GB..."
                  value={variantInput.storage}
                  onChange={(e) => setVariantInput({ ...variantInput, storage: e.target.value })}
                />
              </div>

              <div className="adm-input-group">
                <label>Màu sắc</label>
                <input
                  type="text"
                  className="adm-input"
                  placeholder="Ví dụ: Titan Tự Nhiên, Đen..."
                  value={variantInput.color}
                  onChange={(e) => setVariantInput({ ...variantInput, color: e.target.value })}
                />
              </div>

              <div className="adm-input-group">
                <label>Giá bán (VND)</label>
                <input
                  type="number"
                  className="adm-input"
                  placeholder="Giá bán..."
                  value={variantInput.price}
                  onChange={(e) => setVariantInput({ ...variantInput, price: e.target.value })}
                />
              </div>

              <div className="adm-input-group">
                <label>Số lượng kho</label>
                <input
                  type="number"
                  className="adm-input"
                  placeholder="Số lượng nhập kho..."
                  value={variantInput.stock}
                  onChange={(e) => setVariantInput({ ...variantInput, stock: e.target.value })}
                />
              </div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              <button className="adm-btn adm-btn-secondary adm-btn-small" onClick={handleAddVariant}>
                {variantEditIndex >= 0 ? 'Lưu Variant' : 'Thêm Variant'}
              </button>
              {variantEditIndex >= 0 && (
                <button className="adm-btn adm-btn-danger adm-btn-small" onClick={handleCancelVariantEdit}>
                  Hủy sửa
                </button>
              )}
            </div>

            {productForm.variants && productForm.variants.length > 0 && (
              <div className="adm-table-wrapper" style={{ marginTop: '20px' }}>
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>Dung lượng</th>
                      <th>Màu sắc</th>
                      <th>Giá bán</th>
                      <th>Số lượng</th>
                      <th style={{ textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productForm.variants.map((v, index) => (
                      <tr key={index}>
                        <td style={{ fontWeight: '700' }}>{v.storage}</td>
                        <td>{v.color}</td>
                        <td style={{ color: 'var(--adm-primary)', fontWeight: '700' }}>
                          {formatCurrency(v.price)}
                        </td>
                        <td>{v.stock} chiếc</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button
                              className="adm-btn adm-btn-secondary adm-btn-small"
                              onClick={() => handleEditVariant(v, index)}
                            >
                              Sửa
                            </button>
                            <button
                              className="adm-btn adm-btn-danger adm-btn-small"
                              onClick={() => handleRemoveVariant(index)}
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button className="adm-btn adm-btn-primary" onClick={handleSaveProduct}>
              {editingProductId ? 'Cập Nhật Sản Phẩm' : 'Đăng Sản Phẩm'}
            </button>
            {editingProductId && (
              <button className="adm-btn adm-btn-secondary" onClick={handleCancelEdit}>
                Huỷ Bỏ
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Catalog Listing */}
      <div className="adm-card">
        <div className="adm-card-title">
          <h3>Danh Sách Sản Phẩm</h3>
          <button className="adm-btn adm-btn-secondary adm-btn-small" onClick={exportProducts}>
            Xuất file Excel
          </button>
        </div>

        <div className="adm-action-bar">
          <div className="adm-action-bar-filters">
            <div className="adm-search-input-wrapper">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                className="adm-input"
                placeholder="Tìm theo tên sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="adm-input adm-select"
              style={{ width: '160px' }}
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
            >
              <option value="all">Tất cả hãng</option>
              {brands.map((b) => (
                <option key={b._id || b.slug} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>

            <select
              className="adm-input adm-select"
              style={{ width: '180px' }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c._id || c.slug} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="adm-table-wrapper">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Tên Sản Phẩm</th>
                <th>Thương Hiệu</th>
                <th>Danh Mục</th>
                <th>Phiên Bản / Cấu Hình</th>
                <th style={{ textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>
                    Không tìm thấy sản phẩm nào.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const thumbnailImg = p.thumbnail || p.images?.[0] || '';
                  return (
                    <tr key={p._id}>
                      <td>
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '1px solid var(--adm-border)',
                            backgroundColor: '#121215',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {thumbnailImg ? (
                            <img src={thumbnailImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--adm-text-darker)' }}>No Image</span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontWeight: '700', color: '#fff', maxWidth: '240px' }}>
                        {p.name}
                      </td>
                      <td>{p.brand || p.brandRef?.name || 'N/A'}</td>
                      <td>{p.category || p.categoryRef?.name || 'N/A'}</td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxWidth: '280px' }}>
                          {p.variants && p.variants.length > 0 ? (
                            p.variants.map((v, i) => (
                              <span
                                key={i}
                                className="adm-badge pending"
                                style={{
                                  padding: '2px 8px',
                                  fontSize: '11.5px',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {v.storage || v.size} - {v.color}: {formatCurrency(v.price)}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: 'var(--adm-text-darker)', fontStyle: 'italic', fontSize: '13px' }}>
                              Chưa cấu hình variant
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            className="adm-btn adm-btn-secondary adm-btn-small"
                            onClick={() => handleEditProduct(p)}
                          >
                            Sửa
                          </button>
                          <button
                            className="adm-btn adm-btn-danger adm-btn-small"
                            onClick={() => handleDeleteProduct(p._id)}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductsTab;
