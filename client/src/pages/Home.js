import React from 'react';
import { useNavigate } from 'react-router-dom';
import Banner from '../components/Banner';
import TopRanking from '../components/TopRanking';
import './Home.css';

function Home() {
  const navigate = useNavigate();

  const notices = [
    {
      id: 1,
      title: '⚠️ LƯU Ý KHI ĐẶT ĐƠN TRÊN SHOP',
      items: [
        '- Đặt Đơn: Tuyệt đối không được vào acc. Khi nào trang thái "Hoàn thành" là xong',
      ]
    }
  ];

  return (
    <div className="home">
      <Banner />
      <TopRanking />

      <div className="notices-section">
        <h2 className="section-title">⚠️ LƯU Ý QUAN TRỌNG</h2>
        {notices.map(notice => (
          <div key={notice.id} className="notice-card">
            <h3>{notice.title}</h3>
            <ul className="notice-items">
              {notice.items.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

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
    </div>
  );
}

export default Home;
