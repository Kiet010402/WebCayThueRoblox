import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import './Profile.css';

function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'personal');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activityLogs, setActivityLogs] = useState([]);
  const [balanceHistory, setBalanceHistory] = useState([]);
  const [accountHistory, setAccountHistory] = useState([]);
  const [rechargeHistory, setRechargeHistory] = useState([]);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotalPages, setActivityTotalPages] = useState(1);
  const [balancePage, setBalancePage] = useState(1);
  const [balanceTotalPages, setBalanceTotalPages] = useState(1);
  const [accountPage, setAccountPage] = useState(1);
  const [accountTotalPages, setAccountTotalPages] = useState(1);
  const [rechargePage, setRechargePage] = useState(1);
  const [rechargeTotalPages, setRechargeTotalPages] = useState(1);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedRejectionReason, setSelectedRejectionReason] = useState('');
  
  // Change password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Copy to clipboard function
  const copyToClipboard = async (text, type) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      // Show success message
      const message = type === 'username' ? 'Đã copy tài khoản!' : 'Đã copy mật khẩu!';
      alert(message);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Không thể copy. Vui lòng thử lại.');
    }
  };

  const fetchUserData = useCallback(async () => {
    try {
      const response = await api.get('/api/users/me');
      // Backend /me returns fields at root; some older responses may nest under user
      const userData = response.data?.user || response.data || null;
      if (!userData) {
        // If API returned but without user info, treat as unauthorized
        navigate('/login');
        return;
      }
      setUser(userData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (error.response?.status === 401 || error.response?.status === 403 || error.response?.status === 404) {
        navigate('/login');
        return;
      }
      setLoading(false);
    }
  }, [navigate]);

  const fetchActivityLogs = useCallback(async () => {
    try {
      const response = await api.get(`/api/users/activity-log?page=${activityPage}&limit=10`);
      setActivityLogs(response.data.logs || []);
      setActivityTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    }
  }, [activityPage]);

  const fetchBalanceHistory = useCallback(async (page = balancePage, limit = 7) => {
    try {
      const response = await api.get(`/api/users/balance-history?page=${page}&limit=${limit}`);
      setBalanceHistory(response.data.history || []);
      setBalanceTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching balance history:', error);
    }
  }, [balancePage]);

  const fetchAccountHistory = useCallback(async () => {
    try {
      const response = await api.get(`/api/users/account-history?page=${accountPage}&limit=5`);
      setAccountHistory(response.data.history || []);
      setAccountTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching account history:', error);
    }
  }, [accountPage]);

  const fetchRechargeHistory = useCallback(async () => {
    try {
      const response = await api.get(`/api/recharge/my-recharges?page=${rechargePage}&limit=5`);
      setRechargeHistory(response.data.recharges || []);
      setRechargeTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching recharge history:', error);
    }
  }, [rechargePage]);

  useEffect(() => {
    // Check if user is logged in by trying to fetch user data
    fetchUserData();
  }, [navigate, fetchUserData]);

  useEffect(() => {
    if (activeTab === 'activity') {
      fetchActivityLogs();
    } else if (activeTab === 'balance') {
      fetchBalanceHistory(balancePage, 7);
    } else if (activeTab === 'account-history') {
      fetchAccountHistory();
    } else if (activeTab === 'recharge-history') {
      fetchRechargeHistory();
    } else if (activeTab === 'personal') {
      // Fetch all balance history for calculating totals
      fetchBalanceHistory(1, 10000);
    }
  }, [activeTab, activityPage, balancePage, accountPage, rechargePage, fetchActivityLogs, fetchBalanceHistory, fetchAccountHistory, fetchRechargeHistory]);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Mật khẩu mới không khớp');
      return;
    }

    try {
      await api.put('/api/users/change-password', {
        currentPassword,
        newPassword,
        confirmPassword
      });
      alert('Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu');
    }
  };

  const handleLogout = async () => {
    try {
      // Call logout API to invalidate session and clear cookie
      await api.post('/api/users/logout');
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if API call fails
    }
    
    // Clear any remaining localStorage items
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Dispatch logout event to update App state
    window.dispatchEvent(new Event('userLoggedOut'));
    
    // Navigate to home
    navigate('/');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Calculate totals from balance history
  const totalRecharged = React.useMemo(() => {
    return balanceHistory
      .filter(item => item.changeAmount > 0)
      .reduce((sum, item) => sum + item.changeAmount, 0);
  }, [balanceHistory]);

  const totalSpent = React.useMemo(() => {
    return balanceHistory
      .filter(item => item.changeAmount < 0)
      .reduce((sum, item) => sum + Math.abs(item.changeAmount), 0);
  }, [balanceHistory]);

  if (loading) {
    return <div className="profile-container"><p>Đang tải...</p></div>;
  }

  if (!user) {
    return <div className="profile-container"><p>Không tìm thấy thông tin user</p></div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-layout">
        <div className="profile-sidebar">
          <div 
            className={`sidebar-item ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            <span className="sidebar-icon">👤</span>
            <span>Thông tin cá nhân</span>
          </div>
          <div 
            className={`sidebar-item ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            <span className="sidebar-icon">🔄</span>
            <span>Nhật ký hoạt động</span>
          </div>
          <div 
            className={`sidebar-item ${activeTab === 'balance' ? 'active' : ''}`}
            onClick={() => setActiveTab('balance')}
          >
            <span className="sidebar-icon">💳</span>
            <span>Biến động số dư</span>
          </div>
          <div 
            className={`sidebar-item ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <span className="sidebar-icon">🔑</span>
            <span>Thay đổi mật khẩu</span>
          </div>
          <div 
            className={`sidebar-item ${activeTab === 'account-history' ? 'active' : ''}`}
            onClick={() => setActiveTab('account-history')}
          >
            <span className="sidebar-icon">🎮</span>
            <span>Lịch sử mua acc</span>
          </div>
          <div 
            className={`sidebar-item ${activeTab === 'recharge-history' ? 'active' : ''}`}
            onClick={() => setActiveTab('recharge-history')}
          >
            <span className="sidebar-icon">💳</span>
            <span>Lịch sử nạp tiền</span>
          </div>
        </div>

        <div className="profile-content">
          {activeTab === 'personal' && (
            <div className="profile-section">
              <div className="wallet-card">
                <h2 className="section-title">Ví của tôi</h2>
                <div className="current-balance">
                  <span className="balance-label">Số dư hiện tại</span>
                  <span className="balance-value">{user.balance?.toLocaleString('vi-VN') || '0'}₫</span>
                </div>
                <div className="balance-summary">
                  <div className="summary-item">
                    <span className="summary-label">Tổng tiền nạp</span>
                    <span className="summary-value">{totalRecharged.toLocaleString('vi-VN')}₫</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Số dư đã sử dụng</span>
                    <span className="summary-value">{totalSpent.toLocaleString('vi-VN')}₫</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Giảm giá</span>
                    <span className="summary-value">{user.discount || 0}%</span>
                  </div>
                </div>
              </div>

              <div className="profile-card">
                <div className="profile-header">
                  <h2 className="section-title">Hồ sơ của bạn</h2>
                  <div className="profile-header-actions">
                  <button className="btn-edit">Chỉnh sửa thông tin</button>
                    <button className="btn-logout-profile" onClick={handleLogout}>Đăng Xuất</button>
                  </div>
                </div>
                <div className="profile-details">
                  <div className="detail-column">
                    <div className="detail-item">
                      <label>Tên đăng nhập</label>
                      <input type="text" value={user.username || ''} readOnly />
                    </div>
                    <div className="detail-item">
                      <label>Họ và Tên</label>
                      <input type="text" value={user.fullName || ''} readOnly />
                    </div>
                    <div className="detail-item">
                      <label>Đăng ký vào lúc</label>
                      <input type="text" value={formatDate(user.createdAt)} readOnly />
                    </div>
                  </div>
                  <div className="detail-column">
                    <div className="detail-item">
                      <label>Địa chỉ Email</label>
                      <input type="email" value={user.email || ''} readOnly />
                    </div>
                    <div className="detail-item">
                      <label>Telegram Chat ID</label>
                      <input type="text" value={user.telegramChatId || ''} readOnly />
                    </div>
                    <div className="detail-item">
                      <label>Số điện thoại</label>
                      <input type="text" value={user.phone || ''} readOnly />
                    </div>
                    <div className="detail-item">
                      <label>Thiết bị</label>
                      <input type="text" value={user.device || 'N/A'} readOnly />
                    </div>
                    <div className="detail-item">
                      <label>Đăng nhập gần nhất</label>
                      <input type="text" value={formatDate(user.lastLogin)} readOnly />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="profile-section">
              <h2 className="section-title">Nhật ký hoạt động</h2>
              <div className="table-controls">
                <div className="control-left">
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Thao tác"
                  />
                  <button className="btn-search">
                    <span className="search-icon">🔍</span>
                    Tìm kiếm
                  </button>
                  <button className="btn-clear-filter">
                    <span className="trash-icon">🗑️</span>
                    Bỏ lọc
                  </button>
                </div>
              </div>
              <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  border: '1px solid #ddd',
                  backgroundColor: 'white'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#2196F3', color: 'white' }}>
                      <th style={{ 
                        padding: '0.75rem', 
                        border: '1px solid #ddd',
                        textAlign: 'left',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        width: '30%'
                      }}>Thời gian</th>
                      <th style={{ 
                        padding: '0.75rem', 
                        border: '1px solid #ddd',
                        textAlign: 'left',
                        fontWeight: 'bold',
                        fontSize: '0.9rem'
                      }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                {activityLogs.length === 0 ? (
                      <tr>
                        <td colSpan="2" style={{ 
                          padding: '2rem', 
                          textAlign: 'center', 
                          color: '#999',
                          border: '1px solid #ddd'
                        }}>
                          Chưa có hoạt động nào
                        </td>
                      </tr>
                ) : (
                      activityLogs.map((log, index) => (
                        <tr 
                          key={log._id} 
                          style={{ 
                            backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9',
                            borderBottom: '1px solid #ddd'
                          }}
                        >
                          <td style={{ 
                            padding: '0.75rem', 
                            border: '1px solid #ddd',
                            color: '#333',
                            fontSize: '0.9rem'
                          }}>
                            {formatDate(log.createdAt)}
                          </td>
                          <td style={{ 
                            padding: '0.75rem', 
                            border: '1px solid #ddd',
                            color: '#333',
                            fontSize: '0.9rem'
                          }}>
                            {log.action}
                          </td>
                        </tr>
                  ))
                )}
                  </tbody>
                </table>
              </div>
              {activityTotalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => setActivityPage(prev => Math.max(1, prev - 1))}
                    disabled={activityPage === 1}
                  >
                    ← Trước
                  </button>
                  <span>Trang {activityPage} / {activityTotalPages}</span>
                  <button
                    onClick={() => setActivityPage(prev => Math.min(activityTotalPages, prev + 1))}
                    disabled={activityPage === activityTotalPages}
                  >
                    Sau →
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'balance' && (
            <div className="profile-section">
              <h2 className="section-title">Biến động số dư</h2>
              <div className="table-controls">
                <div className="control-left">
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Lý do"
                  />
                  <button className="btn-search">
                    <span className="search-icon">🔍</span>
                    Tìm kiếm
                  </button>
                  <button className="btn-clear-filter">
                    <span className="trash-icon">🗑️</span>
                    Bỏ lọc
                  </button>
                </div>
              </div>
              <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  border: '1px solid #ddd',
                  backgroundColor: 'white'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#2196F3', color: 'white' }}>
                      <th style={{ 
                        padding: '0.75rem', 
                        border: '1px solid #ddd',
                        textAlign: 'left',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        width: '18%'
                      }}>Thời gian</th>
                      <th style={{ 
                        padding: '0.75rem', 
                        border: '1px solid #ddd',
                        textAlign: 'left',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        width: '14%'
                      }}>Số dư ban đầu</th>
                      <th style={{ 
                        padding: '0.75rem', 
                        border: '1px solid #ddd',
                        textAlign: 'left',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        width: '14%'
                      }}>Số dư thay đổi</th>
                      <th style={{ 
                        padding: '0.75rem', 
                        border: '1px solid #ddd',
                        textAlign: 'left',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        width: '14%'
                      }}>Số dư hiện tại</th>
                      <th style={{ 
                        padding: '0.75rem', 
                        border: '1px solid #ddd',
                        textAlign: 'left',
                        fontWeight: 'bold',
                        fontSize: '0.9rem'
                      }}>Lý do</th>
                    </tr>
                  </thead>
                  <tbody>
                {balanceHistory.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ 
                          padding: '2rem', 
                          textAlign: 'center', 
                          color: '#999',
                          border: '1px solid #ddd'
                        }}>
                          Chưa có lịch sử biến động
                        </td>
                      </tr>
                ) : (
                      balanceHistory.map((item, index) => (
                        <tr 
                          key={item._id} 
                          style={{ 
                            backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9',
                            borderBottom: '1px solid #ddd'
                          }}
                        >
                          <td style={{ 
                            padding: '0.75rem', 
                            border: '1px solid #ddd',
                            color: '#333',
                            fontSize: '0.9rem'
                          }}>
                            {formatDate(item.createdAt)}
                          </td>
                          <td style={{ 
                            padding: '0.75rem', 
                            border: '1px solid #ddd',
                            color: '#333',
                            fontSize: '0.9rem'
                          }}>
                            {item.initialBalance?.toLocaleString('vi-VN') || '0'}₫
                          </td>
                          <td style={{ 
                            padding: '0.75rem', 
                            border: '1px solid #ddd',
                            color: item.changeAmount >= 0 ? '#4caf50' : '#f44336',
                            fontSize: '0.9rem',
                            fontWeight: 'bold'
                          }}>
                        {item.changeAmount >= 0 ? '+' : ''}{item.changeAmount?.toLocaleString('vi-VN') || '0'}₫
                          </td>
                          <td style={{ 
                            padding: '0.75rem', 
                            border: '1px solid #ddd',
                            color: '#333',
                            fontSize: '0.9rem'
                          }}>
                            {item.currentBalance?.toLocaleString('vi-VN') || '0'}₫
                          </td>
                          <td style={{ 
                            padding: '0.75rem', 
                            border: '1px solid #ddd',
                            color: '#333',
                            fontSize: '0.9rem'
                          }}>
                            {item.reason}
                          </td>
                        </tr>
                  ))
                )}
                  </tbody>
                </table>
              </div>
              {balanceTotalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => setBalancePage(prev => Math.max(1, prev - 1))}
                    disabled={balancePage === 1}
                  >
                    ← Trước
                  </button>
                  <span>Trang {balancePage} / {balanceTotalPages}</span>
                  <button
                    onClick={() => setBalancePage(prev => Math.min(balanceTotalPages, prev + 1))}
                    disabled={balancePage === balanceTotalPages}
                  >
                    Sau →
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'password' && (
            <div className="profile-section">
              <h2 className="section-title">Thay đổi mật khẩu</h2>
              <div className="password-form">
                <div className="form-group">
                  <label>Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                </div>
                <div className="form-group">
                  <label>Mật khẩu mới</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                  />
                </div>
                <div className="form-group">
                  <label>Nhập lại mật khẩu mới</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </div>
                <button className="btn-submit" onClick={handleChangePassword}>
                  Đổi mật khẩu
                </button>
              </div>
            </div>
          )}

          {activeTab === 'account-history' && (
            <div className="profile-section">
              <h2 className="section-title">🎮 Lịch sử mua acc</h2>
              {accountHistory.length === 0 ? (
                <div className="empty-state">Chưa có lịch sử mua acc nào</div>
              ) : (
                <>
                  <div className="account-history-list">
                    {accountHistory.map((order) => {
                      const accountItem = order.items && order.items[0] ? order.items[0] : null;
                      return (
                        <div key={order._id} className="account-history-item">
                          {accountItem ? (
                            <>
                              <div className="account-history-image">
                                {accountItem.image ? (
                                  <img src={accountItem.image} alt={accountItem.code} />
                                ) : (
                                  <div className="account-placeholder">🎮</div>
                                )}
                              </div>
                              <div className="account-history-info">
                                <div className="account-history-header">
                                  <h3>{accountItem.name || accountItem.code}</h3>
                                  <span className="account-code">MS: {accountItem.code}</span>
                                </div>
                                <div className="account-history-details">
                                  <div className="detail-item">
                                    <label>Game:</label>
                                    <span>{accountItem.game}</span>
                                  </div>
                                  <div className="detail-item">
                                    <label>Tài khoản:</label>
                                    <div className="credential-wrapper">
                                    <span className="credential">{accountItem.username || 'N/A'}</span>
                                      {accountItem.username && (
                                        <button
                                          className="copy-btn"
                                          onClick={() => copyToClipboard(accountItem.username, 'username')}
                                          title="Copy tài khoản"
                                        >
                                          📋
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <div className="detail-item">
                                    <label>Mật khẩu:</label>
                                    <div className="credential-wrapper">
                                    <span className="credential">{accountItem.password || 'N/A'}</span>
                                      {accountItem.password && (
                                        <button
                                          className="copy-btn"
                                          onClick={() => copyToClipboard(accountItem.password, 'password')}
                                          title="Copy mật khẩu"
                                        >
                                          📋
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <div className="detail-item">
                                    <label>Giá:</label>
                                    <span className="price">{order.totalAmount?.toLocaleString('vi-VN')}₫</span>
                                  </div>
                                  <div className="detail-item">
                                    <label>Ngày mua:</label>
                                    <span>{formatDate(order.createdAt)}</span>
                                  </div>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="account-history-info">
                              <p>Thông tin account không khả dụng</p>
                              <p>Ngày mua: {formatDate(order.createdAt)}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {accountTotalPages > 1 && (
                    <div className="pagination">
                      <button
                        onClick={() => setAccountPage(prev => Math.max(1, prev - 1))}
                        disabled={accountPage === 1}
                      >
                        ← Trước
                      </button>
                      <span>Trang {accountPage} / {accountTotalPages}</span>
                      <button
                        onClick={() => setAccountPage(prev => Math.min(accountTotalPages, prev + 1))}
                        disabled={accountPage === accountTotalPages}
                      >
                        Sau →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'recharge-history' && (
            <div className="profile-section">
              <h2 className="section-title">💳 Lịch sử nạp tiền</h2>
              {rechargeHistory.length === 0 ? (
                <div className="empty-state">Chưa có lịch sử nạp tiền nào</div>
              ) : (
                <>
                  <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                    <table style={{ 
                      width: '100%', 
                      borderCollapse: 'collapse',
                      border: '1px solid #ddd',
                      backgroundColor: 'white'
                    }}>
                      <thead>
                        <tr style={{ backgroundColor: '#2196F3', color: 'white' }}>
                          <th style={{ 
                            padding: '0.75rem', 
                            border: '1px solid #ddd',
                            textAlign: 'left',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            whiteSpace: 'nowrap'
                          }}>Ngày</th>
                          <th style={{ 
                            padding: '0.75rem', 
                            border: '1px solid #ddd',
                            textAlign: 'left',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            whiteSpace: 'nowrap'
                          }}>Số tiền</th>
                          <th style={{ 
                            padding: '0.75rem', 
                            border: '1px solid #ddd',
                            textAlign: 'left',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            whiteSpace: 'nowrap'
                          }}>Phương thức</th>
                          <th style={{ 
                            padding: '0.75rem', 
                            border: '1px solid #ddd',
                            textAlign: 'left',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            whiteSpace: 'nowrap'
                          }}>Trạng thái</th>
                          <th style={{ 
                            padding: '0.75rem', 
                            border: '1px solid #ddd',
                            textAlign: 'center',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            whiteSpace: 'nowrap'
                          }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rechargeHistory.map((tx, index) => {
                          const getPaymentMethodName = () => {
                            if (tx.paymentMethod === 'bank') return 'Chuyển Khoản';
                            if (tx.paymentMethod === 'momo') return 'MoMo';
                            if (tx.paymentMethod === 'card') return 'Thẻ Cào';
                            return 'Thẻ Siêu Rẻ';
                          };

                          const getStatusDisplay = () => {
                            if (tx.status === 'Hoàn thành') return '✅ Hoàn thành';
                            if (tx.status === 'Đang xử lí') return '⏳ Đang xử lí';
                            return '❌ Từ chối';
                          };

                          const getStatusColor = () => {
                            if (tx.status === 'Hoàn thành') return '#4CAF50';
                            if (tx.status === 'Đang xử lí') return '#FF9800';
                            return '#f44336';
                          };

                          return (
                            <tr 
                              key={tx._id} 
                              style={{ 
                                backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9',
                                borderBottom: '1px solid #ddd'
                              }}
                            >
                              <td style={{ 
                                padding: '0.75rem', 
                                border: '1px solid #ddd',
                                color: '#333',
                                fontSize: '0.9rem',
                                whiteSpace: 'nowrap'
                              }}>
                                {formatDate(tx.createdAt)}
                              </td>
                              <td style={{ 
                                padding: '0.75rem', 
                                border: '1px solid #ddd',
                                color: '#333',
                                fontSize: '0.9rem',
                                whiteSpace: 'nowrap'
                              }}>
                                {tx.status === 'Hoàn thành' && (tx.cardFee > 0 || tx.bonusAmount > 0) ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    {/* Số tiền gốc (gạch ngang) */}
                                    {(tx.originalAmount || tx.amount) && (
                                      <div style={{ fontSize: '0.85rem', color: '#999', textDecoration: 'line-through' }}>
                                        {(tx.originalAmount || tx.amount).toLocaleString('vi-VN')}đ
                                      </div>
                                    )}
                                    {/* Số tiền thực nhận */}
                                    <div style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                                      +{tx.amount.toLocaleString('vi-VN')}đ
                                    </div>
                                    {/* Phí thẻ */}
                                    {tx.cardFee > 0 && (
                                      <div style={{ fontSize: '0.75rem', color: '#d32f2f' }}>
                                        (-{tx.cardFee.toLocaleString('vi-VN')}đ phí {tx.cardFeePercent || 0}%)
                                      </div>
                                    )}
                                    {/* Khuyến mãi */}
                                    {tx.bonusAmount > 0 && (
                                      <div style={{ fontSize: '0.75rem', color: '#4CAF50' }}>
                                        (+{tx.bonusAmount.toLocaleString('vi-VN')}đ khuyến mãi {tx.promotionPercent || 0}%)
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div>+{tx.amount.toLocaleString('vi-VN')}đ</div>
                                )}
                              </td>
                              <td style={{ 
                                padding: '0.75rem', 
                                border: '1px solid #ddd',
                                color: '#333',
                                fontSize: '0.9rem',
                                whiteSpace: 'nowrap'
                              }}>
                                {getPaymentMethodName()}
                              </td>
                              <td style={{ 
                                padding: '0.75rem', 
                                border: '1px solid #ddd',
                                color: getStatusColor(),
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap'
                              }}>
                                {getStatusDisplay()}
                              </td>
                              <td style={{ 
                                padding: '0.75rem', 
                                border: '1px solid #ddd',
                                textAlign: 'center',
                                whiteSpace: 'nowrap'
                              }}>
                                {tx.status === 'Từ chối' && tx.rejectionReason && (
                                  <button
                                    onClick={() => {
                                      setSelectedRejectionReason(tx.rejectionReason);
                                      setShowRejectionModal(true);
                                    }}
                                    style={{
                                      padding: '0.4rem 0.8rem',
                                      background: '#2196F3',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '0.85rem',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    Chi tiết
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {rechargeTotalPages > 1 && (
                    <div className="pagination">
                      <button
                        onClick={() => setRechargePage(prev => Math.max(1, prev - 1))}
                        disabled={rechargePage === 1}
                      >
                        ← Trước
                      </button>
                      <span>Trang {rechargePage} / {rechargeTotalPages}</span>
                      <button
                        onClick={() => setRechargePage(prev => Math.min(rechargeTotalPages, prev + 1))}
                        disabled={rechargePage === rechargeTotalPages}
                      >
                        Sau →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Rejection Reason Modal */}
          {showRejectionModal && (
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000
              }}
              onClick={() => setShowRejectionModal(false)}
            >
              <div 
                style={{
                  background: 'white',
                  padding: '2rem',
                  borderRadius: '8px',
                  maxWidth: '500px',
                  width: '90%',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 style={{ marginTop: 0, color: '#333' }}>⚠️ Lý do từ chối</h3>
                <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                  {selectedRejectionReason}
                </p>
                <button
                  onClick={() => setShowRejectionModal(false)}
                  style={{
                    padding: '0.6rem 1.5rem',
                    background: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 'bold'
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;

