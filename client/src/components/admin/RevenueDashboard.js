import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import './RevenueDashboard.css';

function formatMoney(v) {
  const n = Number(v) || 0;
  return `${n.toLocaleString('vi-VN')}đ`;
}

export default function RevenueDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/admin/revenue-stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    };

    setLoading(true);
    fetchStats()
      .catch((err) => {
        console.error('Error fetching revenue stats:', err);
        alert(err.response?.data?.message || 'Không thể tải thống kê doanh thu');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="revenue-dashboard">
        <div className="revenue-loading">Đang tải doanh thu...</div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="revenue-dashboard">
      <div className="revenue-grid">
        <div className="revenue-card">
          <div className="revenue-number">{stats.totalOrders || 0}</div>
          <div className="revenue-label">Tổng Đơn Hàng</div>
        </div>
        <div className="revenue-card">
          <div className="revenue-number">{formatMoney(stats.totalRevenue)}</div>
          <div className="revenue-label">Tổng Doanh Thu</div>
        </div>
        <div className="revenue-card">
          <div className="revenue-number">{stats.ordersToday || 0}</div>
          <div className="revenue-label">Đơn Hàng Hôm Nay</div>
        </div>
        <div className="revenue-card">
          <div className="revenue-number">{stats.ordersYesterday || 0}</div>
          <div className="revenue-label">Đơn Hàng Hôm Qua</div>
        </div>

        <div className="revenue-card">
          <div className="revenue-number">{formatMoney(stats.revenueThisWeek)}</div>
          <div className="revenue-label">Doanh Thu Tuần</div>
        </div>
        <div className="revenue-card">
          <div className="revenue-number">{formatMoney(stats.revenueToday)}</div>
          <div className="revenue-label">Doanh Thu Hôm Nay</div>
        </div>
        <div className="revenue-card">
          <div className="revenue-number">{formatMoney(stats.revenueThisMonth)}</div>
          <div className="revenue-label">Doanh Thu Tháng</div>
        </div>
        <div className="revenue-card">
          <div className="revenue-number">{formatMoney(stats.revenueYesterday)}</div>
          <div className="revenue-label">Doanh Thu Hôm Qua</div>
        </div>

        <div className="revenue-card">
          <div className="revenue-number">{formatMoney(stats.totalProfit)}</div>
          <div className="revenue-label">Tổng Lợi Nhuận</div>
        </div>
        <div className="revenue-card">
          <div className="revenue-number">{formatMoney(stats.profitToday)}</div>
          <div className="revenue-label">Lợi Nhuận Hôm {stats.profitTodayDate || ''}</div>
        </div>
        <div className="revenue-card">
          <div className="revenue-number">{formatMoney(stats.profitThisMonth)}</div>
          <div className="revenue-label">Lợi Nhuận Tháng {stats.profitThisMonthDate || ''}</div>
        </div>
        <div className="revenue-card">
          <div className="revenue-number">{formatMoney(stats.profitLastMonth)}</div>
          <div className="revenue-label">Lợi Nhuận Tháng Trước</div>
        </div>
      </div>
    </div>
  );
}


