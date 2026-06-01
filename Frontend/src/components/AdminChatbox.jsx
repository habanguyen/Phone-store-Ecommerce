import { useEffect, useRef, useState } from 'react';
import api from '../api.js';
import './Chatbox.css';

const adminFeatures = [
  'AI hỗ trợ khách hàng',
  'Tư vấn sản phẩm tự động',
  'Gợi ý sản phẩm phù hợp',
  'Trả lời câu hỏi khách hàng',
  'Hỗ trợ tìm kiếm sản phẩm thông minh',
  'AI hỗ trợ Admin',
  'Phân tích xu hướng mua sắm',
  'Gợi ý sản phẩm bán chạy',
  'Dự đoán tồn kho',
  'Phân tích hành vi người dùng',
  'Hỗ trợ trả lời khách hàng nhanh',
  'Gợi ý chiến dịch marketing',
  'Phát hiện đơn hàng bất thường/spam'
];

const quickQuestions = [
  'Dashboard tổng quan',
  'Tổng doanh thu',
  'Tổng đơn hàng',
  'Đơn hoàn thành',
  'Đơn bị hủy',
  'Thống kê sản phẩm',
  'Sản phẩm bán chạy',
  'Doanh thu theo thời gian',
  'Thương hiệu nổi bật'
];

const AdminChatbox = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFeatures, setShowFeatures] = useState(false);
  const messageEndRef = useRef(null);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchChatHistory();
    const refreshId = setInterval(fetchChatHistory, 10000);
    return () => clearInterval(refreshId);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getLimitedHistory = (history = []) => {
    const lastEntries = history.slice(-10);
    return lastEntries.length
      ? lastEntries
      : [
          {
            sender: 'admin',
            message:
              'Xin chào Admin! Tôi ở đây để hỗ trợ tư vấn sản phẩm, phân tích xu hướng, phát hiện đơn hàng bất thường và đáp ứng các câu hỏi quản trị.'
          }
        ];
  };

  const fetchChatHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/ai/chat');
      const history = response.data.chat?.messages || [];
      setMessages(getLimitedHistory(history));
    } catch (err) {
      setError('Không thể tải lịch sử chat admin. Vui lòng thử lại.');
      setMessages([
        {
          sender: 'admin',
          message:
            'Xin chào Admin! Vui lòng thử đăng nhập lại hoặc làm mới trang nếu bạn không thể kết nối với AI.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (messageText = input) => {
    const text = messageText.trim();
    if (!text) return;
    setMessages((prev) => getLimitedHistory([...prev, { sender: 'user', message: text }]));
    setInput('');
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/ai/chat', { message: text });
      setMessages((prev) => getLimitedHistory([...prev, { sender: 'admin', message: response.data.response }]));
    } catch (err) {
      setError('Gửi yêu cầu thất bại. Vui lòng thử lại.');
      setMessages((prev) => getLimitedHistory([...prev, { sender: 'admin', message: 'Lỗi khi gửi yêu cầu. Vui lòng thử lại sau.' }]));
    } finally {
      setLoading(false);
    }
  };

  const chooseSuggestion = (suggestion, autoSend = false) => {
    setInput(suggestion);
    if (autoSend) {
      sendMessage(suggestion);
    }
  };

  return (
    <div className="admin-chat-shell">
      <div className="admin-chat-sidebar">
        <div className="admin-chat-panel">
          <h3>AI Admin Assistant</h3>
          <p>
            Giao diện chat dành cho admin với khả năng...{' '}
            {!showFeatures ? (
              <button
                className="button secondary"
                onClick={() => setShowFeatures(true)}
                style={{ padding: '0 8px', minHeight: 'auto', fontSize: '0.9rem' }}
              >
                (xem thêm)
              </button>
            ) : (
              <button
                className="button secondary"
                onClick={() => setShowFeatures(false)}
                style={{ padding: '0 8px', minHeight: 'auto', fontSize: '0.9rem' }}
              >
                (thu gọn)
              </button>
            )}
          </p>
          {showFeatures && (
            <ul>
              {adminFeatures.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          )}
          <div className="admin-suggestions">
            <h4>Câu hỏi gợi ý</h4>
            <div className="admin-quick-buttons">
              {quickQuestions.map((item) => (
                <button key={item} className="button secondary" onClick={() => chooseSuggestion(item, true)}>
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="admin-suggestions">
            <h4>Gợi ý nâng cao</h4>
            {['Phân tích xu hướng mua sắm', 'Gợi ý chiến dịch marketing', 'Dự đoán tồn kho', 'Phát hiện đơn hàng bất thường'].map((item) => (
              <button key={item} className="button secondary" onClick={() => chooseSuggestion(item, true)}>
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="admin-chat-window">
        <div className="chat-header admin-chat-header">
          <span>Admin AI Chat</span>
          <span style={{ fontSize: 12, opacity: 0.9 }}>Tư vấn nội bộ và hỗ trợ khách hàng</span>
        </div>
        <div className="chat-body">
          {loading && <div className="chat-loading">Đang xử lý...</div>}
          {messages.map((msg, index) => (
            <div key={index} className={`chat-message ${msg.sender === 'user' ? 'user' : 'ai'}`}>
              <div className="bubble">
                <strong>{msg.sender === 'user' ? 'Admin' : 'AI'}:</strong>
                <span>{msg.message}</span>
              </div>
            </div>
          ))}
          <div ref={messageEndRef} />
          {error && <div style={{ color: 'red', marginTop: '6px' }}>{error}</div>}
        </div>
        <div className="chat-footer">
          <div className="chat-input-row">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Hỏi AI Admin về đơn hàng, tồn kho, marketing..."
              className="chat-input"
            />
            <button onClick={sendMessage} className="chat-send-btn">
              Gửi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminChatbox;
