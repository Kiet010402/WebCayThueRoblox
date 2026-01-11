import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './TopRanking.css';

function TopRanking() {
  const navigate = useNavigate();
  const [topRecharges, setTopRecharges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopRecharges();
  }, []);

  const fetchTopRecharges = async () => {
    try {
      const response = await axios.get('/api/recharge/top-month');
      const data = response.data.map((item, index) => ({
        rank: index + 1,
        username: item.username,
        amount: item.totalAmount,
        badge: index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🎖️'
      }));
      setTopRecharges(data);
    } catch (error) {
      console.error('Error fetching top recharges:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentMonth = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return month;
  };

  return (
    <div className="top-ranking">
      <div className="ranking-header">
        <h2>🏆 TOP NẠP THÁNG {getCurrentMonth()}</h2>
        <p className="subtitle">Những thành viên nạp tiền nhiều nhất</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải...</div>
      ) : topRecharges.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
          Chưa có dữ liệu nạp tiền trong tháng này
        </div>
      ) : (
        <div className="ranking-table">
          {topRecharges.map((user) => (
            <div key={user.rank} className={`ranking-row rank-${user.rank}`}>
              <div className="rank-position">
                <span className="badge">{user.badge}</span>
                <span className="number">{user.rank}</span>
              </div>
              <div className="rank-username">
                <span>{user.username}</span>
              </div>
              <div className="rank-amount">
                <span className="amount">+{user.amount.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="ranking-footer">
        <button className="recharge-btn" onClick={() => navigate('/recharge')}>NẠP TIỀN NGAY</button>
      </div>
    </div>
  );
}

export default TopRanking;
