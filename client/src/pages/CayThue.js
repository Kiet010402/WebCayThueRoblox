import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './CayThue.css';

function CayThue() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [games, setGames] = useState([]);
  const [loadingPricing, setLoadingPricing] = useState(true);
  
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
  };

  const handleServiceClick = (service) => {
    setSelectedService(service);
    setFormData({ ...formData, service: service.name });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Khi chọn loại từ dropdown
    if (name === 'category' && selectedGame) {
      setSelectedCategory(value);
      setSelectedService(null);
      setFormData({ ...formData, category: value, service: '' });
      return;
    }
    
    // Cập nhật formData cho các field khác
    setFormData({ ...formData, [name]: value });
    
    // Khi chọn dịch vụ từ dropdown, cập nhật selectedService
    if (name === 'service' && selectedGame) {
      if (selectedCategory && selectedGame.serviceCategories) {
        const category = selectedGame.serviceCategories[selectedCategory];
        if (category) {
          const service = category.services.find(s => s.name === value);
          setSelectedService(service || null);
        }
      } else if (selectedGame.services) {
        // Fallback cho các game không có serviceCategories
        const service = selectedGame.services.find(s => s.name === value);
        setSelectedService(service || null);
      }
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
      if (order.discountAmount > 0) {
        successMsg += `Giá gốc: ${order.originalAmount.toLocaleString('vi-VN')}đ\n`;
        successMsg += `Giảm ${order.discount}%: -${order.discountAmount.toLocaleString('vi-VN')}đ\n`;
        successMsg += `Giá sau giảm: ${order.totalAmount.toLocaleString('vi-VN')}đ`;
      } else {
        successMsg += `Giá: ${order.totalAmount.toLocaleString('vi-VN')}đ`;
      }
      alert(successMsg);
      
      // Reset form
    setSelectedGame(null);
      setSelectedCategory(null);
    setSelectedService(null);
      setFormData({ category: '', service: '', username: '', password: '', backupCode: '', notes: '' });
      
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

            <form onSubmit={handleSubmit} className="cay-thue-form">
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
                  <label>Thành tiền</label>
                  <input 
                    type="text" 
                    value={selectedService ? (() => {
                      const originalPrice = selectedService.price;
                      const discount = user?.discount || 0;
                      if (discount > 0 && discount <= 100) {
                        const discountAmount = Math.round((originalPrice * discount) / 100);
                        const finalPrice = originalPrice - discountAmount;
                        return `${originalPrice.toLocaleString('vi-VN')}đ → ${finalPrice.toLocaleString('vi-VN')}đ (Giảm ${discount}%)`;
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
