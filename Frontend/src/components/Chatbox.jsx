import React, { useState, useEffect, useRef } from 'react';
import api from '../api.js';
import './Chatbox.css';

const suggestions = [
    'Tư vấn sản phẩm',
    'So sánh điện thoại',
    'Gợi ý theo nhu cầu',
    'Giải đáp chính sách',
    'Hướng dẫn mua hàng',
    'Hỗ trợ thanh toán',
    'Hỗ trợ tra cứu đơn hàng'
];

const Chatbox = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const messageEndRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            fetchChatHistory();
        }
    }, [isOpen]);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const getToken = () => localStorage.getItem('token');

    const fetchChatHistory = async () => {
        const token = getToken();
        if (!token) {
            try {
                const resp = await api.get('/ai/chat/guest');
                const history = resp.data.chat?.messages || [];
                setMessages(history.length ? history : [{ sender: 'admin', message: 'Xin chào! Tôi có thể giúp bạn tìm sản phẩm, giải thích chính sách và gợi ý.' }]);
            } catch (err) {
                setMessages([
                    {
                        sender: 'admin',
                        message: 'Xin chào! Đăng nhập để chat với trợ lý bán hàng, nhận gợi ý sản phẩm và chính sách bảo hành.'
                    }
                ]);
            }
            return;
        }

        setLoading(true);
        setError('');
        try {
            const response = await api.get('/ai/chat');
            const history = response.data.chat?.messages || [];
            setMessages(
                history.length
                    ? history
                    : [
                          {
                              sender: 'admin',
                              message:
                                  'Xin chào! Tôi có thể giúp bạn tìm sản phẩm phù hợp, giải thích chính sách bán hàng và bảo hành.'
                          }
                      ]
            );
        } catch (error) {
            console.error('Error fetching chat history:', error);
            setError('Không thể lấy lịch sử chat. Vui lòng thử lại sau.');
            setMessages([
                {
                    sender: 'admin',
                    message:
                        'Xin chào! Đăng nhập để sử dụng chat hỗ trợ sản phẩm, chính sách bán hàng và bảo hành.'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async (messageText = input) => {
        const text = messageText.trim();
        if (!text) return;
        const token = getToken();

        setMessages((prev) => [...prev, { sender: 'user', message: text }]);
        setInput('');
        setError('');

        if (!token) {
            try {
                const resp = await api.post('/ai/chat/guest', { message: text });
                setMessages((prev) => [...prev, { sender: 'admin', message: resp.data.response }]);
            } catch (err) {
                console.error('Error sending guest message:', err);
                setError('Gửi tin nhắn thất bại. Vui lòng thử lại.');
                setMessages((prev) => [
                    ...prev,
                    {
                        sender: 'admin',
                        message: 'Lỗi gửi tin nhắn. Vui lòng thử lại sau.'
                    }
                ]);
            }
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/ai/chat', { message: text });
            setMessages((prev) => [...prev, { sender: 'admin', message: response.data.response }]);
        } catch (error) {
            console.error('Error sending message:', error);
            setError('Gửi tin nhắn thất bại. Vui lòng thử lại.');
            setMessages((prev) => [
                ...prev,
                {
                    sender: 'admin',
                    message: 'Lỗi gửi tin nhắn. Vui lòng thử lại sau.'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const chooseSuggestion = (suggestion) => {
        setInput(suggestion);
        sendMessage(suggestion);
    };

    return (
        <div>
            {!isOpen && (
                <button onClick={() => setIsOpen(true)} className="chat-toggle-button">
                    Chat
                </button>
            )}
            {isOpen && (
                <div className="chat-window">
                    <div className="chat-header">
                        <span>Trợ lý mua sắm</span>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                    </div>
                    <div className="chat-body">
                        {loading && <div className="chat-loading">Đang xử lý...</div>}
                        {messages.map((msg, index) => (
                            <div key={index} className={`chat-message ${msg.sender === 'user' ? 'user' : 'ai'}`}>
                                <div className="bubble">
                                    <strong>{msg.sender === 'user' ? 'Bạn' : 'AI'}:</strong>
                                    <span>{msg.message}</span>
                                </div>
                            </div>
                        ))}
                        <div ref={messageEndRef} />
                        {error && <div style={{ color: 'red', marginTop: '6px' }}>{error}</div>}
                    </div>
                    <div className="chat-suggestions">
                        <div className="suggestion-title">Gợi ý nhanh</div>
                        <div className="suggestion-list">
                            {suggestions.map((item) => (
                                <button key={item} className="suggestion-btn" onClick={() => chooseSuggestion(item)}>
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="chat-footer">
                        <div className="chat-input-row">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder="Hỏi tôi về sản phẩm..."
                                className="chat-input"
                            />
                            <button onClick={sendMessage} className="chat-send-btn">Gửi</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chatbox;