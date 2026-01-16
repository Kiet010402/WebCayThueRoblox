import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar({ user, onLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          KAIHONSHOP
        </Link>
        <ul className="navbar-menu">
          <li><Link to="/">Trang Chủ</Link></li>
          <li><Link to="/cay-thue">Cày Thuê</Link></li>
          <li><Link to="/nick-roblox">Nick Roblox</Link></li>
          <li><Link to="/history">Lịch Sử</Link></li>
          <li><Link to="/recharge">Nạp Tiền</Link></li>
          <li><Link to="/wallet">Dùng Tiền</Link></li>
          <li><Link to="/news">Tin Tức</Link></li>
        </ul>
        
        <div className="navbar-auth">
          {user ? (
            <>
              <span className="user-balance"> {user.balance?.toLocaleString('vi-VN') || '0'}đ</span>
              <Link to="/profile" className="user-name">👤 {user.username}</Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="btn-admin">Admin</Link>
              )}
              <button onClick={onLogout} className="btn-logout">Đăng Xuất</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-login">Đăng Nhập</Link>
              <Link to="/register" className="btn-register">Đăng Ký</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
