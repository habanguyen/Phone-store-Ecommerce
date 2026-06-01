import { useState } from 'react';
import api from '../api.js';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitError('');
      await api.post('/contacts', formData);
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
      setTimeout(() => {
        setSubmitted(false);
      }, 3000);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Không thể gửi phản hồi. Vui lòng thử lại.');
    }
  };

  return (
    <div className="animate-fade">
      {/* Page Header */}
      <section className="page-hero">
        <div className="container">
          <h1 style={{ fontSize: '44px', marginBottom: '16px', fontWeight: '800', letterSpacing: '-0.03em' }}>
            Liên hệ với chúng tôi
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--text-light)', maxWidth: '600px', margin: '0 auto' }}>
            Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn mọi lúc mọi nơi.
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="section">
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))',
            gap: '40px',
            marginBottom: '40px'
          }}>
            {/* Contact Form */}
            <div className="card animate-slide" style={{ padding: '40px' }}>
              <h2 style={{
                color: '#FFFFFF',
                marginBottom: '8px',
                fontSize: '28px',
                fontWeight: '800',
                letterSpacing: '-0.02em'
              }}>
                Gửi tin nhắn
              </h2>
              <p style={{ color: 'var(--text-light)', marginBottom: '32px', fontSize: '15px' }}>
                Điền thông tin vào biểu mẫu dưới đây, chúng tôi sẽ liên hệ lại sớm nhất.
              </p>

              {submitted ? (
                <div className="alert success">
                  <span>Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '600',
                      color: 'var(--text-color)',
                      fontSize: '14px'
                    }}>
                      Họ tên *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="input"
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '600',
                      color: 'var(--text-color)',
                      fontSize: '14px'
                    }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="input"
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '600',
                      color: 'var(--text-color)',
                      fontSize: '14px'
                    }}>
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '600',
                      color: 'var(--text-color)',
                      fontSize: '14px'
                    }}>
                      Chủ đề *
                    </label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="input"
                      required
                    >
                      <option value="">Chọn chủ đề</option>
                      <option value="support">Hỗ trợ kỹ thuật</option>
                      <option value="order">Đơn hàng</option>
                      <option value="warranty">Bảo hành</option>
                      <option value="feedback">Phản hồi</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '600',
                      color: 'var(--text-color)',
                      fontSize: '14px'
                    }}>
                      Nội dung tin nhắn *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      className="input"
                      required
                      rows="5"
                      placeholder="Mô tả chi tiết vấn đề của bạn..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '14px', fontSize: '15px' }}
                  >
                    Gửi tin nhắn
                  </button>
                </form>
              )}
              {submitError && (
                <div className="alert error" style={{ marginTop: '20px' }}>
                  <span>{submitError}</span>
                </div>
              )}
            </div>

            {/* Contact Info */}
            <div className="card animate-slide" style={{ padding: '40px' }}>
              <h2 style={{
                color: '#FFFFFF',
                marginBottom: '8px',
                fontSize: '28px',
                fontWeight: '800',
                letterSpacing: '-0.02em'
              }}>
                Thông tin liên hệ
              </h2>
              <p style={{ color: 'var(--text-light)', marginBottom: '36px', fontSize: '15px' }}>
                Dưới đây là các kênh liên lạc chính thức của Minh Khang Store.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                  <div style={{
                    background: 'rgba(229, 9, 20, 0.1)',
                    border: '1px solid rgba(229, 9, 20, 0.2)',
                    borderRadius: '12px',
                    width: '50px',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    flexShrink: 0
                  }}>
                    📍
                  </div>
                  <div>
                    <h3 style={{ color: '#FFFFFF', fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>Địa chỉ</h3>
                    <p style={{ color: 'var(--text-light)', fontSize: '14px', lineHeight: '1.6' }}>
                      Cầu Nam Am, Nguyễn Bỉnh Khiêm<br />
                      Thành phố Hải Phòng, Việt Nam
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                  <div style={{
                    background: 'rgba(229, 9, 20, 0.1)',
                    border: '1px solid rgba(229, 9, 20, 0.2)',
                    borderRadius: '12px',
                    width: '50px',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    flexShrink: 0
                  }}>
                    📞
                  </div>
                  <div>
                    <h3 style={{ color: '#FFFFFF', fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>Điện thoại</h3>
                    <p style={{ color: 'var(--text-light)', fontSize: '14px', lineHeight: '1.6' }}>
                      Hotline: <span style={{ color: '#FFFFFF', fontWeight: '600' }}>1900 XXX XXX</span><br />
                      Tư vấn: <span style={{ color: '#FFFFFF', fontWeight: '600' }}>(028) XXX XXXX</span><br />
                      Fax: <span style={{ color: '#FFFFFF', fontWeight: '600' }}>(028) XXX XXXX</span>
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                  <div style={{
                    background: 'rgba(229, 9, 20, 0.1)',
                    border: '1px solid rgba(229, 9, 20, 0.2)',
                    borderRadius: '12px',
                    width: '50px',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    flexShrink: 0
                  }}>
                    ✉️
                  </div>
                  <div>
                    <h3 style={{ color: '#FFFFFF', fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>Email</h3>
                    <p style={{ color: 'var(--text-light)', fontSize: '14px', lineHeight: '1.6' }}>
                      Hỗ trợ: <span style={{ color: '#FFFFFF' }}>support@minhkhangstore.vn</span><br />
                      Kinh doanh: <span style={{ color: '#FFFFFF' }}>sales@minhkhangstore.vn</span><br />
                      Tuyển dụng: <span style={{ color: '#FFFFFF' }}>hr@minhkhangstore.vn</span>
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                  <div style={{
                    background: 'rgba(229, 9, 20, 0.1)',
                    border: '1px solid rgba(229, 9, 20, 0.2)',
                    borderRadius: '12px',
                    width: '50px',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    flexShrink: 0
                  }}>
                    🕒
                  </div>
                  <div>
                    <h3 style={{ color: '#FFFFFF', fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>Giờ làm việc</h3>
                    <p style={{ color: 'var(--text-light)', fontSize: '14px', lineHeight: '1.6' }}>
                      Thứ 2 - Thứ 6: 8:00 - 18:00<br />
                      Thứ 7 - Chủ nhật: 8:00 - 17:00<br />
                      Nghỉ lễ, Tết theo quy định
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Full-width Map Card */}
          <div className="card animate-slide" style={{ overflow: 'hidden' }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-color)',
              background: 'rgba(255, 255, 255, 0.01)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '20px' }}>🗺️</span>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                Bản đồ đường đi & Vị trí cửa hàng
              </h3>
            </div>
            <div style={{
              position: 'relative',
              width: '100%',
              height: '450px',
              background: 'var(--bg-dark)'
            }}>
              <iframe
                title="Google Map"
                src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3731.8123456789!2d106.5396975!3d20.6436473!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1svi!2s!4v1700000000000"
                width="100%"
                height="100%"
                style={{
                  border: 0,
                  display: 'block',
                  filter: 'grayscale(0.15) contrast(1.05) brightness(0.95)'
                }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;