import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import RevenueDashboard from '../components/admin/RevenueDashboard';
import AnnouncementEditor from '../components/admin/AnnouncementEditor';
import PricingManager from '../components/admin/PricingManager';
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
  const [balanceMode, setBalanceMode] = useState('add'); // add | subtract
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
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [pendingRechargesCount, setPendingRechargesCount] = useState(0);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRechargeId, setSelectedRechargeId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [billCache, setBillCache] = useState({}); // Cache bill images by rechargeId
  const [loadingBill, setLoadingBill] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [voucherDiscount, setVoucherDiscount] = useState('');
  const [selectedUserForVoucher, setSelectedUserForVoucher] = useState(null);
  // Pagination and search states
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersSearch, setUsersSearch] = useState('');
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);
  const [ordersSearch, setOrdersSearch] = useState('');
  const [ordersStatusFilter, setOrdersStatusFilter] = useState('');
  const [rechargesPage, setRechargesPage] = useState(1);
  const [rechargesTotalPages, setRechargesTotalPages] = useState(1);
  const [rechargesStatusFilter, setRechargesStatusFilter] = useState('');
  const [searchNonce, setSearchNonce] = useState(0);
  // Voucher management
  const [vouchers, setVouchers] = useState([]);
  const [vouchersPage, setVouchersPage] = useState(1);
  const [vouchersTotalPages, setVouchersTotalPages] = useState(1);
  const [voucherStatusFilter, setVoucherStatusFilter] = useState('');
  const [newVoucherCode, setNewVoucherCode] = useState('');
  const [newVoucherDiscount, setNewVoucherDiscount] = useState('');
  const [newVoucherExpiry, setNewVoucherExpiry] = useState('');
  const [newVoucherMinAmount, setNewVoucherMinAmount] = useState('');

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!token || !user || user.role !== 'admin') {
      navigate('/login');
      return;
    }

    try {
      const [usersRes, ordersRes, rechargesRes, statsRes, newsRes] = await Promise.all([
        api.get(`/api/admin/users?page=${usersPage}&limit=7&search=${encodeURIComponent(usersSearch)}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get(`/api/admin/orders?page=${ordersPage}&limit=7&search=${encodeURIComponent(ordersSearch)}&status=${encodeURIComponent(ordersStatusFilter)}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get(`/api/admin/recharges?page=${rechargesPage}&limit=7&status=${encodeURIComponent(rechargesStatusFilter)}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get('/api/news')
      ]);
      
      setUsers(Array.isArray(usersRes.data.users) ? usersRes.data.users : []);
      setUsersTotalPages(usersRes.data.totalPages || 1);
      setOrders(Array.isArray(ordersRes.data.orders) ? ordersRes.data.orders : []);
      setOrdersTotalPages(ordersRes.data.totalPages || 1);
      setRecharges(Array.isArray(rechargesRes.data.recharges) ? rechargesRes.data.recharges : []);
      setRechargesTotalPages(rechargesRes.data.totalPages || 1);
      setStats(statsRes.data);
      setNews(Array.isArray(newsRes.data) ? newsRes.data : []);
      
      // Count pending orders and recharges (need to fetch all for accurate count)
      const [allOrdersRes, allRechargesRes] = await Promise.all([
        api.get('/api/admin/orders?page=1&limit=10000', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get('/api/admin/recharges?page=1&limit=10000', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      const pendingOrders = Array.isArray(allOrdersRes.data.orders) ? allOrdersRes.data.orders.filter(order => order.status === 'Đang xử lí') : [];
      const pendingRecharges = Array.isArray(allRechargesRes.data.recharges) ? allRechargesRes.data.recharges.filter(recharge => recharge.status === 'Đang xử lí') : [];
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
  }, [navigate, usersPage, usersSearch, ordersPage, ordersSearch, ordersStatusFilter, rechargesPage, rechargesStatusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Force refetch when user presses "Tìm kiếm" while already on page 1
  useEffect(() => {
    if (searchNonce > 0) fetchData();
  }, [searchNonce, fetchData]);

  // Fetch vouchers only when voucher tab is active
  useEffect(() => {
    const fetchVouchers = async () => {
      const token = localStorage.getItem('token');
      const adminUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (!token || !adminUser || adminUser.role !== 'admin') return;

      try {
        const statusParam = voucherStatusFilter ? `&status=${encodeURIComponent(voucherStatusFilter)}` : '';
        const res = await api.get(
          `/api/admin/vouchers?page=${vouchersPage}&limit=7${statusParam}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setVouchers(Array.isArray(res.data.vouchers) ? res.data.vouchers : []);
        setVouchersTotalPages(res.data.totalPages || 1);
      } catch (error) {
        console.error('Error fetching vouchers:', error);
      }
    };

    if (activeTab === 'vouchers') {
      fetchVouchers();
    }
  }, [activeTab, vouchersPage, voucherStatusFilter]);

  const handleAddBalance = async () => {
    const value = Number(addBalanceAmount);
    if (!Number.isFinite(value) || value <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ (> 0)');
      return;
    }

    const delta = balanceMode === 'add' ? value : -value;
    const token = localStorage.getItem('token');
    try {
      await api.post(
        `/api/admin/users/${selectedUser._id}/add-balance`,
        { amount: delta },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Cập nhật số dư thành công!');
      setShowAddBalanceModal(false);
      setAddBalanceAmount('');
      setBalanceMode('add');
      setSelectedUser(null);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleCreateVoucher = async () => {
    if (!newVoucherCode.trim() || !newVoucherDiscount || !newVoucherExpiry) {
      alert('Vui lòng nhập đầy đủ: mã, giảm giá, ngày hết hạn');
      return;
    }
    const discountValue = Number(newVoucherDiscount);
    if (!Number.isFinite(discountValue) || discountValue <= 0 || discountValue > 100) {
      alert('Giảm giá phải trong khoảng 1 - 100%');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      await api.post(
        '/api/admin/vouchers',
        {
          code: newVoucherCode.trim(),
          discount: discountValue,
          expiresAt: newVoucherExpiry,
          minOrderAmount: Number(newVoucherMinAmount) || 0,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert('Tạo voucher thành công');
      setNewVoucherCode('');
      setNewVoucherDiscount('');
      setNewVoucherExpiry('');
      setNewVoucherMinAmount('');
      // Reload vouchers
      setVouchersPage(1);
      if (activeTab === 'vouchers') {
        const statusParam = voucherStatusFilter ? `&status=${encodeURIComponent(voucherStatusFilter)}` : '';
        const res = await api.get(
          `/api/admin/vouchers?page=1&limit=7${statusParam}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setVouchers(Array.isArray(res.data.vouchers) ? res.data.vouchers : []);
        setVouchersTotalPages(res.data.totalPages || 1);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi tạo voucher');
    }
  };

  const handleDeleteVoucher = async (voucherId, voucherCode) => {
    if (!window.confirm(`Bạn chắc chắn muốn xóa voucher "${voucherCode}"? Hành động này không thể hoàn tác.`)) {
      return;
    }
    const token = localStorage.getItem('token');
    try {
      await api.delete(`/api/admin/vouchers/${voucherId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Đã xóa voucher');
      // Refetch vouchers
      const statusParam = voucherStatusFilter ? `&status=${encodeURIComponent(voucherStatusFilter)}` : '';
      const res = await api.get(
        `/api/admin/vouchers?page=${vouchersPage}&limit=7${statusParam}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setVouchers(Array.isArray(res.data.vouchers) ? res.data.vouchers : []);
      setVouchersTotalPages(res.data.totalPages || 1);
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa voucher');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa user này và dữ liệu liên quan?')) {
      return;
    }
    const token = localStorage.getItem('token');
    try {
      await api.delete(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Đã xóa user');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa user');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const token = localStorage.getItem('token');
    try {
      await api.put(`/api/admin/orders/${orderId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa đơn hàng này? Hành động này không thể hoàn tác.')) {
      return;
    }
    const token = localStorage.getItem('token');
    try {
      await api.delete(`/api/admin/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Đã xóa đơn hàng thành công');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa đơn hàng');
    }
  };

  const handleDeleteRecharge = async (rechargeId) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa yêu cầu nạp tiền này? Hành động này không thể hoàn tác.')) {
      return;
    }
    const token = localStorage.getItem('token');
    try {
      await api.delete(`/api/admin/recharges/${rechargeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Đã xóa yêu cầu nạp tiền thành công');
      // Update local state instead of refetching all data
      setRecharges(prev => prev.filter(r => r._id !== rechargeId));
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa yêu cầu nạp tiền');
    }
  };

  const handleApproveRecharge = async (rechargeId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await api.put(`/api/admin/recharges/${rechargeId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Duyệt nạp tiền thành công!');
      const updatedRecharge = res.data?.recharge;
      if (updatedRecharge) {
        let decreasedPending = false;
        setRecharges(prev => {
          const next = prev.map(r => {
            if (r._id === rechargeId) {
              if (r.status === 'Đang xử lí' && updatedRecharge.status === 'Hoàn thành') {
                decreasedPending = true;
              }
              return { ...r, ...updatedRecharge };
            }
            return r;
          });
          return next;
        });
        if (decreasedPending) {
          setPendingRechargesCount(count => Math.max(0, count - 1));
        }
      } else {
        // Fallback: reload if server didn't send updated recharge
      fetchData();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleRejectRecharge = (rechargeId) => {
    setSelectedRechargeId(rechargeId);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const confirmRejectRecharge = async () => {
    if (!rejectionReason.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }
    const token = localStorage.getItem('token');
    try {
      const res = await api.put(`/api/admin/recharges/${selectedRechargeId}/reject`,
        { rejectionReason: rejectionReason.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Từ chối nạp tiền thành công!');
      setShowRejectModal(false);
      setSelectedRechargeId(null);
      setRejectionReason('');
      const updatedRecharge = res.data?.recharge;
      if (updatedRecharge) {
        setRecharges(prev => prev.map(r => r._id === selectedRechargeId ? { ...r, ...updatedRecharge } : r));
      } else {
      fetchData();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleViewBill = async (rechargeId) => {
    // Check cache first
    if (billCache[rechargeId]) {
      setSelectedBill(billCache[rechargeId]);
      setShowBillModal(true);
      return;
    }

    // Show modal with loading state
    setShowBillModal(true);
    setSelectedBill(null);
    setLoadingBill(true);

    const token = localStorage.getItem('token');
    try {
      const response = await api.get(`/api/admin/recharges/${rechargeId}/bill`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const billImage = response.data.billImage;
      // Cache the image
      setBillCache(prev => ({ ...prev, [rechargeId]: billImage }));
      setSelectedBill(billImage);
    } catch (error) {
      alert('Không thể tải hình bill: ' + (error.response?.data?.message || error.message));
      setShowBillModal(false);
    } finally {
      setLoadingBill(false);
    }
  };

  const handleCreateNews = async () => {
    if (!newsTitle || !newsContent) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }
    const token = localStorage.getItem('token');
    try {
      await api.post('/api/news', 
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
      await api.delete(`/api/news/${newsId}`, {
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
    try {
      const response = await api.get(`/api/admin/users/${userId}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserDetails(response.data);
      setShowUserDetailModal(true);
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi tải thông tin user');
    }
  };

  const handleAddVoucher = (user) => {
    setSelectedUserForVoucher(user);
    setVoucherDiscount(user.discount || '0');
    setShowVoucherModal(true);
  };

  const confirmAddVoucher = async () => {
    const discount = parseInt(voucherDiscount);
    if (isNaN(discount) || discount < 0 || discount > 100) {
      alert('Giảm giá phải từ 0 đến 100');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      await api.post(`/api/admin/users/${selectedUserForVoucher._id}/voucher`, {
        discount
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Cập nhật voucher thành công!');
      setShowVoucherModal(false);
      setSelectedUserForVoucher(null);
      setVoucherDiscount('');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
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
        </div>
      )}

      <div className="admin-tabs">
        <button 
          className={activeTab === 'revenue' ? 'active' : ''}
          onClick={() => setActiveTab('revenue')}
        >
          Quản Lý Doanh Thu
        </button>
        <button 
          className={activeTab === 'vouchers' ? 'active' : ''}
          onClick={() => setActiveTab('vouchers')}
        >
          Quản Lý Voucher
        </button>
        <button 
          className={activeTab === 'announcement' ? 'active' : ''}
          onClick={() => setActiveTab('announcement')}
        >
          Quản Lý Thông Báo
        </button>
        <button 
          className={activeTab === 'pricing' ? 'active' : ''}
          onClick={() => setActiveTab('pricing')}
        >
          Quản Lý Bảng Giá
        </button>
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

      {activeTab === 'revenue' && (
        <RevenueDashboard />
      )}

      {activeTab === 'announcement' && (
        <AnnouncementEditor />
      )}

      {activeTab === 'pricing' && (
        <PricingManager />
      )}

      {activeTab === 'vouchers' && (
        <div className="modern-table-container">
          <div className="table-header-bar">
            <div className="header-title">
              <span className="info-icon">🎫</span>
              <span>QUẢN LÝ VOUCHER</span>
            </div>
          </div>

          <div className="table-controls">
            <div className="control-left">
              <select
                className="status-filter-select"
                value={voucherStatusFilter}
                onChange={(e) => {
                  setVoucherStatusFilter(e.target.value);
                  setVouchersPage(1);
                }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="expired">Hết hạn</option>
              </select>
            </div>
          </div>

          <div className="profile-card" style={{ marginBottom: '1.5rem' }}>
            <div className="profile-header">
              <h2 className="section-title">Thêm voucher mới</h2>
            </div>
            <div className="profile-details">
              <div className="detail-column" style={{ maxWidth: '520px' }}>
                <div className="detail-item">
                  <label>Mã voucher</label>
                  <input
                    type="text"
                    value={newVoucherCode}
                    onChange={(e) => setNewVoucherCode(e.target.value)}
                    placeholder="VD: KAI10"
                  />
                </div>
                <div className="detail-item">
                  <label>Giảm giá (%)</label>
                  <input
                    type="number"
                    value={newVoucherDiscount}
                    onChange={(e) => setNewVoucherDiscount(e.target.value)}
                    placeholder="Ví dụ: 10"
                  />
                </div>
                <div className="detail-item">
                  <label>Hết hạn vào ngày</label>
                  <input
                    type="date"
                    value={newVoucherExpiry}
                    onChange={(e) => setNewVoucherExpiry(e.target.value)}
                  />
                </div>
                <div className="detail-item">
                  <label>Áp dụng cho đơn từ (đ)</label>
                  <input
                    type="number"
                    value={newVoucherMinAmount}
                    onChange={(e) => setNewVoucherMinAmount(e.target.value)}
                    placeholder="Ví dụ: 50000"
                  />
                </div>
                <button
                  type="button"
                  className="btn-submit"
                  onClick={handleCreateVoucher}
                  style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}
                >
                  Lưu voucher
                </button>
              </div>
            </div>
          </div>

          <div className="modern-table">
            <div className="modern-table-header">
              <div className="col-code">Mã</div>
              <div className="col-user">Giảm giá</div>
              <div className="col-amount">Áp dụng từ</div>
              <div className="col-date">Hết hạn</div>
              <div className="col-status">Trạng thái</div>
              <div className="col-actions" style={{ minWidth: '100px' }}>Thao tác</div>
            </div>

            {vouchers.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
                Chưa có voucher nào
              </div>
            ) : (
              vouchers.map((v) => (
                <div key={v._id} className="modern-table-row">
                  <div className="col-code" style={{ fontWeight: 'bold' }}>{v.code}</div>
                  <div className="col-user">{v.discount}%</div>
                  <div className="col-amount">
                    {v.minOrderAmount ? `${v.minOrderAmount.toLocaleString('vi-VN')}đ` : '0đ'}
                  </div>
                  <div className="col-date">
                    {v.expiresAt ? formatDate(v.expiresAt) : 'N/A'}
                  </div>
                  <div className="col-status">
                    <span className={`status-badge status-${v.status}`}>
                      {v.status === 'active' ? 'Hoạt động' : 'Hết hạn'}
                    </span>
                  </div>
                  <div className="col-actions">
                    <button
                      onClick={() => handleDeleteVoucher(v._id, v.code)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#d32f2f';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#f44336';
                      }}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="table-footer">
            <div className="table-info">
              Showing {vouchers.length} of {vouchersTotalPages * 7} Vouchers
            </div>
          </div>
          {vouchersTotalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', padding: '1rem' }}>
              <button
                onClick={() => setVouchersPage((prev) => Math.max(1, prev - 1))}
                disabled={vouchersPage === 1}
                style={{
                  padding: '0.5rem 1rem',
                  background: vouchersPage === 1 ? '#ccc' : '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: vouchersPage === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                ← Trước
              </button>
              <span style={{ color: '#666' }}>
                Trang {vouchersPage} / {vouchersTotalPages}
              </span>
              <button
                onClick={() => setVouchersPage((prev) => Math.min(vouchersTotalPages, prev + 1))}
                disabled={vouchersPage === vouchersTotalPages}
                style={{
                  padding: '0.5rem 1rem',
                  background: vouchersPage === vouchersTotalPages ? '#ccc' : '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: vouchersPage === vouchersTotalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Sau →
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="modern-table-container">
          <div className="table-header-bar">
            <div className="header-title">
              <span className="info-icon">ℹ️</span>
              <span>QUẢN LÝ USERS</span>
            </div>
          </div>

          <div className="table-controls">
            <div className="control-left">
              <input
                type="text"
                className="search-input"
                placeholder="Tìm kiếm theo username hoặc email..."
                value={usersSearch}
                onChange={(e) => {
                  setUsersSearch(e.target.value);
                  setUsersPage(1);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setUsersPage(1);
                    setSearchNonce((n) => n + 1);
                  }
                }}
              />
            </div>
            <div className="control-right">
              <button
                className="btn-search"
                onClick={() => {
                  setUsersPage(1);
                  setSearchNonce((n) => n + 1);
                }}
              >
                <span className="search-icon">🔍</span>
                Tìm kiếm
              </button>
              <button className="btn-clear-filter" onClick={() => {
                setUsersSearch('');
                setUsersPage(1);
                setSearchNonce((n) => n + 1);
              }}>
                <span className="trash-icon">🗑️</span>
                Bỏ lọc
              </button>
            </div>
          </div>

          <div className="modern-table">
            <div className="modern-table-header">
              <div className="col-checkbox">
                <input type="checkbox" />
              </div>
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
                <div key={user._id} className="modern-table-row">
                  <div className="col-checkbox">
                    <input type="checkbox" />
                  </div>
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
                        setBalanceMode('add');
                        setAddBalanceAmount('');
                    }}
                  >
                      ± Tiền
                    </button>
                    <button
                      className="btn-reject"
                      style={{ marginLeft: '0.5rem' }}
                      onClick={() => handleDeleteUser(user._id)}
                    >
                      Xóa
                  </button>
                </div>
              </div>
            ))
            )}
          </div>

          <div className="table-footer">
            <div className="table-info">
              Showing {users.length} of {stats?.totalUsers || 0} Users
            </div>
          </div>
          {usersTotalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', padding: '1rem' }}>
              <button
                onClick={() => setUsersPage(prev => Math.max(1, prev - 1))}
                disabled={usersPage === 1}
                style={{
                  padding: '0.5rem 1rem',
                  background: usersPage === 1 ? '#ccc' : '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: usersPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                ← Trước
              </button>
              <span style={{ color: '#666' }}>
                Trang {usersPage} / {usersTotalPages}
              </span>
              <button
                onClick={() => setUsersPage(prev => Math.min(usersTotalPages, prev + 1))}
                disabled={usersPage === usersTotalPages}
                style={{
                  padding: '0.5rem 1rem',
                  background: usersPage === usersTotalPages ? '#ccc' : '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: usersPage === usersTotalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Sau →
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'recharges' && (
        <div className="modern-table-container">
          <div className="table-header-bar">
            <div className="header-title">
              <span className="info-icon">ℹ️</span>
              <span>QUẢN LÝ NẠP TIỀN</span>
            </div>
          </div>

          <div className="table-controls">
            <div className="control-left">
              <select
                className="status-filter-select"
                value={rechargesStatusFilter}
                onChange={(e) => {
                  setRechargesStatusFilter(e.target.value);
                  setRechargesPage(1);
                }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="Đang xử lí">Đang xử lí</option>
                <option value="Hoàn thành">Hoàn thành</option>
                <option value="Từ chối">Từ chối</option>
              </select>
            </div>
            <div className="control-right">
              <button className="btn-clear-filter" onClick={() => {
                setRechargesStatusFilter('');
                setRechargesPage(1);
              }}>
                <span className="trash-icon">🗑️</span>
                Bỏ lọc
              </button>
            </div>
          </div>

          <div className="modern-table">
            <div className="modern-table-header">
              <div className="col-checkbox">
                <input type="checkbox" />
              </div>
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
                <div key={recharge._id} className="modern-table-row">
                  <div className="col-checkbox">
                    <input type="checkbox" />
                  </div>
                <div className="col-date">{formatDate(recharge.createdAt)}</div>
                <div className="col-user">{recharge.userId?.username || 'N/A'}</div>
                <div className="col-amount">{recharge.amount.toLocaleString('vi-VN')}đ</div>
                <div className="col-method">
                  {recharge.paymentMethod === 'bank'
                    ? 'Chuyển Khoản'
                    : recharge.paymentMethod === 'momo'
                      ? 'MoMo'
                      : 'Thẻ Siêu Rẻ'}
                </div>
                <div className="col-bill">
                  <button 
                    className="btn-view-bill"
                      onClick={() => handleViewBill(recharge._id)}
                  >
                    Xem Bill
                  </button>
                </div>
                <div className="col-status">
                  <span className={`status-badge status-${recharge.status.replace(/\s+/g, '')}`}>
                    {recharge.status}
                  </span>
                    {recharge.status === 'Từ chối' && recharge.rejectionReason && (
                      <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: '#d32f2f', fontStyle: 'italic' }}>
                        Lý do: {recharge.rejectionReason}
                      </div>
                    )}
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
                  {recharge.status === 'Hoàn thành' && (
                    <button 
                      className="btn-delete"
                      onClick={() => handleDeleteRecharge(recharge._id)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        background: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </div>
            ))
            )}
          </div>

          <div className="table-footer">
            <div className="table-info">
              Showing {recharges.length} of {rechargesTotalPages * 7} Recharges
            </div>
          </div>
          {rechargesTotalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', padding: '1rem' }}>
              <button
                onClick={() => setRechargesPage(prev => Math.max(1, prev - 1))}
                disabled={rechargesPage === 1}
                style={{
                  padding: '0.5rem 1rem',
                  background: rechargesPage === 1 ? '#ccc' : '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: rechargesPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                ← Trước
              </button>
              <span style={{ color: '#666' }}>
                Trang {rechargesPage} / {rechargesTotalPages}
              </span>
              <button
                onClick={() => setRechargesPage(prev => Math.min(rechargesTotalPages, prev + 1))}
                disabled={rechargesPage === rechargesTotalPages}
                style={{
                  padding: '0.5rem 1rem',
                  background: rechargesPage === rechargesTotalPages ? '#ccc' : '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: rechargesPage === rechargesTotalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Sau →
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="modern-table-container">
          <div className="table-header-bar">
            <div className="header-title">
              <span className="info-icon">ℹ️</span>
              <span>QUẢN LÝ ĐƠN HÀNG</span>
            </div>
          </div>

          <div className="table-controls">
            <div className="control-left">
              <input
                type="text"
                className="search-input"
                placeholder="Tìm kiếm theo mã đơn hàng hoặc tên user..."
                value={ordersSearch}
                onChange={(e) => {
                  setOrdersSearch(e.target.value);
                  setOrdersPage(1);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setOrdersPage(1);
                    setSearchNonce((n) => n + 1);
                  }
                }}
              />
              <select
                className="status-filter-select"
                value={ordersStatusFilter}
                onChange={(e) => {
                  setOrdersStatusFilter(e.target.value);
                  setOrdersPage(1);
                }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="Đang xử lí">Đang xử lí</option>
                <option value="Đang cày">Đang cày</option>
                <option value="Hoàn thành">Hoàn thành</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="control-right">
              <button
                className="btn-search"
                onClick={() => {
                  setOrdersPage(1);
                  setSearchNonce((n) => n + 1);
                }}
              >
                <span className="search-icon">🔍</span>
                Tìm kiếm
              </button>
              <button className="btn-clear-filter" onClick={() => {
                setOrdersSearch('');
                setOrdersStatusFilter('');
                setOrdersPage(1);
                setSearchNonce((n) => n + 1);
              }}>
                <span className="trash-icon">🗑️</span>
                Bỏ lọc
              </button>
            </div>
          </div>

          <div className="modern-table">
            <div className="modern-table-header">
              <div className="col-checkbox">
                <input type="checkbox" />
              </div>
            <div className="col-date">Ngày</div>
              <div className="col-code">Mã Đơn</div>
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
                <div key={order._id} className="modern-table-row">
                  <div className="col-checkbox">
                    <input type="checkbox" />
                  </div>
                <div className="col-date">{formatDate(order.createdAt)}</div>
                  <div className="col-code" style={{ color: '#2196F3', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    {order._id ? order._id.toString().substring(0, 8).toUpperCase() : 'N/A'}
                  </div>
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
                  {order.status === 'Hoàn thành' && (
                    <button 
                      className="btn-delete"
                      onClick={() => handleDeleteOrder(order._id)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        background: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        marginLeft: '0.5rem'
                      }}
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </div>
            ))
            )}
          </div>

          <div className="table-footer">
            <div className="table-info">
              Showing {orders.length} of {stats?.totalOrders || 0} Orders
            </div>
          </div>
          {ordersTotalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', padding: '1rem' }}>
              <button
                onClick={() => setOrdersPage(prev => Math.max(1, prev - 1))}
                disabled={ordersPage === 1}
                style={{
                  padding: '0.5rem 1rem',
                  background: ordersPage === 1 ? '#ccc' : '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: ordersPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                ← Trước
              </button>
              <span style={{ color: '#666' }}>
                Trang {ordersPage} / {ordersTotalPages}
              </span>
              <button
                onClick={() => setOrdersPage(prev => Math.min(ordersTotalPages, prev + 1))}
                disabled={ordersPage === ordersTotalPages}
                style={{
                  padding: '0.5rem 1rem',
                  background: ordersPage === ordersTotalPages ? '#ccc' : '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: ordersPage === ordersTotalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Sau →
              </button>
            </div>
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
              <label>Số tiền (+ thêm / - trừ):</label>
              <input
                type="number"
                value={addBalanceAmount}
                onChange={(e) => setAddBalanceAmount(e.target.value)}
                placeholder="Nhập số tiền"
                min="1"
              />
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className={balanceMode === 'add' ? 'btn-confirm' : 'btn-cancel'}
                  onClick={() => setBalanceMode('add')}
                  style={{ padding: '0.4rem 0.8rem' }}
                >
                  + Cộng
                </button>
                <button
                  type="button"
                  className={balanceMode === 'subtract' ? 'btn-confirm' : 'btn-cancel'}
                  onClick={() => setBalanceMode('subtract')}
                  style={{ padding: '0.4rem 0.8rem' }}
                >
                  - Trừ
                </button>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={handleAddBalance} className="btn-confirm">Xác Nhận</button>
              <button onClick={() => setShowAddBalanceModal(false)} className="btn-cancel">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {showBillModal && (
        <div className="modal-overlay" onClick={() => {
          setShowBillModal(false);
          setLoadingBill(false);
        }}>
          <div className="modal-content modal-bill" onClick={(e) => e.stopPropagation()}>
            <h2>Hình Bill</h2>
            {loadingBill ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>⏳ Đang tải hình bill...</div>
                <div style={{ fontSize: '0.9rem', color: '#999' }}>Vui lòng đợi trong giây lát</div>
              </div>
            ) : selectedBill ? (
              <img 
                src={selectedBill} 
                alt="Bill" 
                style={{ maxWidth: '100%', maxHeight: '70vh', marginTop: '1rem', display: 'block', margin: '1rem auto' }}
                onLoad={() => setLoadingBill(false)}
                onError={() => {
                  alert('Không thể hiển thị hình bill');
                  setShowBillModal(false);
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
                Không có hình bill
              </div>
            )}
            <div className="modal-actions">
              <button onClick={() => {
                setShowBillModal(false);
                setLoadingBill(false);
              }} className="btn-cancel">Đóng</button>
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
            
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px', marginBottom: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <strong>Username:</strong> {userDetails.username}
                </div>
                <div>
                  <strong>Email:</strong> {userDetails.email}
                </div>
                <div>
                  <strong>Số dư:</strong> {userDetails.balance?.toLocaleString('vi-VN') || '0'} đ
                </div>
                <div>
                  <strong>Giảm giá:</strong> {userDetails.discount > 0 ? `${userDetails.discount}%` : 'Không có'}
                </div>
              </div>
            </div>
            
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
                      <div>
                        {order.discountAmount > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.85rem' }}>
                              {order.originalAmount?.toLocaleString('vi-VN') || order.totalAmount?.toLocaleString('vi-VN') || '0'}đ
                            </span>
                            <span style={{ color: '#000', fontWeight: 'bold' }}>
                              {order.totalAmount?.toLocaleString('vi-VN') || '0'}đ
                            </span>
                            <span style={{ color: '#4CAF50', fontSize: '0.8rem' }}>
                              (Giảm {order.discount}%)
                            </span>
                          </div>
                        ) : (
                          <span>{order.totalAmount?.toLocaleString('vi-VN') || '0'}đ</span>
                        )}
                      </div>
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
                      <div>
                        {recharge.paymentMethod === 'bank'
                          ? 'Chuyển Khoản'
                          : recharge.paymentMethod === 'momo'
                            ? 'MoMo'
                            : 'Thẻ Siêu Rẻ'}
                      </div>
                      <div>{recharge.status}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: '2rem' }}>
              <button 
                onClick={() => {
                  if (userDetails && userDetails._id) {
                    handleAddVoucher(userDetails);
                  } else {
                    alert('Không tìm thấy thông tin user');
                  }
                }}
                className="btn-confirm"
                style={{ marginRight: '1rem' }}
              >
                Thêm Voucher
              </button>
              <button onClick={() => setShowUserDetailModal(false)} className="btn-cancel">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {showVoucherModal && selectedUserForVoucher && (
        <div className="modal-overlay" onClick={() => setShowVoucherModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h2>Thêm Voucher Giảm Giá</h2>
            <p><strong>User:</strong> {selectedUserForVoucher.username}</p>
            <p><strong>Voucher hiện tại:</strong> {selectedUserForVoucher.discount || 0}%</p>
            <div className="form-group">
              <label>Giảm giá (%):</label>
              <input
                type="number"
                value={voucherDiscount}
                onChange={(e) => setVoucherDiscount(e.target.value)}
                placeholder="Nhập % giảm giá (0-100, 0 để xóa voucher)"
                min="0"
                max="100"
              />
              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                Nhập 0 để xóa voucher
              </p>
            </div>
            <div className="modal-actions">
              <button onClick={confirmAddVoucher} className="btn-confirm">Xác Nhận</button>
              <button onClick={() => {
                setShowVoucherModal(false);
                setSelectedUserForVoucher(null);
                setVoucherDiscount('');
              }} className="btn-cancel">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h2>Từ Chối Nạp Tiền</h2>
            <p style={{ marginBottom: '1rem', color: '#666' }}>Vui lòng nhập lý do từ chối:</p>
            <div className="form-group">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Nhập lý do từ chối..."
                rows="4"
                style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>
            <div className="modal-actions">
              <button onClick={confirmRejectRecharge} className="btn-reject">Xác Nhận Từ Chối</button>
              <button onClick={() => {
                setShowRejectModal(false);
                setSelectedRechargeId(null);
                setRejectionReason('');
              }} className="btn-cancel">Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;

