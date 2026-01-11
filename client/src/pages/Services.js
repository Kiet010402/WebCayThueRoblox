import React from 'react';
import './Services.css';

function Services() {
  const services = [
    {
      id: 1,
      title: '🔄 Đổi Mật Khẩu',
      description: 'Hỗ trợ đổi mật khẩu nếu quên hoặc cần bảo mật',
      price: 'Miễn Phí'
    },
    {
      id: 2,
      title: '🔐 Xác Minh 2 Lớp',
      description: 'Bảo vệ tài khoản với xác minh 2 lớp',
      price: 'Miễn Phí'
    },
    {
      id: 3,
      title: '📧 Khôi Phục Email',
      description: 'Giúp khôi phục email tài khoản',
      price: '50,000 đ'
    },
    {
      id: 4,
      title: '🎁 Gamepass',
      description: 'Mua gamepass cho game của bạn',
      price: 'Liên Hệ'
    },
    {
      id: 5,
      title: '💎 Robux',
      description: 'Mua Robux trực tiếp vào tài khoản',
      price: 'Liên Hệ'
    },
    {
      id: 6,
      title: '👤 Đổi Tên Acc',
      description: 'Hỗ trợ đổi tên tài khoản Roblox',
      price: '100,000 đ'
    }
  ];

  return (
    <div className="services-container">
      <h1>🛠️ DỊCH VỤ KHÁC</h1>
      <p className="subtitle">Các dịch vụ bổ sung để hỗ trợ tài khoản của bạn</p>

      <div className="services-grid">
        {services.map(service => (
          <div key={service.id} className="service-card">
            <h3>{service.title}</h3>
            <p>{service.description}</p>
            <div className="service-footer">
              <span className="price">{service.price}</span>
              <button className="btn-order">Đặt Hàng</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Services;
