import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './Recharge.css';

function Recharge() {
  const navigate = useNavigate();
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [billImage, setBillImage] = useState(null);
  const [billImagePreview, setBillImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  // Card information
  const [cardType, setCardType] = useState('Vinaphone');
  const [cardCode, setCardCode] = useState('');
  const [cardSerial, setCardSerial] = useState('');

  const paymentMethods = [
    { id: 'bank', name: '💳 Chuyển Khoản Ngân Hàng', icon: '🏦' },
    { id: 'momo', name: '📱 Ví MoMo', icon: '📱' },
    { id: 'tsr', name: '🔗 Thẻ Siêu Rẻ', icon: '🔗' },
    { id: 'card', name: '📞 Thẻ Cào Điện Thoại', icon: '📞' },
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
    },
    tsr: {
      title: 'Thanh Toán Qua Thẻ Siêu Rẻ',
      description: 'Thanh toán qua cổng Thẻ Siêu Rẻ. Vui lòng làm theo hướng dẫn tại ô Thông Tin TSR bên dưới.'
    },
    card: {
      title: 'Nạp Tiền Bằng Thẻ Cào',
      description: 'Nạp tiền bằng thẻ cào điện thoại (Viettel, Vinaphone, Mobifone). Vui lòng upload ảnh thẻ cào rõ ràng, đầy đủ thông tin mã thẻ và serial.'
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
    // Check if user is logged in by trying to fetch user info
    try {
      await api.get('/api/users/me');
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('Vui lòng đăng nhập để nạp tiền');
        navigate('/login');
        return;
      }
    }

    const amount = parseInt(customAmount);
    if (!amount || isNaN(amount) || amount < 5000) {
      alert('Số tiền tối thiểu là 5.000đ');
      return;
    }
    if (amount > 10000000) {
      alert('Số tiền tối đa là 10.000.000đ');
      return;
    }

    if (paymentMethod !== 'card') {
    if (!billImage) {
      alert('Vui lòng upload hình bill');
      return;
      }
    } else {
      if (!cardCode || !cardSerial) {
        alert('Vui lòng nhập đầy đủ mã thẻ và serial');
        return;
      }
    }

    setLoading(true);
    try {
      let billImageUrl = billImage;

      // Upload image to Cloudinary if payment method is not card
      if (paymentMethod !== 'card' && billImage) {
        try {
          const uploadResponse = await api.post('/api/upload/image', 
            { image: billImage },
            {
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
          billImageUrl = uploadResponse.data.imageUrl;
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          const errorMsg = uploadError.response?.data?.message || 'Có lỗi xảy ra khi upload ảnh';
          alert(errorMsg);
          setLoading(false);
          return;
        }
      }

      const requestData = {
        amount: amount,
        paymentMethod
      };

      if (paymentMethod === 'card') {
        requestData.cardType = cardType;
        requestData.cardCode = cardCode;
        requestData.cardSerial = cardSerial;
      } else {
        requestData.billImage = billImageUrl; // Use Cloudinary URL instead of base64
      }

      await api.post('/api/recharge', requestData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      alert('Yêu cầu nạp tiền đã được gửi! Vui lòng chờ admin duyệt.');
      setCustomAmount('');
      setBillImage(null);
      setBillImagePreview(null);
      if (paymentMethod === 'card') {
        setCardType('Vinaphone');
        setCardCode('');
        setCardSerial('');
      }
      navigate('/profile', { state: { activeTab: 'recharge-history' } });
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
              placeholder="Nhập số tiền (5.000đ - 10.000.000đ)"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              min="5000"
              max="10000000"
            />
            <span className="currency-label">VND</span>
          </div>
          {customAmount && (
            <>
              {parseInt(customAmount) < 5000 && (
            <p className="error-text">Số tiền tối thiểu là 5.000đ</p>
              )}
              {parseInt(customAmount) > 10000000 && (
                <p className="error-text">Số tiền tối đa là 10.000.000đ</p>
              )}
            </>
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

          {paymentMethod !== 'card' && (
            <>
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
            </>
          )}
        </div>

        <div className="recharge-right">
          <div className="summary-card">
            <h2>Thông Tin Thanh Toán</h2>

            <div className="payment-info-box">
              <h3>{currentPaymentInfo.title}</h3>
              {paymentMethod === 'bank' && (
                <>
                  <p><strong>STK:</strong> {currentPaymentInfo.account}</p>
                  <p><strong>Ngân hàng:</strong> {currentPaymentInfo.bank}</p>
                  <p><strong>Chủ tài khoản:</strong> {currentPaymentInfo.owner}</p>
                  <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <img 
                      src="https://media.discordapp.net/attachments/1324248040206368828/1462140945989505095/image.png?ex=696d1c5e&is=696bcade&hm=46b313a657dfd84d9554cbdb374cad2a7ce8247fe900470e25a6355a4b2d3aff&=&format=webp&quality=lossless" 
                      alt="QR Code chuyển khoản" 
                      style={{ 
                        maxWidth: '200px', 
                        maxHeight: '200px', 
                        border: '1px solid #ddd', 
                        borderRadius: '8px',
                        padding: '0.5rem',
                        backgroundColor: 'white'
                      }} 
                    />
                  </div>
                </>
              )}
              {paymentMethod === 'momo' && (
                <>
                  <p><strong>Số điện thoại:</strong> {currentPaymentInfo.account}</p>
                  <p><strong>Chủ tài khoản:</strong> {currentPaymentInfo.owner}</p>
                </>
              )}
              {paymentMethod === 'tsr' && (
                <>
                  <p>{currentPaymentInfo.description}</p>
                </>
              )}
              {paymentMethod === 'card' && (
                <>
                  <div style={{ marginTop: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                      Loại thẻ:
                    </label>
                    <select
                      value={cardType}
                      onChange={(e) => setCardType(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="Vinaphone">Vinaphone</option>
                      <option value="Viettel">Viettel</option>
                      <option value="Mobifone">Mobifone</option>
                      <option value="Zing">Zing</option>
                      <option value="Garena">Garena</option>
                    </select>
                  </div>
                  <div style={{ marginTop: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                      Mã:
                    </label>
                    <input
                      type="text"
                      value={cardCode}
                      onChange={(e) => setCardCode(e.target.value)}
                      placeholder="Nhập mã thẻ"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                  <div style={{ marginTop: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                      Serial:
                    </label>
                    <input
                      type="text"
                      value={cardSerial}
                      onChange={(e) => setCardSerial(e.target.value)}
                      placeholder="Nhập serial thẻ"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
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
              disabled={
                loading || 
                !customAmount || 
                parseInt(customAmount) < 5000 || 
                (paymentMethod !== 'card' && !billImage) ||
                (paymentMethod === 'card' && (!cardCode || !cardSerial))
              }
            >
              {loading ? 'Đang xử lý...' : '💳 TIẾN HÀNH THANH TOÁN'}
            </button>

            <div className="info-box">
              <h4>ℹ️ Lưu Ý Quan Trọng</h4>
              <ul>
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
