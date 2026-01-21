import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './History.css';

function History() {
  const [history, setHistory] = useState([]);
  const [allHistory, setAllHistory] = useState([]); // Store all orders for search
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const [pageRes, allRes] = await Promise.all([
          api.get(`/api/orders/my-orders?page=${currentPage}&limit=5`),
          api.get('/api/orders/my-orders?page=1&limit=10000')
        ]);
        
        const pageOrders = pageRes.data.orders || [];
        setHistory(pageOrders);
        setTotalPages(pageRes.data.totalPages || 1);
        
        // Calculate stats from all orders
        const allOrders = allRes.data.orders || [];
        setAllHistory(allOrders); // Store all orders for search
        setTotalOrders(allOrders.length);
        const totalSpentAmount = allOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        setTotalSpent(totalSpentAmount);
      } catch (error) {
        console.error('Error fetching orders:', error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [navigate, currentPage]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('vi-VN');
    const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} ${timeStr}`;
  };

  const getStatusIcon = (status) => {
    if (status === 'Hoàn thành') return '✅';
    if (status === 'Đang cày') return '🌾';
    if (status === 'Đang xử lí') return '⏳';
    return '⏸️';
  };

  const getOrderName = (order) => {
    if (order.orderType === 'service') {
      return `${order.serviceName} - ${order.gameName}`;
    }
    // For product orders, you might want to show product names
    return 'Đơn hàng sản phẩm';
  };

  if (loading) {
    return <div className="history-container"><p>Đang tải...</p></div>;
  }

  const getOrderCode = (orderId) => {
    return orderId ? orderId.toString().substring(0, 8).toUpperCase() : 'N/A';
  };

  const handleSearch = () => {
    setCurrentPage(1);
    // Search logic will be handled in fetchOrders
  };

  const handleClearFilter = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedItems(filteredHistory.map(item => item._id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId, checked) => {
    if (checked) {
      setSelectedItems([...selectedItems, itemId]);
    } else {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
      setSelectAll(false);
    }
  };


  // Search and filter in all history, not just current page
  const filteredHistory = (searchTerm || statusFilter)
    ? allHistory.filter(item => {
        // Search filter
        let matchesSearch = true;
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase().trim();
          const orderCode = getOrderCode(item._id).toLowerCase();
          const orderId = item._id.toLowerCase();
          matchesSearch = orderCode.includes(searchLower) || orderId.includes(searchLower);
        }
        
        // Status filter
        let matchesStatus = true;
        if (statusFilter) {
          matchesStatus = item.status === statusFilter;
        }
        
        return matchesSearch && matchesStatus;
      })
    : history;

  return (
    <div className="history-container">
      <h1>📋 LỊCH SỬ</h1>

      <div className="history-stats">
        <div className="stat-card stat-card-blue">
          <h3>📦 Số Đơn Đã Thuê</h3>
          <div className="stat-value stat-value-blue">
            {totalOrders}
          </div>
        </div>
        <div className="stat-card stat-card-green">
          <h3>💰 Số Tiền Đã Thuê</h3>
          <div className="stat-value stat-value-green">
            {totalSpent.toLocaleString('vi-VN')} đ
          </div>
        </div>
        <div className="stat-card stat-card-purple">
          <h3>📄 Tổng Số Trang</h3>
          <div className="stat-value stat-value-purple">
            {totalPages}
          </div>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="empty-state">
          <p>Bạn chưa có đơn hàng nào.</p>
        </div>
      ) : (
        <div className="modern-table-container">
          <div className="table-header-bar">
            <div className="header-title">
              <span className="info-icon">ℹ️</span>
              <span>CHI TIẾT ĐƠN HÀNG</span>
            </div>
          </div>

          <div className="table-controls">
            <div className="control-left">
              <input
                type="text"
                className="search-input"
                placeholder="Mã đơn hàng"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className="status-filter-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="Đang xử lí">Đang xử lí</option>
                <option value="Đang cày">Đang cày</option>
                <option value="Hoàn thành">Hoàn thành</option>
              </select>
            </div>
            <div className="control-right">
              <button className="btn-search" onClick={handleSearch}>
                <span className="search-icon">🔍</span>
                Tìm kiếm
              </button>
              <button className="btn-clear-filter" onClick={handleClearFilter}>
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
                    width: '50px'
                  }}>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
                  </th>
                  <th style={{ 
                    padding: '0.75rem', 
                    border: '1px solid #ddd',
                    textAlign: 'left',
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                  }}>Ngày</th>
                  <th style={{ 
                    padding: '0.75rem', 
                    border: '1px solid #ddd',
                    textAlign: 'left',
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                  }}>Mã đơn hàng</th>
                  <th style={{ 
                    padding: '0.75rem', 
                    border: '1px solid #ddd',
                    textAlign: 'left',
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                  }}>Tên Đơn Hàng</th>
                  <th style={{ 
                    padding: '0.75rem', 
                    border: '1px solid #ddd',
                    textAlign: 'left',
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                  }}>Giá</th>
                  <th style={{ 
                    padding: '0.75rem', 
                    border: '1px solid #ddd',
                    textAlign: 'left',
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                  }}>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ 
                      padding: '2rem', 
                      textAlign: 'center', 
                      color: '#999',
                      border: '1px solid #ddd'
                    }}>
                      Chưa có đơn hàng nào
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((item, index) => (
                    <tr key={item._id} style={{ 
                      borderBottom: '1px solid #ddd',
                      backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white'
                    }}>
                      <td style={{ 
                        padding: '0.75rem', 
                        border: '1px solid #ddd',
                        textAlign: 'center'
                      }}>
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item._id)}
                    onChange={(e) => handleSelectItem(item._id, e.target.checked)}
                  />
                      </td>
                      <td style={{ 
                        padding: '0.75rem', 
                        border: '1px solid #ddd',
                        whiteSpace: 'nowrap'
                      }}>
                  {formatDate(item.createdAt)}
                      </td>
                      <td style={{ 
                        padding: '0.75rem', 
                        border: '1px solid #ddd',
                        fontWeight: 'bold',
                        color: '#2196F3'
                      }}>
                  {getOrderCode(item._id)}
                      </td>
                      <td style={{ 
                        padding: '0.75rem', 
                        border: '1px solid #ddd'
                      }}>
                  {getOrderName(item)}
                      </td>
                      <td style={{ 
                        padding: '0.75rem', 
                        border: '1px solid #ddd'
                      }}>
                  {(() => {
                    const originalAmount = item.originalAmount || item.totalAmount || 0;
                    const totalAmount = item.totalAmount || 0;

                    // Lấy % khuyến mãi giống popup (game + tài khoản + voucher)
                    const gameDiscountPercent = Number(item.gameDiscountPercent || 0);
                    const accountDiscountPercent = Number(item.discount || 0);
                    const voucherDiscountPercent = Number(item.voucherDiscount || 0);
                    const discountPercent = gameDiscountPercent + accountDiscountPercent + voucherDiscountPercent;

                    // Hiển thị discount nếu có giảm giá
                    const hasDiscount = originalAmount > totalAmount && totalAmount > 0 && discountPercent > 0;
                    
                    if (hasDiscount) {
                      return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.9rem' }}>
                              {originalAmount.toLocaleString('vi-VN')} đ
                      </span>
                            <span style={{ color: '#000', fontWeight: 'bold', fontSize: '0.9rem' }}>
                              {totalAmount.toLocaleString('vi-VN')} đ
                      </span>
                          </div>
                      <span style={{ color: '#4CAF50', fontSize: '0.8rem' }}>
                            (giảm {discountPercent}%)
                      </span>
                    </div>
                      );
                    }
                    return <span>{totalAmount.toLocaleString('vi-VN')} đ</span>;
                  })()}
                      </td>
                      <td style={{ 
                        padding: '0.75rem', 
                        border: '1px solid #ddd'
                      }}>
                  <span className={`status-badge-modern status-${item.status.replace(/\s+/g, '')}`}>
                  {getStatusIcon(item.status)} {item.status}
                </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <div className="table-info">
              Showing {filteredHistory.length} of {history.length} Results
            </div>
          </div>
        </div>
      )}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '0.5rem 1rem',
              background: currentPage === 1 ? '#ccc' : '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            ← Trước
          </button>
          <span style={{ color: '#666' }}>
            Trang {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '0.5rem 1rem',
              background: currentPage === totalPages ? '#ccc' : '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Sau →
          </button>
        </div>
      )}
    </div>
  );
}

export default History;
