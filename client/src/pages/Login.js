import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { getApiUrl } from '../config';
import './Auth.css';

function Login({ setUser }) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
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
    if (!formData.password.trim()) {
      setError('❌ Mật khẩu không được để trống');
      return false;
    }
    if (formData.password.length < 6) {
      setError('❌ Mật khẩu phải ít nhất 6 ký tự');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await axios.post(getApiUrl('/api/users/login'), {
        username: formData.username,
        password: formData.password
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      setSuccess('✅ Đăng nhập thành công! Đang chuyển hướng...');
      
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Tên đăng nhập hoặc mật khẩu không chính xác!';
      setError('❌ ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h1>🔐 ĐĂNG NHẬP</h1>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>👤 Tên Đăng Nhập:</label>
            <input 
              type="text" 
              name="username"
              placeholder="Nhập tên đăng nhập"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>🔐 Mật Khẩu:</label>
            <input 
              type="password" 
              name="password"
              placeholder="Nhập mật khẩu"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? '⏳ Đang xử lý...' : '✅ ĐĂNG NHẬP'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Login;
