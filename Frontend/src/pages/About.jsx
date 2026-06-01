const About = () => {
  return (
    <div>
      {/* Page Header */}
      <section className="page-hero">
        <div className="container">
          <h1 style={{ fontSize: '48px', marginBottom: '16px', fontWeight: 'bold' }}>
            Về chúng tôi
          </h1>
          <p style={{ fontSize: '20px' }}>
            Nơi cung cấp điện thoại và tablet chính hãng với dịch vụ tốt nhất
          </p>
        </div>
      </section>

      {/* About Content */}
      <section className="section">
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '40px',
            alignItems: 'center'
          }}>
            <div>
              <h2 style={{
                color: 'var(--primary-color)',
                marginBottom: '20px',
                fontSize: '32px'
              }}>
                Minh Khang Store - Đối tác tin cậy
              </h2>
              <p style={{
                fontSize: '16px',
                lineHeight: '1.6',
                marginBottom: '20px',
                color: '#666'
              }}>
                Chúng tôi là cửa hàng chuyên cung cấp điện thoại di động và máy tính bảng chính hãng
                từ các thương hiệu hàng đầu thế giới như Apple, Samsung, Xiaomi, Oppo, và nhiều hãng khác.
              </p>
              <p style={{
                fontSize: '16px',
                lineHeight: '1.6',
                marginBottom: '20px',
                color: '#666'
              }}>
                Với đội ngũ nhân viên chuyên nghiệp và giàu kinh nghiệm, chúng tôi cam kết mang đến
                cho khách hàng những sản phẩm chất lượng cao cùng dịch vụ chăm sóc khách hàng tận tâm.
              </p>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}>
                <li style={{
                  marginBottom: '12px',
                  fontSize: '16px',
                  color: '#666',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  ✅ Sản phẩm chính hãng 100%
                </li>
                <li style={{
                  marginBottom: '12px',
                  fontSize: '16px',
                  color: '#666',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  ✅ Bảo hành chính thức
                </li>
                <li style={{
                  marginBottom: '12px',
                  fontSize: '16px',
                  color: '#666',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  ✅ Tư vấn chuyên nghiệp
                </li>
                <li style={{
                  marginBottom: '12px',
                  fontSize: '16px',
                  color: '#666',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  ✅ Giao hàng tận nơi
                </li>
              </ul>
            </div>
            <div style={{ textAlign: 'center' }}>
              <img
                src="/uploads/banner.jpg"
                alt="Minh Khang Store"
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ background: '#f8f9fa', padding: '60px 0' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '40px',
            textAlign: 'center'
          }}>
            <div>
              <div style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: 'var(--primary-color)',
                marginBottom: '16px'
              }}>
                10K+
              </div>
              <div style={{
                fontSize: '18px',
                color: '#666'
              }}>
                Khách hàng hài lòng
              </div>
            </div>
            <div>
              <div style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: 'var(--primary-color)',
                marginBottom: '16px'
              }}>
                500+
              </div>
              <div style={{
                fontSize: '18px',
                color: '#666'
              }}>
                Sản phẩm đa dạng
              </div>
            </div>
            <div>
              <div style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: 'var(--primary-color)',
                marginBottom: '16px'
              }}>
                5+
              </div>
              <div style={{
                fontSize: '18px',
                color: '#666'
              }}>
                Năm kinh nghiệm
              </div>
            </div>
            <div>
              <div style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: 'var(--primary-color)',
                marginBottom: '16px'
              }}>
                24/7
              </div>
              <div style={{
                fontSize: '18px',
                color: '#666'
              }}>
                Hỗ trợ khách hàng
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{
              color: 'var(--primary-color)',
              fontSize: '32px',
              marginBottom: '16px'
            }}>
              Sứ mệnh của chúng tôi
            </h2>
            <p style={{
              fontSize: '18px',
              color: '#666',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Mang công nghệ hiện đại đến gần hơn với mọi người,
              tạo nên trải nghiệm mua sắm tuyệt vời và đáng tin cậy.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;