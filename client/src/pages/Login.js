import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import './Auth.css';

// Helper function to mask email (only show last 2 digits before @)
const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email;
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) return `***${localPart}@${domain}`;
  const maskedPart = '*'.repeat(Math.max(8, localPart.length - 2)) + localPart.slice(-2);
  return `${maskedPart}@${domain}`;
};

// Helper function to fake email domain (gmail -> outlook)
const fakeEmailDomain = (email) => {
  if (!email || !email.includes('@')) return email;
  const [localPart, domain] = email.split('@');
  // Replace common email domains with fake ones
  const fakeDomains = {
    'gmail.com': 'outlook.com',
    'yahoo.com': 'outlook.com',
    'hotmail.com': 'outlook.com',
    'outlook.com': 'gmail.com'
  };
  const fakeDomain = fakeDomains[domain.toLowerCase()] || domain;
  return `${localPart}@${fakeDomain}`;
};

function Login({ setUser }) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [adminCodeData, setAdminCodeData] = useState({
    username: '',
    email: '',
    code: ''
  });
  const [step, setStep] = useState('login'); // 'login', 'forgot', 'reset', 'admin-code'
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

  const handleForgotPasswordChange = (e) => {
    const { name, value } = e.target;
    setForgotPasswordData(prev => ({
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
    setError('');
    setSuccess('');
    try {
      const response = await api.post('/api/users/login', {
        username: formData.username,
        password: formData.password
      });

      // Check if admin requires 2FA code
      if (response.data.requiresCode) {
        setAdminCodeData({
          username: formData.username,
          email: response.data.email || '',
          code: response.data.code || '' // Auto-fill in dev mode
        });
        
        if (response.data.code) {
          // Development mode - show code
          setSuccess(`✅ ${response.data.message}\n\n🔑 Mã xác nhận:\n${response.data.code}`);
        } else {
          setSuccess('✅ ' + response.data.message);
        }
        
        setStep('admin-code');
        setLoading(false);
        return;
      }

      // Normal login for non-admin users
      // Token is now stored in httpOnly cookie, don't save to localStorage
      // Only save minimal user info (no token, no email)
      const userInfo = {
        id: response.data.user.id,
        username: response.data.user.username,
        balance: response.data.user.balance || 0,
        role: response.data.user.role || 'user'
      };
      // Don't store user in localStorage for security
      setUser(userInfo);
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

  const handleVerifyAdminCode = async (e) => {
    e.preventDefault();
    
    if (!adminCodeData.code.trim()) {
      setError('❌ Vui lòng nhập mã xác nhận');
      return;
    }

    if (adminCodeData.code.length !== 6) {
      setError('❌ Mã xác nhận phải có 6 số');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await api.post('/api/users/verify-admin-code', {
        username: adminCodeData.username,
        code: adminCodeData.code
      });

      // Token is now stored in httpOnly cookie, don't save to localStorage
      // Only save minimal user info
      const userInfo = {
        id: response.data.user.id,
        username: response.data.user.username,
        balance: response.data.user.balance || 0,
        role: response.data.user.role || 'admin'
      };
      // Don't store user in localStorage for security
      setUser(userInfo);
      setSuccess('✅ Xác thực thành công! Đang chuyển hướng...');
      
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Mã xác nhận không chính xác. Vui lòng thử lại!';
      setError('❌ ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!forgotPasswordData.email.trim()) {
      setError('❌ Vui lòng nhập email');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await api.post('/api/users/forgot-password', {
        email: forgotPasswordData.email
      });

      // If code is returned (development mode), show it and auto-fill
      if (response.data.code) {
        setForgotPasswordData(prev => ({
          ...prev,
          code: response.data.code
        }));
        setSuccess(`✅ ${response.data.message}\n\n🔑 Mã xác nhận:\n${response.data.code}`);
      } else {
        setSuccess('✅ ' + response.data.message);
      }
      setStep('reset');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Không thể gửi mã xác nhận. Vui lòng thử lại sau!';
      setError('❌ ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!forgotPasswordData.code.trim()) {
      setError('❌ Vui lòng nhập mã xác nhận');
      return;
    }
    if (!forgotPasswordData.newPassword.trim()) {
      setError('❌ Vui lòng nhập mật khẩu mới');
      return;
    }
    if (forgotPasswordData.newPassword.length < 6) {
      setError('❌ Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (forgotPasswordData.newPassword !== forgotPasswordData.confirmPassword) {
      setError('❌ Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await api.post('/api/users/reset-password', {
        email: forgotPasswordData.email,
        code: forgotPasswordData.code,
        newPassword: forgotPasswordData.newPassword,
        confirmPassword: forgotPasswordData.confirmPassword
      });

      setSuccess('✅ ' + response.data.message);
      setTimeout(() => {
        setStep('login');
        setForgotPasswordData({
          email: '',
          code: '',
          newPassword: '',
          confirmPassword: ''
        });
        setSuccess('');
      }, 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại!';
      setError('❌ ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        {step === 'login' && (
          <>
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
              <p style={{ marginTop: '0.5rem' }}>
                <button 
                  type="button"
                  onClick={() => {
                    setStep('forgot');
                    setError('');
                    setSuccess('');
                  }}
                  className="forgot-password-link"
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  Quên mật khẩu?
                </button>
              </p>
            </div>
          </>
        )}

        {step === 'forgot' && (
          <>
            <h1>🔑 QUÊN MẬT KHẨU</h1>
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <form onSubmit={handleForgotPassword}>
              <div className="form-group">
                <label>📧 Email:</label>
                <input 
                  type="email" 
                  name="email"
                  placeholder="Nhập email đã đăng ký"
                  value={forgotPasswordData.email}
                  onChange={handleForgotPasswordChange}
                  required
                />
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? '⏳ Đang gửi...' : '✅ GỬI MÃ XÁC NHẬN'}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                <button 
                  type="button"
                  onClick={() => {
                    setStep('login');
                    setError('');
                    setSuccess('');
                    setForgotPasswordData({
                      email: '',
                      code: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                  className="forgot-password-link"
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  ← Quay lại đăng nhập
                </button>
              </p>
            </div>
          </>
        )}

        {step === 'reset' && (
          <>
            <h1>🔐 ĐẶT LẠI MẬT KHẨU</h1>
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label>📧 Email:</label>
                <input 
                  type="email" 
                  name="email"
                  value={forgotPasswordData.email}
                  disabled
                  className="disabled-input"
                />
              </div>

              <div className="form-group">
                <label>🔢 Mã Xác Nhận (6 số):</label>
                <input 
                  type="text" 
                  name="code"
                  placeholder="Nhập mã xác nhận từ email"
                  value={forgotPasswordData.code}
                  onChange={handleForgotPasswordChange}
                  maxLength={6}
                  required
                />
              </div>

              <div className="form-group">
                <label>🔐 Mật Khẩu Mới:</label>
                <input 
                  type="password" 
                  name="newPassword"
                  placeholder="Nhập mật khẩu mới (6+ ký tự)"
                  value={forgotPasswordData.newPassword}
                  onChange={handleForgotPasswordChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>🔐 Xác Nhận Mật Khẩu:</label>
                <input 
                  type="password" 
                  name="confirmPassword"
                  placeholder="Nhập lại mật khẩu mới"
                  value={forgotPasswordData.confirmPassword}
                  onChange={handleForgotPasswordChange}
                  required
                />
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? '⏳ Đang xử lý...' : '✅ ĐẶT LẠI MẬT KHẨU'}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                <button 
                  type="button"
                  onClick={() => {
                    setStep('forgot');
                    setForgotPasswordData(prev => ({
                      ...prev,
                      code: '',
                      newPassword: '',
                      confirmPassword: ''
                    }));
                    setError('');
                    setSuccess('');
                  }}
                  className="forgot-password-link"
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  ← Quay lại
                </button>
              </p>
            </div>
          </>
        )}

        {step === 'admin-code' && (
          <>
            <h1>🔐 XÁC THỰC ĐĂNG NHẬP ADMIN</h1>
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <form onSubmit={handleVerifyAdminCode}>
              <div className="form-group">
                <label>👤 Tên Đăng Nhập:</label>
                <input 
                  type="text" 
                  value={adminCodeData.username}
                  disabled
                  className="disabled-input"
                />
              </div>

              <div className="form-group">
                <label>📧 Email:</label>
                <input 
                  type="email" 
                  value={adminCodeData.email ? fakeEmailDomain(maskEmail(adminCodeData.email)) : ''}
                  disabled
                  className="disabled-input"
                />
              </div>

              <div className="form-group">
                <label>🔢 Mã Xác Nhận (6 số):</label>
                <input 
                  type="text" 
                  name="code"
                  placeholder="Nhập mã xác nhận từ email"
                  value={adminCodeData.code}
                  onChange={(e) => setAdminCodeData(prev => ({ ...prev, code: e.target.value }))}
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? '⏳ Đang xác thực...' : '✅ XÁC THỰC'}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                <button 
                  type="button"
                  onClick={() => {
                    setStep('login');
                    setAdminCodeData({
                      username: '',
                      email: '',
                      code: ''
                    });
                    setFormData({
                      username: '',
                      password: ''
                    });
                    setError('');
                    setSuccess('');
                  }}
                  className="forgot-password-link"
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  ← Quay lại đăng nhập
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;
