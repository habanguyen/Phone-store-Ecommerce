import React, { useEffect, useRef } from 'react';

const CustomerSupportTab = ({
  customerChats,
  selectedChat,
  setSelectedChat,
  loadCustomerChats,
  adminReplyMessage,
  setAdminReplyMessage,
  sendAdminReply
}) => {
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (selectedChat) {
      scrollToBottom();
    }
  }, [selectedChat, selectedChat?.messages]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendAdminReply();
    }
  };

  return (
    <div className="adm-card animate-fade">
      <div className="adm-card-title">
        <h3>Hỗ Trợ Khách Hàng (Trực Tuyến)</h3>
      </div>

      <div className="adm-chat-layout">
        {/* Chats List */}
        <div className="adm-chat-users-list">
          <div className="adm-chat-list-header">
            <h4>Cuộc Hội Thoại</h4>
            <button className="adm-btn adm-btn-secondary adm-btn-small" onClick={loadCustomerChats}>
              Làm mới
            </button>
          </div>
          <div className="adm-chat-scroll">
            {customerChats.length === 0 ? (
              <p style={{ textAlign: 'center', margin: '20px 0', fontSize: '13px', color: 'var(--adm-text-darker)' }}>
                Chưa có cuộc hội thoại nào.
              </p>
            ) : (
              customerChats.map((chat) => {
                const isActive = selectedChat?._id === chat._id;
                const lastMessage = chat.messages?.[chat.messages.length - 1];
                
                return (
                  <button
                    key={chat._id}
                    className={`adm-chat-item ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedChat(chat)}
                  >
                    <span className="adm-chat-item-name">
                      {chat.userId?.email || chat.userId?.name || 'Khách vãng lai'}
                    </span>
                    {lastMessage && (
                      <span
                        style={{
                          fontSize: '12px',
                          color: isActive ? '#fff' : 'var(--adm-text-muted)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginTop: '2px'
                        }}
                      >
                        {lastMessage.sender === 'user' ? 'Khách: ' : 'Bạn: '}
                        {lastMessage.message}
                      </span>
                    )}
                    <span className="adm-chat-item-time">
                      {new Date(chat.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Message Thread */}
        <div className="adm-chat-box">
          {selectedChat ? (
            <>
              <div className="adm-chat-box-header">
                <div>
                  <h4>{selectedChat.userId?.name || 'Khách hàng'}</h4>
                  <p>{selectedChat.userId?.email || 'Hội thoại trực tiếp'}</p>
                </div>
                <button
                  className="adm-btn adm-btn-secondary adm-btn-small"
                  onClick={() => setSelectedChat(null)}
                >
                  Đóng chat
                </button>
              </div>

              <div className="adm-chat-messages-container">
                {selectedChat.messages && selectedChat.messages.length > 0 ? (
                  selectedChat.messages.map((msg, index) => {
                    const isUser = msg.sender === 'user';
                    return (
                      <div key={index} className={`adm-chat-msg ${isUser ? 'user' : 'admin'}`}>
                        <div className="adm-chat-bubble">
                          <span style={{ fontSize: '11px', fontWeight: '800', display: 'block', marginBottom: '4px', opacity: 0.8 }}>
                            {isUser ? 'Khách Hàng' : 'QTV hỗ trợ'}
                          </span>
                          {msg.message}
                        </div>
                        <span className="adm-chat-meta">
                          {new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ textAlign: 'center', color: 'var(--adm-text-darker)' }}>Chưa có tin nhắn nào.</p>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="adm-chat-input-area">
                <textarea
                  placeholder="Nhập nội dung tin nhắn hỗ trợ..."
                  value={adminReplyMessage}
                  onChange={(e) => setAdminReplyMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                />
                <button
                  className="adm-btn adm-btn-primary"
                  onClick={sendAdminReply}
                  disabled={!adminReplyMessage.trim()}
                >
                  Gửi
                </button>
              </div>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                color: 'var(--adm-text-darker)'
              }}
            >
              <svg
                width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                style={{ marginBottom: '16px', opacity: 0.6 }}
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <p style={{ margin: 0, fontWeight: '600' }}>
                Chọn một cuộc trò chuyện từ danh sách bên trái để phản hồi.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerSupportTab;
