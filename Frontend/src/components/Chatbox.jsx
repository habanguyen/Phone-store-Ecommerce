import React, { useState, useEffect, useRef } from 'react';
import api from '../api.js';
import './Chatbox.css';

const suggestions = [
    'Tư vấn điện thoại phù hợp',
    'Tư vấn gaming',
    'Tư vấn camera',
    'Gợi ý pin lâu',
    'Gợi ý iOS / Android',
    'Giải đáp chính sách',
    'Tra cứu đơn hàng'
];

const Chatbox = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSessionConfirm, setShowSessionConfirm] = useState(false);
    const [sessionTimer, setSessionTimer] = useState(null);
    const messageEndRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            fetchChatHistory();
            // Check if we need to show session confirmation
            const token = localStorage.getItem('token');
            if (token && messages.length > 0) {
                setShowSessionConfirm(true);
            }
        }
    }, [isOpen]);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 5-minute session auto-reset timer
    useEffect(() => {
        if (isOpen && sessionTimer) {
            clearTimeout(sessionTimer);
        }

        if (isOpen) {
            const timer = setTimeout(() => {
                if (isOpen) {
                    setShowSessionConfirm(true);
                }
            }, 5 * 60 * 1000); // 5 minutes
            setSessionTimer(timer);
        }

        return () => {
            if (sessionTimer) clearTimeout(sessionTimer);
        };
    }, [isOpen, messages.length]);

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

    const confirmSession = async () => {
        const token = getToken();
        if (token) {
            try {
                await api.post('/ai/session/confirm');
                setShowSessionConfirm(false);
            } catch (err) {
                console.error('Error confirming session:', err);
            }
        } else {
            setShowSessionConfirm(false);
        }
    };

    const resetSession = async () => {
        const token = getToken();
        if (token) {
            try {
                await api.post('/ai/session/reset');
                setMessages([]);
                setInput('');
                setShowSessionConfirm(false);
                await fetchChatHistory();
            } catch (err) {
                console.error('Error resetting session:', err);
            }
        }
    };

    const endSession = async () => {
        const token = getToken();
        if (token) {
            try {
                await api.post('/ai/session/end');
                setIsOpen(false);
                setMessages([]);
                setInput('');
                setShowSessionConfirm(false);
            } catch (err) {
                console.error('Error ending session:', err);
            }
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

    const isSlotFillingMessage = (message) => {
        return message && message.includes('_[Slot:');
    };

    const extractSlotMessage = (message) => {
        const slotMatch = message.match(/_\[Slot: (.+?)\]/);
        if (slotMatch) {
            return {
                text: message.replace(/_\[Slot: .+?\]/, '').trim(),
                slot: slotMatch[1]
            };
        }
        return { text: message, slot: null };
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
                        <div className="chat-header-buttons">
                            {messages.length > 0 && (
                                <>
                                    <button onClick={resetSession} title="Reset phiên" className="header-btn">↻</button>
                                    <button onClick={endSession} title="Kết thúc" className="header-btn">✕</button>
                                </>
                            )}
                            {messages.length === 0 && (
                                <button onClick={() => setIsOpen(false)} className="header-btn">✕</button>
                            )}
                        </div>
                    </div>
                    <div className="chat-body">
                        {loading && <div className="chat-loading">Đang xử lý...</div>}
                        {messages.map((msg, index) => {
                            const slotInfo = isSlotFillingMessage(msg.message) 
                                ? extractSlotMessage(msg.message)
                                : { text: msg.message, slot: null };
                            
                            return (
                                <div key={index} className={`chat-message ${msg.sender === 'user' ? 'user' : 'ai'} ${slotInfo.slot ? 'slot-filling' : ''}`}>
                                    <div className="bubble">
                                        <strong>{msg.sender === 'user' ? 'Bạn' : 'AI'}:</strong>
                                        <span>{slotInfo.text}</span>
                                        {slotInfo.slot && <div className="slot-label">📝 Đang hỏi về: {slotInfo.slot}</div>}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messageEndRef} />
                        {error && <div style={{ color: 'red', marginTop: '6px' }}>{error}</div>}
                    </div>

                    {showSessionConfirm && (
                        <div className="session-confirmation">
                            <div className="session-modal">
                                <h3>Tiếp tục cuộc trò chuyện?</h3>
                                <p>Phiên chat của bạn sẽ được tiếp tục. Bạn có muốn tiếp tục hay bắt đầu lại?</p>
                                <div className="session-buttons">
                                    <button className="btn-continue" onClick={confirmSession}>Tiếp tục</button>
                                    <button className="btn-reset" onClick={resetSession}>Bắt đầu lại</button>
                                </div>
                            </div>
                        </div>
                    )}

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