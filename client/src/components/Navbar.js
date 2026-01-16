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
          KAIHONSHOP
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
          <li><Link to="/wallet" onClick={closeMenu}>Dùng Tiền</Link></li>
          <li><Link to="/news" onClick={closeMenu}>Tin Tức</Link></li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
