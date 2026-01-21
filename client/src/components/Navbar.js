import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          <img
            src="https://media.discordapp.net/attachments/1324272692114886687/1462828286773039175/Thiet_ke_chua_co_ten.gif?ex=696f9c81&is=696e4b01&hm=1a6e5015482ff6af1398eb01b3bc2c446eceafff96432bf87a6fb7366be2a43c&="
            alt="KAIHONSHOP"
            className="navbar-logo-img"
          />
        </Link>
        <div className="navbar-right">
          {user && (
            <div className="navbar-auth-mobile-visible">
              <span className="user-balance">{user.balance?.toLocaleString('vi-VN') || '0'}đ</span>
              <Link to="/profile" className="user-name" onClick={closeMenu}>👤 {user.username}</Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="btn-admin" onClick={closeMenu}>Admin</Link>
              )}
            </div>
          )}
          {!user && (
            <div className="navbar-auth-mobile-visible">
              <Link to="/login" className="btn-login" onClick={closeMenu}>Đăng Nhập</Link>
              <Link to="/register" className="btn-register" onClick={closeMenu}>Đăng Ký</Link>
            </div>
          )}
          <button className="navbar-toggle" onClick={toggleMenu} aria-label="Toggle menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
        <ul className={`navbar-menu ${menuOpen ? 'active' : ''}`}>
          <li><Link to="/" onClick={closeMenu}>Trang Chủ</Link></li>
          <li><Link to="/cay-thue" onClick={closeMenu}>Cày Thuê</Link></li>
          <li><Link to="/nick-roblox" onClick={closeMenu}>Nick Roblox</Link></li>
          <li><Link to="/history" onClick={closeMenu}>Lịch Sử</Link></li>
          <li><Link to="/recharge" onClick={closeMenu}>Nạp Tiền</Link></li>
          <li><Link to="/news" onClick={closeMenu}>Tin Tức</Link></li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
