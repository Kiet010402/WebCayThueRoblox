import React, { useEffect, useState } from 'react';
import Banner from '../components/Banner';
import TopRanking from '../components/TopRanking';
import api from '../api/axios';
import './Home.css';

function Home() {
  const [announcement, setAnnouncement] = useState({ title: '', content: '' });
  const [loadingAnnouncement, setLoadingAnnouncement] = useState(true);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      const res = await api.get('/api/announcement');
      setAnnouncement({
        title: res.data?.title || 'Thông Báo | Trang Chủ',
        content: res.data?.content || ''
      });
    };

    // Kiểm tra xem user có tắt popup trong 2 giờ trước đó không
    const hiddenUntil = parseInt(localStorage.getItem('announcementHideUntil') || '0', 10);
    if (Date.now() < hiddenUntil) {
      setShowAnnouncementModal(false);
    } else {
      setShowAnnouncementModal(true);
    }

    setLoadingAnnouncement(true);
    fetchAnnouncement()
      .catch((err) => {
        console.error('Error fetching announcement:', err);
        setAnnouncement({ title: 'Thông Báo | Trang Chủ', content: '' });
      })
      .finally(() => setLoadingAnnouncement(false));
  }, []);

  const handleCloseModal = () => {
    setShowAnnouncementModal(false);
  };

  const handleHideFor2Hours = () => {
    const twoHours = 2 * 60 * 60 * 1000;
    const until = Date.now() + twoHours;
    localStorage.setItem('announcementHideUntil', String(until));
    setShowAnnouncementModal(false);
  };

  return (
    <div className="home">
      <div className="notices-section announcement-top">
        <h2 className="section-title">{announcement.title || '⚠️ THÔNG BÁO'}</h2>
        <div className="notice-card">
          {loadingAnnouncement ? (
            <div style={{ color: '#666' }}>Đang tải thông báo...</div>
          ) : announcement.content ? (
            <div
              className="announcement-html"
              dangerouslySetInnerHTML={{ __html: announcement.content }}
            />
          ) : (
            <div style={{ color: '#666' }}>Chưa có thông báo</div>
          )}
        </div>
      </div>

      <Banner />
      <TopRanking />

      <div className="info-section">
        <div className="info-grid">
          <div className="info-card">
            <h3>📱 LIÊN HỆ VỚI CHÚNG TÔI</h3>
            <p><strong>Discord:</strong> Kaihon</p>
            <p><strong>Gmail:</strong> dkiet9337@gmail.com</p>
            <p><strong>Số điện thoại:</strong> 0968883202</p>
          </div>

          <div className="info-card">
            <h3>🎁 ƯU ĐÃI ĐẶC BIỆT</h3>
            <p>✅ Hỗ Trợ 24/7</p>
            <p>✅ Hoàn Tiền 100% Nếu Lỗi</p>
          </div>

          <div className="info-card">
            <h3>🔒 AN TOÀN VÀ BẢO MẬT</h3>
            <p>✅ Mã Hóa SSL Toàn Bộ</p>
            <p>✅ Không Lưu Trữ Thông Tin</p>
          </div>
        </div>
      </div>

      {showAnnouncementModal && (
        <div className="announcement-modal-overlay" onClick={handleCloseModal}>
          <div className="announcement-modal" onClick={(e) => e.stopPropagation()}>
            <div className="announcement-modal-header">
              <span>🔔 Thông báo</span>
              <button className="announcement-modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <div className="announcement-modal-body">
              {loadingAnnouncement ? (
                <div style={{ color: '#666' }}>Đang tải thông báo...</div>
              ) : (
                <div
                  className="announcement-html"
                  dangerouslySetInnerHTML={{ __html: announcement.content || '' }}
                />
              )}
            </div>
            <div className="announcement-modal-footer">
              <button className="announcement-hide-btn" onClick={handleHideFor2Hours}>
                Không hiển thị lại trong 2 giờ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
