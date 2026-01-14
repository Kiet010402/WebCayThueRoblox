import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './History.css';

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await api.get('/api/orders/my-orders', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setHistory(response.data);
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
  }, [navigate]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
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

  return (
    <div className="history-container">
      <h1>📋 LỊCH SỬ</h1>

      {history.length === 0 ? (
        <div className="empty-state">
          <p>Bạn chưa có đơn hàng nào.</p>
        </div>
      ) : (
        <div className="history-table">
          <div className="table-header">
            <div className="col-date">Ngày</div>
            <div className="col-account">Tên Đơn Hàng</div>
            <div className="col-amount">Giá</div>
            <div className="col-status">Trạng Thái</div>
            <div className="col-action">Hành Động</div>
          </div>

          {history.map(item => (
            <div key={item._id} className={`table-row status-${item.status.replace(/\s+/g, '')}`}>
              <div className="col-date">{formatDate(item.createdAt)}</div>
              <div className="col-account">{getOrderName(item)}</div>
              <div className="col-amount">{item.totalAmount.toLocaleString('vi-VN')} đ</div>
              <div className="col-status">
                <span className="status-badge">
                  {getStatusIcon(item.status)} {item.status}
                </span>
              </div>
              <div className="col-action">
                <button className="btn-detail">Chi Tiết</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default History;
