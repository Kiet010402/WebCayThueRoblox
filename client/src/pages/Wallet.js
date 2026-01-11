import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Wallet.css';

function Wallet() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [recharges, setRecharges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!token || !user) {
      navigate('/login');
      return;
    }

    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [userRes, rechargesRes] = await Promise.all([
        axios.get('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/recharge/my-recharges', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setBalance(userRes.data.balance || 0);
      setRecharges(rechargesRes.data);
      
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
        <div className="balance-card">
          <h2>Số Dư Hiện Tại</h2>
          <div className="balance-amount">
            {balance.toLocaleString('vi-VN')} <span>đ</span>
          </div>
          <Link to="/recharge" className="btn-recharge">+ NẠP TIỀN</Link>
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
        </div>
      </div>
    </div>
  );
}

export default Wallet;
