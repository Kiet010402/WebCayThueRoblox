import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './Profile.css';

function Profile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activityLogs, setActivityLogs] = useState([]);
  const [balanceHistory, setBalanceHistory] = useState([]);
  const [accountHistory, setAccountHistory] = useState([]);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotalPages, setActivityTotalPages] = useState(1);
  const [balancePage, setBalancePage] = useState(1);
  const [balanceTotalPages, setBalanceTotalPages] = useState(1);
  const [accountPage, setAccountPage] = useState(1);
  const [accountTotalPages, setAccountTotalPages] = useState(1);
  
  // Change password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    fetchUserData();
  }, [navigate]);

  useEffect(() => {
    if (activeTab === 'activity') {
      fetchActivityLogs();
    } else if (activeTab === 'balance') {
      fetchBalanceHistory(balancePage, 7);
    } else if (activeTab === 'account-history') {
      fetchAccountHistory();
    } else if (activeTab === 'personal') {
      // Fetch all balance history for calculating totals
      fetchBalanceHistory(1, 10000);
    }
  }, [activeTab, activityPage, balancePage, accountPage]);

  const fetchUserData = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await api.get('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLogs = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await api.get(`/api/users/activity-log?page=${activityPage}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActivityLogs(response.data.logs || []);
      setActivityTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    }
  };

  const fetchBalanceHistory = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await api.get(`/api/users/balance-history?page=${balancePage}&limit=7`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBalanceHistory(response.data.history || []);
      setBalanceTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching balance history:', error);
    }
  };

  const fetchAccountHistory = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await api.get(`/api/users/account-history?page=${accountPage}&limit=5`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAccountHistory(response.data.history || []);
      setAccountTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching account history:', error);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Mật khẩu mới không khớp');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      await api.put('/api/users/change-password', {
        currentPassword,
        newPassword,
        confirmPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu');
    }
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
                  <button className="btn-edit">Chỉnh sửa thông tin</button>
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
              <div className="activity-table">
                <div className="table-header">
                  <div className="col-time">Thời gian</div>
                  <div className="col-action">Thao tác</div>
                </div>
                {activityLogs.length === 0 ? (
                  <div className="empty-state">Chưa có hoạt động nào</div>
                ) : (
                  activityLogs.map(log => (
                    <div key={log._id} className="table-row">
                      <div className="col-time">{formatDate(log.createdAt)}</div>
                      <div className="col-action">{log.action}</div>
                    </div>
                  ))
                )}
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
              <div className="balance-table">
                <div className="table-header">
                  <div className="col-time">Thời gian</div>
                  <div className="col-initial">Số dư ban đầu</div>
                  <div className="col-change">Số dư thay đổi</div>
                  <div className="col-current">Số dư hiện tại</div>
                  <div className="col-reason">Lý do</div>
                </div>
                {balanceHistory.length === 0 ? (
                  <div className="empty-state">Chưa có lịch sử biến động</div>
                ) : (
                  balanceHistory.map(item => (
                    <div key={item._id} className="table-row">
                      <div className="col-time">{formatDate(item.createdAt)}</div>
                      <div className="col-initial">{item.initialBalance?.toLocaleString('vi-VN') || '0'}₫</div>
                      <div className={`col-change ${item.changeAmount >= 0 ? 'positive' : 'negative'}`}>
                        {item.changeAmount >= 0 ? '+' : ''}{item.changeAmount?.toLocaleString('vi-VN') || '0'}₫
                      </div>
                      <div className="col-current">{item.currentBalance?.toLocaleString('vi-VN') || '0'}₫</div>
                      <div className="col-reason">{item.reason}</div>
                    </div>
                  ))
                )}
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
                                    <span className="credential">{accountItem.username || 'N/A'}</span>
                                  </div>
                                  <div className="detail-item">
                                    <label>Mật khẩu:</label>
                                    <span className="credential">{accountItem.password || 'N/A'}</span>
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
        </div>
      </div>
    </div>
  );
}

export default Profile;

