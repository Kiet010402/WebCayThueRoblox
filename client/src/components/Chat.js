import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/axios';
import './Chat.css';

function Chat({ user }) {
  const isAdmin = user?.role === 'admin';
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null); // For both admin and user
  const [conversations, setConversations] = useState([]); // For admin: list of users
  const [admins, setAdmins] = useState([]); // For user: list of admins
  const [searchQuery, setSearchQuery] = useState(''); // For admin: search users
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await api.get('/api/chat/unread-count');
      setUnreadCount(res.data.unreadCount || 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  }, []);

  const loadAdmins = useCallback(async () => {
    try {
      const res = await api.get('/api/chat/admins');
      const adminList = res.data.admins || [];
      setAdmins(adminList);
      // Auto-select first admin if available and no user selected
      if (adminList.length > 0 && !selectedUserId) {
        setSelectedUserId(adminList[0]._id);
      }
    } catch (error) {
      console.error('Error loading admins:', error);
    }
  }, [selectedUserId]);

  const loadConversations = useCallback(async () => {
    try {
      const res = await api.get('/api/chat/conversations');
      const conversationList = res.data.conversations || [];
      setConversations(conversationList);
      
      // Auto-select first conversation if available and no user selected
      if (conversationList.length > 0 && !selectedUserId) {
        // Handle both string and object userId
        const firstUserId = typeof conversationList[0].userId === 'object' 
          ? conversationList[0].userId._id || conversationList[0].userId.toString()
          : conversationList[0].userId;
        setSelectedUserId(firstUserId);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      console.error('Error response:', error.response?.data);
    }
  }, [selectedUserId]);

  const loadMessages = useCallback(async () => {
    if (!selectedUserId) return;

    try {
      setLoading(true);
      const res = await api.get(`/api/chat/messages/${selectedUserId}`);
      setMessages(res.data.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedUserId]);

  // Load conversations (for admin) or admins (for user)
  useEffect(() => {
    if (user && isOpen) {
      if (isAdmin) {
        loadConversations();
      } else {
        loadAdmins();
      }
    }
  }, [user, isOpen, isAdmin, loadAdmins, loadConversations]);

  // Load messages when chat is opened and user is selected
  useEffect(() => {
    if (isOpen && selectedUserId && user) {
      loadMessages();
      // Start polling for new messages
      const interval = setInterval(() => {
        loadMessages();
        loadUnreadCount();
        if (isAdmin) {
          loadConversations(); // Refresh conversation list to update unread counts
        }
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(interval);
    }
  }, [isOpen, selectedUserId, user, isAdmin, loadMessages, loadUnreadCount, loadConversations]);

  // Load unread count periodically
  useEffect(() => {
    if (user) {
      loadUnreadCount();
      const interval = setInterval(() => {
        loadUnreadCount();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [user, loadUnreadCount]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, scrollToBottom]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedUserId || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      await api.post('/api/chat/send', {
        receiverId: selectedUserId,
        message: messageText
      });
      
      // Reload messages to show new one
      await loadMessages();
      loadUnreadCount();
      if (isAdmin) {
        loadConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Không thể gửi tin nhắn. Vui lòng thử lại!');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteConversation = async (userId, e) => {
    e.stopPropagation();
    
    if (!window.confirm('Bạn có chắc chắn muốn xóa cuộc trò chuyện này?')) {
      return;
    }

    try {
      await api.delete(`/api/chat/conversation/${userId}`);
      
      // If deleted conversation is currently selected, clear selection
      if (selectedUserId === userId) {
        setSelectedUserId(null);
        setMessages([]);
      }
      
      // Reload conversations
      await loadConversations();
      loadUnreadCount();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Không thể xóa cuộc trò chuyện. Vui lòng thử lại!');
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUserId(userId);
    setMessages([]); // Clear messages while loading new ones
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Reset when opening
      setSelectedUserId(null);
      setMessages([]);
      setSearchQuery('');
    }
  };

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conv =>
    conv.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get selected conversation/user info
  const selectedConversation = isAdmin
    ? conversations.find(c => c.userId === selectedUserId)
    : admins.find(a => a._id === selectedUserId);

  if (!user) return null;

  return (
    <>
      {/* Floating Chat Button */}
      <button
        className={`chat-button ${isOpen ? 'chat-button-open' : ''}`}
        onClick={toggleChat}
        aria-label={isAdmin ? "Mở chat với users" : "Mở chat với admin"}
      >
        {isOpen ? (
          <span className="chat-icon">✕</span>
        ) : (
          <>
            <span className="chat-icon">💬</span>
            {unreadCount > 0 && (
              <span className="chat-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </>
        )}
      </button>

      {/* Chat Modal */}
      <div className={`chat-overlay ${isOpen ? 'chat-overlay-open' : ''}`} onClick={toggleChat}>
        <div className={`chat-modal ${isOpen ? 'chat-modal-open' : ''} ${isAdmin ? 'chat-modal-admin' : ''}`} onClick={(e) => e.stopPropagation()}>
          {/* Chat Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-header-avatar">
                {isAdmin ? '👨‍💼' : '👤'}
              </div>
              <div>
                <h3 className="chat-header-title">
                  {isAdmin ? 'Chat với Users' : 'Chat với Admin'}
                </h3>
                <p className="chat-header-status">
                  {isAdmin
                    ? conversations.length > 0
                      ? `${conversations.length} cuộc trò chuyện`
                      : 'Chưa có cuộc trò chuyện'
                    : admins.length > 0
                    ? `${admins.length} admin online`
                    : 'Đang tải...'}
                </p>
              </div>
            </div>
            <button className="chat-close-button" onClick={toggleChat}>×</button>
          </div>

          <div className="chat-body">
            {/* Sidebar for Admin */}
            {isAdmin && (
              <div className="chat-sidebar">
                <div className="chat-search-container">
                  <input
                    type="text"
                    className="chat-search-input"
                    placeholder="Tìm kiếm user..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <span className="chat-search-icon">🔍</span>
                </div>
                <div className="chat-conversation-list">
                  {filteredConversations.length === 0 ? (
                    <div className="chat-empty-sidebar">
                      {searchQuery ? 'Không tìm thấy user nào' : 'Chưa có cuộc trò chuyện'}
                    </div>
                  ) : (
                    filteredConversations.map((conv) => (
                      <div
                        key={conv.userId}
                        className={`chat-conversation-item ${selectedUserId === conv.userId ? 'chat-conversation-active' : ''}`}
                        onClick={() => handleSelectUser(conv.userId)}
                      >
                        <div className="chat-conversation-avatar">
                          {conv.userRole === 'admin' ? '👨‍💼' : '👤'}
                        </div>
                        <div className="chat-conversation-info">
                          <div className="chat-conversation-name">{conv.userName}</div>
                          <div className="chat-conversation-preview">
                            {conv.lastMessage || 'Chưa có tin nhắn'}
                          </div>
                        </div>
                        <div className="chat-conversation-meta">
                          {conv.unreadCount > 0 && (
                            <span className="chat-conversation-badge">{conv.unreadCount}</span>
                          )}
                          <button
                            className="chat-delete-button"
                            onClick={(e) => handleDeleteConversation(conv.userId, e)}
                            title="Xóa cuộc trò chuyện"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Messages Area */}
            <div className="chat-messages-area">
              {!selectedUserId ? (
                <div className="chat-empty">
                  <p>{isAdmin ? 'Chọn một user để bắt đầu chat' : 'Đang tải admin...'}</p>
                </div>
              ) : (
                <>
                  {/* Messages Container */}
                  <div className="chat-messages" ref={messagesContainerRef}>
                    {loading && messages.length === 0 ? (
                      <div className="chat-loading">Đang tải tin nhắn...</div>
                    ) : messages.length === 0 ? (
                      <div className="chat-empty">
                        <p>Chưa có tin nhắn nào.</p>
                        <p>Hãy bắt đầu cuộc trò chuyện!</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const senderIdStr = typeof msg.senderId === 'object' ? msg.senderId._id || msg.senderId.toString() : msg.senderId.toString();
                        const userIdStr = user.id || user._id || '';
                        const isOwnMessage = senderIdStr === userIdStr;
                        return (
                          <div
                            key={msg._id}
                            className={`chat-message ${isOwnMessage ? 'chat-message-own' : 'chat-message-other'}`}
                          >
                            <div className="chat-message-content">
                              {!isOwnMessage && (
                                <div className="chat-message-name">{msg.senderName}</div>
                              )}
                              <div className="chat-message-text">{msg.message}</div>
                              <div className="chat-message-time">
                                {new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Chat Input */}
                  <form className="chat-input-container" onSubmit={handleSendMessage}>
                    <input
                      type="text"
                      className="chat-input"
                      placeholder={`Nhập tin nhắn cho ${selectedConversation?.userName || '...'}...`}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      className="chat-send-button"
                      disabled={!newMessage.trim() || sending}
                    >
                      {sending ? '⏳' : '📤'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Chat;
