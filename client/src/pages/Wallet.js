import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import './Wallet.css';

function Wallet() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [recharges, setRecharges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRecharged, setTotalRecharged] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!token || !user) {
      navigate('/login');
      return;
    }

    try {
      const [userRes, rechargesRes, allRechargesRes, ordersRes] = await Promise.all([
          api.get('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        }),
          api.get(`/api/recharge/my-recharges?page=${currentPage}&limit=5`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
          api.get('/api/recharge/my-recharges?page=1&limit=10000', {
          headers: { Authorization: `Bearer ${token}` }
        }),
          api.get('/api/orders/my-orders?page=1&limit=10000', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setBalance(userRes.data.balance || 0);
      setRecharges(rechargesRes.data.recharges || []);
      setTotalPages(rechargesRes.data.totalPages || 1);
      
      // Calculate total recharged (only completed) from ALL recharges
      const allRecharges = allRechargesRes.data.recharges || [];
      const completedRecharges = allRecharges.filter(r => r.status === 'Hoàn thành');
      const totalRechargedAmount = completedRecharges.reduce((sum, r) => sum + (r.amount || 0), 0);
      setTotalRecharged(totalRechargedAmount);
      
      // Calculate total spent from ALL orders
      const allOrders = ordersRes.data.orders || [];
      const totalSpentAmount = allOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      setTotalSpent(totalSpentAmount);
      
      // Update user in localStorage
      const updatedUser = { ...JSON.parse(localStorage.getItem('user')), balance: userRes.data.balance };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

    fetchData();
  }, [navigate, currentPage]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = (status) => {
    if (status === 'Hoàn thành') return '✅';
    if (status === 'Đang xử lí') return '⏳';
    return '❌';
  };

  if (loading) {
    return <div className="wallet-container"><p>Đang tải...</p></div>;
  }

  return (
    <div className="wallet-container">
      <h1>💰 TÀI KHOẢN TIỀN</h1>

      <div className="wallet-content">
        <div className="wallet-left">
          <div className="balance-card balance-card-recharged">
            <h2>💰 Số Tiền Đã Nạp</h2>
            <div className="balance-amount">
              {totalRecharged.toLocaleString('vi-VN')} <span>đ</span>
            </div>
          </div>
          <div className="balance-card balance-card-spent">
            <h2>💸 Số Tiền Đã Tiêu</h2>
            <div className="balance-amount">
              {totalSpent.toLocaleString('vi-VN')} <span>đ</span>
            </div>
          </div>
        <div className="balance-card">
          <h2>Số Dư Hiện Tại</h2>
          <div className="balance-amount">
            {balance.toLocaleString('vi-VN')} <span>đ</span>
          </div>
          <Link to="/recharge" className="btn-recharge">+ NẠP TIỀN</Link>
          </div>
        </div>

        <div className="transactions-section">
          <h2>📝 Lịch Sử Nạp Tiền</h2>
          {recharges.length === 0 ? (
            <div className="empty-state">
              <p>Bạn chưa có giao dịch nạp tiền nào.</p>
            </div>
          ) : (
            <div className="transactions-list">
              {recharges.map(tx => (
                <div key={tx._id} className="transaction-item">
                  <div className="tx-info">
                    <div className="tx-type">Nạp Tiền - {tx.paymentMethod === 'bank' ? 'Chuyển Khoản' : 'MoMo'}</div>
                    <div className="tx-date">{formatDate(tx.createdAt)}</div>
                    {tx.status === 'Từ chối' && tx.rejectionReason && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#d32f2f', fontStyle: 'italic' }}>
                        ⚠️ Lý do từ chối: {tx.rejectionReason}
                      </div>
                    )}
                  </div>
                  <div className="tx-amount income">
                    +{tx.amount.toLocaleString('vi-VN')} đ
                  </div>
                  <div className={`tx-status status-${tx.status.replace(/\s+/g, '')}`}>
                    {getStatusIcon(tx.status)} {tx.status}
                  </div>
                </div>
              ))}
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
      </div>
    </div>
  );
}

export default Wallet;
