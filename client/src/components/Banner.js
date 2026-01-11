import React from 'react';
import { Link } from 'react-router-dom';
import './Banner.css';

function Banner() {
  return (
    <div className="banner">
      <div className="banner-content">
        <h1>SHOP CÀY THUÊ KAIHON</h1>
        <p className="subtitle">Kaihon Shop - Cày Thuê Game - Nick Roblox</p>
        <div className="banner-features">
          <div className="feature">
            <span>✅</span> Giá Rẻ
          </div>
          <div className="feature">
            <span>✅</span> Hỗ Trợ 24/7
          </div>
        </div>
        <div className="banner-buttons">
          <Link to="/cay-thue" className="btn btn-primary">
             CÀY THUÊ NGAY
          </Link>
          <Link to="/recharge" className="btn btn-secondary">
            NẠP TIỀN NGAY
          </Link>
        </div>
      </div>
      <div className="banner-decoration">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>
    </div>
  );
}

export default Banner;
