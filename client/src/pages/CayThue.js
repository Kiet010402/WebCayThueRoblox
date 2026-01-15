import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './CayThue.css';

function CayThue() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [games, setGames] = useState([]);
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherMessage, setVoucherMessage] = useState('');
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user') || 'null');
    if (token && userData) {
      // Fetch latest user info to get discount
      api.get('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(response => {
        setUser(response.data);
      }).catch(err => {
        console.error('Error fetching user:', err);
        setUser(userData);
      });
    }
  }, []);

  useEffect(() => {
    const fetchPricing = async () => {
      const res = await api.get('/api/pricing/caythue');
      setGames(Array.isArray(res.data?.data) ? res.data.data : []);
    };
    setLoadingPricing(true);
    fetchPricing()
      .catch((err) => {
        console.error('Error fetching pricing:', err);
        setGames([]);
      })
      .finally(() => setLoadingPricing(false));
  }, []);

  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [formData, setFormData] = useState({
    category: '',
    service: '',
    username: '',
    password: '',
    backupCode: '',
    notes: ''
  });

  const handleGameClick = (game) => {
    setSelectedGame(game);
    setSelectedCategory(null);
    setSelectedService(null);
    setFormData({ category: '', service: '', username: '', password: '', backupCode: '', notes: '' });
    // Reset voucher khi đổi game
    setAppliedVoucher(null);
    setVoucherMessage('');
    setVoucherCode('');
  };

  const handleServiceClick = (service) => {
    setSelectedService(service);
    setFormData({ ...formData, service: service.name });
    // Reset voucher info when đổi dịch vụ
    setAppliedVoucher(null);
    setVoucherMessage('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Khi chọn loại từ dropdown
    if (name === 'category' && selectedGame) {
      setSelectedCategory(value);
      setSelectedService(null);
      setFormData({ ...formData, category: value, service: '' });
      // Reset voucher khi đổi loại
      setAppliedVoucher(null);
      setVoucherMessage('');
      setVoucherCode('');
      return;
    }
    
    // Cập nhật formData cho các field khác
    setFormData({ ...formData, [name]: value });
    
    // Khi chọn dịch vụ từ dropdown, cập nhật selectedService
    if (name === 'service' && selectedGame) {
      let newService = null;
      if (selectedCategory && selectedGame.serviceCategories) {
        const category = selectedGame.serviceCategories[selectedCategory];
        if (category) {
          newService = category.services.find(s => s.name === value);
        }
      } else if (selectedGame.services) {
        // Fallback cho các game không có serviceCategories
        newService = selectedGame.services.find(s => s.name === value);
      }
      
      // Reset voucher khi đổi dịch vụ
      if (newService && (!selectedService || selectedService.name !== value)) {
        setAppliedVoucher(null);
        setVoucherMessage('');
        setVoucherCode('');
      }
      
      setSelectedService(newService || null);
    }
  };

  const handleApplyVoucher = async () => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user') || 'null');

    if (!token || !userData) {
      alert('Vui lòng đăng nhập để áp dụng voucher');
      navigate('/login');
      return;
    }

    if (!selectedService) {
      alert('Vui lòng chọn dịch vụ trước khi áp dụng voucher');
      return;
    }

    if (!voucherCode.trim()) {
      alert('Vui lòng nhập mã voucher');
      return;
    }

    const servicePrice = Number(selectedService.price);
    if (!Number.isFinite(servicePrice) || servicePrice <= 0) {
      alert('Giá dịch vụ không hợp lệ');
      return;
    }

    setApplyingVoucher(true);
    setVoucherMessage('');
    setAppliedVoucher(null);

    try {
      const res = await api.post(
        '/api/vouchers/apply',
        {
          code: voucherCode.trim().toUpperCase(),
          amount: servicePrice,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data?.valid) {
        setAppliedVoucher(res.data);
        setVoucherMessage(
          `Áp dụng voucher ${res.data.code} giảm ${res.data.discount}% thành công` +
            (res.data.minOrderAmount
              ? ` (đơn từ ${res.data.minOrderAmount.toLocaleString('vi-VN')}đ)`
              : '')
        );
      }
    } catch (error) {
      console.error('Voucher apply error:', error.response?.data || error.message);
      const msg = error.response?.data?.message || 'Voucher không hợp lệ';
      setVoucherMessage(msg);
      setAppliedVoucher(null);
    } finally {
      setApplyingVoucher(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!user || !token) {
      alert('Vui lòng đăng nhập để đặt dịch vụ');
      navigate('/login');
      return;
    }
    
    if (!selectedGame || !selectedService || !formData.username || !formData.password) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (selectedGame.serviceCategories && !selectedCategory) {
      alert('Vui lòng chọn loại dịch vụ');
      return;
    }

    try {
      const orderData = {
        orderType: 'service',
        serviceName: selectedService.name,
        gameName: selectedGame.name,
        serviceCategory: selectedCategory || null,
        totalAmount: selectedService.price,
        voucherCode: voucherCode.trim() || undefined,
        status: 'Đang xử lí',
        robloxUsername: formData.username,
        robloxPassword: formData.password,
        notes: formData.notes || '',
        backupCode: formData.backupCode || ''
      };

      const response = await api.post('/api/orders', orderData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Refresh user balance
      try {
        const userRes = await api.get('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const updatedUser = { ...user, balance: userRes.data.balance };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        // Dispatch event to update App state
        window.dispatchEvent(new Event('userBalanceUpdated'));
      } catch (err) {
        console.error('Error refreshing balance:', err);
      }

      // Show success message with discount info if applicable
      const order = response.data;
      let successMsg = `Đặt dịch vụ ${selectedService.name} cho game ${selectedGame.name} thành công!\n`;
      successMsg += `Giá gốc: ${order.originalAmount.toLocaleString('vi-VN')}đ\n`;
      if (order.discountAmount > 0) {
        successMsg += `Tổng giảm: -${order.discountAmount.toLocaleString('vi-VN')}đ\n`;
        if (order.discount) {
          successMsg += `- Giảm tài khoản ${order.discount}%\n`;
        }
        if (order.voucherCode && order.voucherDiscount) {
          successMsg += `- Voucher ${order.voucherCode}: ${order.voucherDiscount}%\n`;
        }
      }
      successMsg += `Giá sau giảm: ${order.totalAmount.toLocaleString('vi-VN')}đ`;
      alert(successMsg);
      
      // Reset form
      setSelectedGame(null);
      setSelectedCategory(null);
      setSelectedService(null);
      setFormData({ category: '', service: '', username: '', password: '', backupCode: '', notes: '' });
      setVoucherCode('');
      setAppliedVoucher(null);
      setVoucherMessage('');
      
      // Navigate to history
      navigate('/history');
    } catch (error) {
      console.error('Error creating order:', error);
      const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra khi đặt dịch vụ. Vui lòng thử lại.';
      alert(errorMsg);
    }
  };

  return (
    <div className="cay-thue-container">
      <div className="cay-thue-header">
        <h1> CÀY THUÊ</h1>
        <p>Thuê chúng tôi cày nếu bạn không có thời gian chăm sóc acc.</p>
      </div>

      {!selectedGame ? (
        <div className="games-list">
          {loadingPricing ? (
            <div style={{ padding: '2rem', color: '#999', textAlign: 'center' }}>Đang tải bảng giá...</div>
          ) : games.length === 0 ? (
            <div style={{ padding: '2rem', color: '#999', textAlign: 'center' }}>
              Chưa có bảng giá. Vui lòng vào Admin → Quản Lý Bảng Giá để cập nhật.
            </div>
          ) : (
            games.map((game) => (
              <div key={game.id} className="game-card" onClick={() => handleGameClick(game)}>
                {game.badge && <div className="game-badge">{game.badge}</div>}
                <div className="game-image" style={{ backgroundImage: `url(${game.image})` }}></div>
                <h3>{game.name}</h3>
                <p>{game.description}</p>
                <button className="btn-rent">THUÊ NGAY</button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="cay-thue-detail">
          <button className="btn-back" onClick={() => setSelectedGame(null)}>← Quay lại</button>
          
          <h2>🔗 {selectedGame.name}</h2>
          
          <div className="detail-content">
            {selectedGame.serviceCategories ? (
              <div className="services-selection">
                <h3>Dịch vụ</h3>
                {selectedCategory && selectedGame.serviceCategories[selectedCategory] ? (
                  <div className="services-display">
                    <div className="service-category-content">
                      {selectedGame.serviceCategories[selectedCategory].services.map((service, idx) => (
                        <div key={idx} className="service-line">
                          {idx + 1}. {service.name}: {(service.price / 1000).toFixed(0)}K
                        </div>
                      ))}
                      {selectedGame.serviceCategories[selectedCategory].note && (
                        <div className="service-note">
                          Note: {selectedGame.serviceCategories[selectedCategory].note}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="services-display">
                    <p>Vui lòng chọn loại dịch vụ</p>
                  </div>
                )}
              </div>
            ) : (
            <div className="services-selection">
              <h3>Best Seller</h3>
              <div className="services-list">
                {selectedGame.services.map((service, idx) => (
                  <div
                    key={idx}
                    className={`service-option ${selectedService?.name === service.name ? 'active' : ''}`}
                    onClick={() => handleServiceClick(service)}
                  >
                    <span className="service-name">{service.name}</span>
                    <span className="service-price">{service.price.toLocaleString('vi-VN')}đ</span>
                  </div>
                ))}
              </div>
            </div>
            )}

            <form onSubmit={handleSubmit} className="cay-thue-form" noValidate>
              <div className="form-row">
                {selectedGame.serviceCategories && (
                  <div className="form-group">
                    <label>Loại (*)</label>
                    <select name="category" value={formData.category} onChange={handleInputChange} required>
                      <option value="">Chọn loại</option>
                      {Object.keys(selectedGame.serviceCategories).map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="form-group">
                  <label>Dịch vụ (*)</label>
                  <select 
                    name="service" 
                    value={formData.service} 
                    onChange={handleInputChange} 
                    required
                    disabled={selectedGame.serviceCategories && !selectedCategory}
                  >
                    <option value="">Chọn dịch vụ</option>
                    {selectedGame.serviceCategories && selectedCategory ? (
                      selectedGame.serviceCategories[selectedCategory]?.services.map((service, idx) => (
                        <option key={idx} value={service.name}>
                          {service.name}
                        </option>
                      ))
                    ) : selectedGame.services ? (
                      selectedGame.services.map((service, idx) => (
                      <option key={idx} value={service.name}>
                        {service.name}
                      </option>
                      ))
                    ) : null}
                  </select>
                </div>

                <div className="form-group">
                  <label>Voucher</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      name="voucherCode"
                      id="voucher-input"
                      value={voucherCode}
                      onChange={(e) => {
                        const value = e.target.value;
                        console.log('Voucher input onChange:', value);
                        setVoucherCode(value);
                        // Force update style to ensure text is visible
                        e.target.style.color = '#333';
                        e.target.style.webkitTextFillColor = '#333';
                      }}
                      onKeyPress={(e) => {
                        console.log('Voucher input onKeyPress:', e.key);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && selectedService && voucherCode.trim()) {
                          e.preventDefault();
                          e.stopPropagation();
                          handleApplyVoucher();
                        }
                      }}
                      onFocus={(e) => {
                        console.log('Voucher input focused');
                        e.target.style.borderColor = '#2196F3';
                        e.target.style.color = '#333';
                        e.target.style.webkitTextFillColor = '#333';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#ddd';
                      }}
                      placeholder="Nhập mã voucher nếu có"
                      style={{ 
                        flex: 1,
                        padding: '0.8rem',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        fontFamily: 'inherit',
                        backgroundColor: '#fff',
                        color: '#333',
                        pointerEvents: 'auto',
                        zIndex: 10,
                        position: 'relative',
                        cursor: 'text',
                        WebkitTextFillColor: '#333',
                        opacity: '1',
                        visibility: 'visible',
                        outline: 'none',
                        boxShadow: 'none',
                        transition: 'border-color 0.3s ease'
                      }}
                      autoComplete="off"
                      readOnly={false}
                      disabled={false}
                    />
                    <button
                      type="button"
                      className="btn-submit"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleApplyVoucher();
                      }}
                      disabled={applyingVoucher || !selectedService}
                      style={{ 
                        whiteSpace: 'nowrap',
                        padding: '0.8rem 1.5rem',
                        marginTop: 0,
                        backgroundColor: '#2196F3',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: applyingVoucher || !selectedService ? 'not-allowed' : 'pointer',
                        opacity: applyingVoucher || !selectedService ? 0.6 : 1
                      }}
                    >
                      {applyingVoucher ? 'Đang kiểm tra...' : 'Áp dụng'}
                    </button>
                  </div>
                  {voucherMessage && (
                    <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: appliedVoucher ? '#4CAF50' : '#f44336' }}>
                      {voucherMessage}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Thành tiền</label>
                  <input
                    type="text"
                    value={selectedService ? (() => {
                      const originalPrice = selectedService.price;
                      const accountDiscount = user?.discount || 0;
                      let priceAfterAccount = originalPrice;
                      let parts = [];

                      if (accountDiscount > 0 && accountDiscount <= 100) {
                        const accAmount = Math.round((originalPrice * accountDiscount) / 100);
                        priceAfterAccount -= accAmount;
                        parts.push(`Giảm tài khoản ${accountDiscount}%: -${accAmount.toLocaleString('vi-VN')}đ`);
                      }

                      let finalPrice = priceAfterAccount;
                      if (appliedVoucher && appliedVoucher.discount > 0) {
                        const vAmount = Math.round((priceAfterAccount * appliedVoucher.discount) / 100);
                        finalPrice -= vAmount;
                        parts.push(`Voucher ${appliedVoucher.code} ${appliedVoucher.discount}%: -${vAmount.toLocaleString('vi-VN')}đ`);
                      }

                      if (parts.length > 0) {
                        return `${originalPrice.toLocaleString('vi-VN')}đ → ${finalPrice.toLocaleString('vi-VN')}đ (${parts.join(' ; ')})`;
                      }

                      return `${originalPrice.toLocaleString('vi-VN')}đ`;
                    })() : '0đ'}
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label>Lưu ý:</label>
                  <input 
                    type="text" 
                    value={selectedCategory && selectedGame.serviceCategories?.[selectedCategory]?.note ? selectedGame.serviceCategories[selectedCategory].note : ''} 
                    disabled 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label>Tên đăng nhập roblox (*)</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Nhập tên tài khoản Roblox"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label>Mật khẩu đăng nhập roblox (*)</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Nhập mật khẩu"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label>Backup Code</label>
                  <input
                    type="text"
                    name="backupCode"
                    value={formData.backupCode || ''}
                    onChange={handleInputChange}
                    placeholder="Nhập backup code"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label>Ghi chú đơn hàng nếu có</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Ghi chú thêm nếu có"
                    rows="5"
                  ></textarea>
                </div>
              </div>

              <button type="submit" className="btn-submit">Xác Nhận</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CayThue;
