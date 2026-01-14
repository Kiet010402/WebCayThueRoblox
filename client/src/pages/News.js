import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import './News.css';

function News() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await api.get('/api/news');
      setNews(response.data);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  if (loading) {
    return <div className="news-container"><p>Đang tải tin tức...</p></div>;
  }

  return (
    <div className="news-container">
      <h1>📰 TIN TỨC</h1>
      <p className="subtitle">Cập nhật tin tức và thông báo mới nhất từ shop</p>

      {news.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
          Chưa có tin tức nào
        </div>
      ) : (
        <div className="news-grid">
          {news.map(article => (
            <div key={article._id} className="news-card">
              <div className="news-category">{article.category || '📢 Thông Báo'}</div>
              <h3>{article.title}</h3>
              <p className="news-date">📅 {formatDate(article.createdAt)}</p>
              <p className="news-content">{article.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default News;
