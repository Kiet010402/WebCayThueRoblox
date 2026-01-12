import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getApiUrl } from '../config';
import axios from 'axios';
import './Auth.css';

function Register({ setUser }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('❌ Tên đăng nhập không được để trống');
      return false;
    }
    if (formData.username.length < 3) {
      setError('❌ Tên đăng nhập phải ít nhất 3 ký tự');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('❌ Email không hợp lệ');
      return false;
    }
    if (formData.password.length < 6) {
      setError('❌ Mật khẩu phải ít nhất 6 ký tự');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('❌ Mật khẩu xác nhận không khớp');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await axios.post(getApiUrl('/api/users/register'), {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      setSuccess('✅ Đăng ký thành công! Đang chuyển hướng...');
      
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại!';
      setError('❌ ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h1>📝 ĐĂNG KÝ TÀI KHOẢN</h1>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>👤 Tên Đăng Nhập:</label>
            <input 
              type="text" 
              name="username"
              placeholder="Nhập tên đăng nhập (3+ ký tự)"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>📧 Email:</label>
            <input 
              type="email" 
              name="email"
              placeholder="Nhập email của bạn"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>🔐 Mật Khẩu:</label>
            <input 
              type="password" 
              name="password"
              placeholder="Nhập mật khẩu (6+ ký tự)"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>🔐 Xác Nhận Mật Khẩu:</label>
            <input 
              type="password" 
              name="confirmPassword"
              placeholder="Nhập lại mật khẩu"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? '⏳ Đang xử lý...' : '✅ ĐĂNG KÝ'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Register;
