import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Recharge.css';

function Recharge() {
  const navigate = useNavigate();
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [billImage, setBillImage] = useState(null);
  const [billImagePreview, setBillImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const paymentMethods = [
    { id: 'bank', name: '💳 Chuyển Khoản Ngân Hàng', icon: '🏦' },
    { id: 'momo', name: '📱 Ví MoMo', icon: '📱' },
  ];

  const paymentInfo = {
    bank: {
      title: 'Thông Tin Chuyển Khoản Ngân Hàng',
      account: '19070021687013',
      bank: 'Techcombank',
      owner: 'DUONG THI NHU Y'
    },
    momo: {
      title: 'Thông Tin Ví MoMo',
      account: '0936596825',
      owner: 'DUONG THI NHU Y'
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước ảnh không được vượt quá 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBillImage(reader.result);
        setBillImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRecharge = async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!user || !token) {
      alert('Vui lòng đăng nhập để nạp tiền');
      navigate('/login');
      return;
    }

    const amount = parseInt(customAmount);
    if (!amount || isNaN(amount) || amount < 5000) {
      alert('Số tiền tối thiểu là 5.000đ');
      return;
    }

    if (!billImage) {
      alert('Vui lòng upload hình bill');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/recharge', {
        amount: amount,
        paymentMethod,
        billImage
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      alert('Yêu cầu nạp tiền đã được gửi! Vui lòng chờ admin duyệt.');
      setCustomAmount('');
      setBillImage(null);
      setBillImagePreview(null);
      navigate('/wallet');
    } catch (error) {
      console.error('Recharge error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi nạp tiền';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const currentPaymentInfo = paymentInfo[paymentMethod];

  return (
    <div className="recharge-container">
      <h1>💰 NẠP TIỀN VÀO TÀI KHOẢN</h1>

      <div className="recharge-content">
        <div className="recharge-left">
          <h2>Nhập Số Tiền</h2>
          <div className="amount-input-group">
            <input
              type="number"
              className="amount-input"
              placeholder="Nhập số tiền (tối thiểu 5.000đ)"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              min="5000"
            />
            <span className="currency-label">VND</span>
          </div>
          {customAmount && parseInt(customAmount) < 5000 && (
            <p className="error-text">Số tiền tối thiểu là 5.000đ</p>
          )}

          <h2 style={{ marginTop: '2rem' }}>Phương Thức Thanh Toán</h2>
          <div className="payment-methods">
            {paymentMethods.map(method => (
              <div
                key={method.id}
                className={`payment-method ${paymentMethod === method.id ? 'active' : ''}`}
                onClick={() => setPaymentMethod(method.id)}
              >
                <span className="icon">{method.icon}</span>
                <span>{method.name}</span>
              </div>
            ))}
          </div>

          <h2 style={{ marginTop: '2rem' }}>Upload Hình Bill</h2>
          <div className="bill-upload">
            <input
              type="file"
              id="bill-upload"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="bill-upload" className="upload-label">
              {billImagePreview ? '📷 Thay đổi ảnh' : '📷 Chọn ảnh bill'}
            </label>
            {billImagePreview && (
              <div className="image-preview">
                <img src={billImagePreview} alt="Bill preview" />
                <button 
                  className="remove-image-btn"
                  onClick={() => {
                    setBillImage(null);
                    setBillImagePreview(null);
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="recharge-right">
          <div className="summary-card">
            <h2>Thông Tin Thanh Toán</h2>

            <div className="payment-info-box">
              <h3>{currentPaymentInfo.title}</h3>
              {paymentMethod === 'bank' ? (
                <>
                  <p><strong>STK:</strong> {currentPaymentInfo.account}</p>
                  <p><strong>Ngân hàng:</strong> {currentPaymentInfo.bank}</p>
                  <p><strong>Chủ tài khoản:</strong> {currentPaymentInfo.owner}</p>
                </>
              ) : (
                <>
                  <p><strong>Số điện thoại:</strong> {currentPaymentInfo.account}</p>
                  <p><strong>Chủ tài khoản:</strong> {currentPaymentInfo.owner}</p>
                </>
              )}
            </div>

            <div className="payment-info-box">
              <h3>Thông Tin TSR</h3>
              <p><strong>Email:</strong> Honkaineh@gmail.com</p>
            </div>

            <div className="summary-line">
              <span>Số Tiền:</span>
              <strong>{customAmount ? parseInt(customAmount).toLocaleString('vi-VN') : '0'} đ</strong>
            </div>

            <div className="summary-line">
              <span>Phương Thức:</span>
              <strong>
                {paymentMethods.find(m => m.id === paymentMethod)?.name.replace(/[📱💳💰🔗]/g, '').trim()}
              </strong>
            </div>

            <button 
              className="recharge-btn" 
              onClick={handleRecharge}
              disabled={loading || !customAmount || parseInt(customAmount) < 5000 || !billImage}
            >
              {loading ? 'Đang xử lý...' : '💳 TIẾN HÀNH THANH TOÁN'}
            </button>

            <div className="info-box">
              <h4>ℹ️ Lưu Ý Quan Trọng</h4>
              <ul>
                <li>✓ Vui lòng chuyển đúng số tiền và ghi chú tên đăng nhập</li>
                <li>✓ Upload bill sau khi chuyển khoản</li>
                <li>✓ Admin sẽ duyệt trong vòng 5-30 phút</li>
                <li>✓ Tiền sẽ được cộng vào tài khoản sau khi admin duyệt</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Recharge;
