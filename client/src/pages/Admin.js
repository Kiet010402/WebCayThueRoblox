import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [recharges, setRecharges] = useState([]);
  const [news, setNews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [addBalanceAmount, setAddBalanceAmount] = useState('');
  const [showAddBalanceModal, setShowAddBalanceModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsCategory, setNewsCategory] = useState('📢 Thông Báo');
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [pendingRechargesCount, setPendingRechargesCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!token || !user || user.role !== 'admin') {
      navigate('/login');
      return;
    }

    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [usersRes, ordersRes, rechargesRes, statsRes, newsRes] = await Promise.all([
        axios.get('/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/admin/orders', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/admin/recharges', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/news')
      ]);
      
      console.log('Fetched data:', {
        users: usersRes.data,
        orders: ordersRes.data,
        recharges: rechargesRes.data,
        stats: statsRes.data,
        news: newsRes.data
      });
      
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      setRecharges(Array.isArray(rechargesRes.data) ? rechargesRes.data : []);
      setStats(statsRes.data);
      setNews(Array.isArray(newsRes.data) ? newsRes.data : []);
      
      // Count pending orders and recharges
      const pendingOrders = Array.isArray(ordersRes.data) ? ordersRes.data.filter(order => order.status === 'Đang xử lí') : [];
      const pendingRecharges = Array.isArray(rechargesRes.data) ? rechargesRes.data.filter(recharge => recharge.status === 'Đang xử lí') : [];
      setPendingOrdersCount(pendingOrders.length);
      setPendingRechargesCount(pendingRecharges.length);
    } catch (error) {
      console.error('Error fetching data:', error);
      console.error('Error response:', error.response?.data);
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        navigate('/login');
      } else {
        alert('Có lỗi xảy ra khi tải dữ liệu: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddBalance = async () => {
    if (!addBalanceAmount || addBalanceAmount <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      await axios.post(`/api/admin/users/${selectedUser._id}/add-balance`, 
        { amount: parseFloat(addBalanceAmount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Cộng tiền thành công!');
      setShowAddBalanceModal(false);
      setAddBalanceAmount('');
      setSelectedUser(null);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`/api/admin/orders/${orderId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleApproveRecharge = async (rechargeId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`/api/admin/recharges/${rechargeId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Duyệt nạp tiền thành công!');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleRejectRecharge = async (rechargeId) => {
    if (!window.confirm('Bạn có chắc chắn muốn từ chối yêu cầu nạp tiền này?')) {
      return;
    }
    const token = localStorage.getItem('token');
    try {
      await axios.put(`/api/admin/recharges/${rechargeId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Từ chối nạp tiền thành công!');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleCreateNews = async () => {
    if (!newsTitle || !newsContent) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }
    const token = localStorage.getItem('token');
    try {
      await axios.post('/api/news', 
        { title: newsTitle, content: newsContent, category: newsCategory },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Tạo tin tức thành công!');
      setShowNewsModal(false);
      setNewsTitle('');
      setNewsContent('');
      setNewsCategory('📢 Thông Báo');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDeleteNews = async (newsId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tin tức này?')) {
      return;
    }
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`/api/news/${newsId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Xóa tin tức thành công!');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleViewUserDetails = async (userId) => {
    const token = localStorage.getItem('token');
    setLoadingUserDetails(true);
    try {
      const response = await axios.get(`/api/admin/users/${userId}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserDetails(response.data);
      setShowUserDetailModal(true);
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi tải thông tin user');
    } finally {
      setLoadingUserDetails(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return <div className="admin-container"><p>Đang tải...</p></div>;
  }

  return (
    <div className="admin-container">
      <h1>Quản Lý Hệ Thống</h1>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Tổng Users</h3>
            <p className="stat-value">{stats.totalUsers}</p>
          </div>
          <div className="stat-card">
            <h3>Tổng Đơn Hàng</h3>
            <p className="stat-value">{stats.totalOrders}</p>
          </div>
          <div className="stat-card">
            <h3>Doanh Thu</h3>
            <p className="stat-value">{stats.totalRevenue.toLocaleString('vi-VN')}đ</p>
          </div>
        </div>
      )}

      <div className="admin-tabs">
        <button 
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          Quản Lý Users
        </button>
        <button 
          className={activeTab === 'orders' ? 'active' : ''}
          onClick={() => setActiveTab('orders')}
          style={{ position: 'relative' }}
        >
          Quản Lý Đơn Hàng
          {pendingOrdersCount > 0 && (
            <span className="notification-badge">{pendingOrdersCount}</span>
          )}
        </button>
        <button 
          className={activeTab === 'recharges' ? 'active' : ''}
          onClick={() => setActiveTab('recharges')}
          style={{ position: 'relative' }}
        >
          Quản Lý Nạp Tiền
          {pendingRechargesCount > 0 && (
            <span className="notification-badge">{pendingRechargesCount}</span>
          )}
        </button>
        <button 
          className={activeTab === 'news' ? 'active' : ''}
          onClick={() => setActiveTab('news')}
        >
          Quản Lý Tin Tức
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="users-table">
          <div className="table-header">
            <div className="col-username">Username</div>
            <div className="col-email">Email</div>
            <div className="col-balance">Số Dư</div>
            <div className="col-role">Role</div>
            <div className="col-action">Hành Động</div>
          </div>
          {users.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
              Chưa có user nào
            </div>
          ) : (
            users.map(user => (
              <div key={user._id} className="table-row">
                <div className="col-username">{user.username}</div>
                <div className="col-email">{user.email}</div>
                <div className="col-balance">{user.balance?.toLocaleString('vi-VN') || '0'}đ</div>
                <div className="col-role">
                  <span className={`role-badge ${user.role}`}>{user.role}</span>
                </div>
                <div className="col-action">
                  <button 
                    className="btn-view-detail"
                    onClick={() => handleViewUserDetails(user._id)}
                    style={{ marginRight: '0.5rem', padding: '0.5rem 1rem', background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Chi Tiết
                  </button>
                  <button 
                    className="btn-add-balance"
                    onClick={() => {
                      setSelectedUser(user);
                      setShowAddBalanceModal(true);
                    }}
                  >
                    + Tiền
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'recharges' && (
        <div className="recharges-table">
          <div className="table-header">
            <div className="col-date">Ngày</div>
            <div className="col-user">User</div>
            <div className="col-amount">Số Tiền</div>
            <div className="col-method">Phương Thức</div>
            <div className="col-bill">Bill</div>
            <div className="col-status">Trạng Thái</div>
            <div className="col-action">Hành Động</div>
          </div>
          {recharges.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
              Chưa có yêu cầu nạp tiền nào
            </div>
          ) : (
            recharges.map(recharge => (
              <div key={recharge._id} className="table-row">
                <div className="col-date">{formatDate(recharge.createdAt)}</div>
                <div className="col-user">{recharge.userId?.username || 'N/A'}</div>
                <div className="col-amount">{recharge.amount.toLocaleString('vi-VN')}đ</div>
                <div className="col-method">{recharge.paymentMethod === 'bank' ? 'Chuyển Khoản' : 'MoMo'}</div>
                <div className="col-bill">
                  <button 
                    className="btn-view-bill"
                    onClick={() => {
                      setSelectedBill(recharge.billImage);
                      setShowBillModal(true);
                    }}
                  >
                    Xem Bill
                  </button>
                </div>
                <div className="col-status">
                  <span className={`status-badge status-${recharge.status.replace(/\s+/g, '')}`}>
                    {recharge.status}
                  </span>
                </div>
                <div className="col-action">
                  {recharge.status === 'Đang xử lí' && (
                    <>
                      <button 
                        className="btn-approve"
                        onClick={() => handleApproveRecharge(recharge._id)}
                      >
                        Duyệt
                      </button>
                      <button 
                        className="btn-reject"
                        onClick={() => handleRejectRecharge(recharge._id)}
                      >
                        Từ chối
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="orders-table">
          <div className="table-header">
            <div className="col-date">Ngày</div>
            <div className="col-user">User</div>
            <div className="col-order">Đơn Hàng</div>
            <div className="col-amount">Số Tiền</div>
            <div className="col-status">Trạng Thái</div>
            <div className="col-action">Hành Động</div>
          </div>
          {orders.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
              Chưa có đơn hàng nào
            </div>
          ) : (
            orders.map(order => (
              <div key={order._id} className="table-row">
                <div className="col-date">{formatDate(order.createdAt)}</div>
                <div className="col-user">{order.userId?.username || 'N/A'}</div>
                <div className="col-order">
                  {order.orderType === 'service' 
                    ? `${order.serviceName} - ${order.gameName}`
                    : 'Đơn hàng sản phẩm'
                  }
                </div>
                <div className="col-amount">{order.totalAmount.toLocaleString('vi-VN')}đ</div>
                <div className="col-status">
                <select 
                  value={order.status}
                  onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                  className="status-select"
                >
                  <option value="Đang xử lí">Đang xử lí</option>
                  <option value="Đang cày">Đang cày</option>
                  <option value="Hoàn thành">Hoàn thành</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                </div>
                <div className="col-action">
                  <button 
                    className="btn-detail"
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowOrderDetailModal(true);
                    }}
                  >
                    Chi Tiết
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'news' && (
        <div className="news-management">
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Danh Sách Tin Tức</h3>
            <button 
              className="btn-confirm"
              onClick={() => setShowNewsModal(true)}
              style={{ padding: '0.5rem 1rem' }}
            >
              + Thêm Tin Tức
            </button>
          </div>
          {news.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
              Chưa có tin tức nào
            </div>
          ) : (
            <div className="news-list">
              {news.map(item => (
                <div key={item._id} style={{ 
                  background: '#f5f5f5', 
                  padding: '1rem', 
                  marginBottom: '1rem', 
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      {item.category || '📢 Thông Báo'}
                    </div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>{item.title}</h4>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>
                      {item.content.length > 100 ? item.content.substring(0, 100) + '...' : item.content}
                    </p>
                    <div style={{ color: '#999', fontSize: '0.85rem' }}>
                      📅 {formatDate(item.createdAt)}
                    </div>
                  </div>
                  <button 
                    className="btn-reject"
                    onClick={() => handleDeleteNews(item._id)}
                    style={{ marginLeft: '1rem', padding: '0.5rem 1rem' }}
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showAddBalanceModal && (
        <div className="modal-overlay" onClick={() => setShowAddBalanceModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Cộng Tiền Cho User</h2>
            <p><strong>User:</strong> {selectedUser?.username}</p>
            <p><strong>Số dư hiện tại:</strong> {selectedUser?.balance?.toLocaleString('vi-VN') || '0'}đ</p>
            <div className="form-group">
              <label>Số tiền cộng thêm:</label>
              <input
                type="number"
                value={addBalanceAmount}
                onChange={(e) => setAddBalanceAmount(e.target.value)}
                placeholder="Nhập số tiền"
                min="1"
              />
            </div>
            <div className="modal-actions">
              <button onClick={handleAddBalance} className="btn-confirm">Xác Nhận</button>
              <button onClick={() => setShowAddBalanceModal(false)} className="btn-cancel">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {showBillModal && (
        <div className="modal-overlay" onClick={() => setShowBillModal(false)}>
          <div className="modal-content modal-bill" onClick={(e) => e.stopPropagation()}>
            <h2>Hình Bill</h2>
            {selectedBill && (
              <img src={selectedBill} alt="Bill" style={{ maxWidth: '100%', maxHeight: '70vh', marginTop: '1rem' }} />
            )}
            <div className="modal-actions">
              <button onClick={() => setShowBillModal(false)} className="btn-cancel">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {showOrderDetailModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowOrderDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h2>Chi Tiết Đơn Hàng</h2>
            <div style={{ marginTop: '1rem', lineHeight: '1.8' }}>
              <p><strong>User:</strong> {selectedOrder.userId?.username || 'N/A'}</p>
              <p><strong>Ngày tạo:</strong> {formatDate(selectedOrder.createdAt)}</p>
              <p><strong>Loại đơn:</strong> {selectedOrder.orderType === 'service' ? 'Dịch vụ' : 'Sản phẩm'}</p>
              <p><strong>Tổng tiền:</strong> {selectedOrder.totalAmount.toLocaleString('vi-VN')}đ</p>
              <p><strong>Trạng thái:</strong> {selectedOrder.status}</p>
              
              {selectedOrder.orderType === 'service' && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
                  <p><strong>Tên game:</strong> {selectedOrder.gameName || 'N/A'}</p>
                  <p><strong>Dịch vụ:</strong> {selectedOrder.serviceName || 'N/A'}</p>
                  {selectedOrder.serviceCategory && <p><strong>Loại dịch vụ:</strong> {selectedOrder.serviceCategory}</p>}
                  {selectedOrder.robloxUsername && <p><strong>Tên đăng nhập Roblox:</strong> {selectedOrder.robloxUsername}</p>}
                  {selectedOrder.robloxPassword && <p><strong>Mật khẩu đăng nhập Roblox:</strong> {selectedOrder.robloxPassword}</p>}
                  {selectedOrder.backupCode && <p><strong>Backup Code:</strong> {selectedOrder.backupCode}</p>}
                  {selectedOrder.notes && <p><strong>Ghi chú đơn hàng:</strong> {selectedOrder.notes}</p>}
                </div>
              )}
              
              {selectedOrder.orderType === 'product' && selectedOrder.items && selectedOrder.items.length > 0 && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
                  <p><strong>Sản phẩm:</strong></p>
                  <ul>
                    {selectedOrder.items.map((item, idx) => (
                      <li key={idx}>{item.name} - Số lượng: {item.quantity} - Giá: {item.price?.toLocaleString('vi-VN') || '0'}đ</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowOrderDetailModal(false)} className="btn-cancel">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {showNewsModal && (
        <div className="modal-overlay" onClick={() => setShowNewsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h2>Thêm Tin Tức</h2>
            <div className="form-group">
              <label>Tiêu đề:</label>
              <input
                type="text"
                value={newsTitle}
                onChange={(e) => setNewsTitle(e.target.value)}
                placeholder="Nhập tiêu đề"
              />
            </div>
            <div className="form-group">
              <label>Nội dung:</label>
              <textarea
                value={newsContent}
                onChange={(e) => setNewsContent(e.target.value)}
                placeholder="Nhập nội dung"
                style={{ width: '100%', minHeight: '150px', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '6px', fontFamily: 'inherit', fontSize: '1rem', boxSizing: 'border-box' }}
              />
            </div>
            <div className="form-group">
              <label>Danh mục:</label>
              <select
                value={newsCategory}
                onChange={(e) => setNewsCategory(e.target.value)}
                style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem' }}
              >
                <option value="📢 Thông Báo">📢 Thông Báo</option>
                <option value="🎁 Khuyến Mãi">🎁 Khuyến Mãi</option>
                <option value="📚 Hướng Dẫn">📚 Hướng Dẫn</option>
              </select>
            </div>
            <div className="modal-actions">
              <button onClick={handleCreateNews} className="btn-confirm">Tạo Tin Tức</button>
              <button onClick={() => {
                setShowNewsModal(false);
                setNewsTitle('');
                setNewsContent('');
                setNewsCategory('📢 Thông Báo');
              }} className="btn-cancel">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {showUserDetailModal && userDetails && (
        <div className="modal-overlay" onClick={() => setShowUserDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2>Chi Tiết User</h2>
            
            <div style={{ marginTop: '1rem' }}>
              <h3>📋 Lịch Sử Đơn Hàng</h3>
              {userDetails.orders.length === 0 ? (
                <p style={{ color: '#999', padding: '1rem' }}>Chưa có đơn hàng nào</p>
              ) : (
                <div style={{ marginTop: '0.5rem', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1.5fr', background: '#f5f5f5', padding: '0.8rem', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>
                    <div>Ngày</div>
                    <div>Đơn Hàng</div>
                    <div>Số Tiền</div>
                    <div>Trạng Thái</div>
                  </div>
                  {userDetails.orders.map(order => (
                    <div key={order._id} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1.5fr', padding: '0.8rem', borderBottom: '1px solid #eee' }}>
                      <div>{formatDate(order.createdAt)}</div>
                      <div>{order.orderType === 'service' ? `${order.serviceName} - ${order.gameName}` : 'Đơn hàng sản phẩm'}</div>
                      <div>{order.totalAmount?.toLocaleString('vi-VN') || '0'}đ</div>
                      <div>{order.status}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: '2rem' }}>
              <h3>💰 Lịch Sử Nạp Tiền</h3>
              {userDetails.recharges.length === 0 ? (
                <p style={{ color: '#999', padding: '1rem' }}>Chưa có lịch sử nạp tiền nào</p>
              ) : (
                <div style={{ marginTop: '0.5rem', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.5fr', background: '#f5f5f5', padding: '0.8rem', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>
                    <div>Ngày</div>
                    <div>Số Tiền</div>
                    <div>Phương Thức</div>
                    <div>Trạng Thái</div>
                  </div>
                  {userDetails.recharges.map(recharge => (
                    <div key={recharge._id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.5fr', padding: '0.8rem', borderBottom: '1px solid #eee' }}>
                      <div>{formatDate(recharge.createdAt)}</div>
                      <div>{recharge.amount?.toLocaleString('vi-VN') || '0'}đ</div>
                      <div>{recharge.paymentMethod === 'bank' ? 'Chuyển Khoản' : 'MoMo'}</div>
                      <div>{recharge.status}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: '2rem' }}>
              <button onClick={() => setShowUserDetailModal(false)} className="btn-cancel">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;

