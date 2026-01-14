import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './CayThue.css';

function CayThue() {
  const navigate = useNavigate();
  const [games] = useState([
    {
      id: 1,
      name: 'Anime Vanguards',
      image: 'https://i.ytimg.com/vi/yXZpEH82wvk/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLByxdkM2U4bW0HepWz6pbGOgpA6hQ',
      description: 'Game thủ thành anime với nhiều chế độ chơi hấp dẫn',
      badge: 'Thuê nhiều',
      serviceCategories: {
        'Cày Gem | Cày Story': {
          services: [
            { name: 'Treo map (không yêu cầu đội hình) 12k GEM', price: 10000 },
            { name: 'Treo Infi (Yêu cầu đội hình Trung) 15k GEM', price: 10000 },
            { name: 'Story 1 map', price: 6000 },
            { name: 'Worldlines', price: 70000 },
            { name: '100 Reroll', price: 60000 }
          ],
          note: null
        },
        'Cày Secret | Evo Unit': {
          services: [
            { name: 'Sec Saber', price: 60000 },
            { name: 'Igris', price: 40000 },
            { name: 'Yakamoto', price: 60000 },
            { name: 'Luffy G4', price: 80000 },
            { name: 'Sec Boo Portal', price: 60000 },
            { name: 'Sec Cid', price: 60000 },
            { name: 'Sec Lfelt', price: 60000 },
            { name: 'Secret Eren', price: 60000 },
            { name: 'Secret Dio + 400rr (act7)', price: 80000 },
            { name: 'Broly (Vegita Evol)', price: 120000 },
            { name: 'Broly (Vegita Unevol)', price: 170000 },
            { name: 'Secret SJW - Lấy Key Lẻ', price: 30000 },
            { name: 'Secret SJW - Quest 1: Kill Antking 50 times (Bao luôn Key)', price: 60000 },
            { name: 'Secret SJW - Quest 2: Sacrifice 30 mythic', price: 50000 },
            { name: 'Secret SJW - Quest 3: Summon 5000 Summons with SJW', price: 30000 },
            { name: 'Secret SJW - Quest 4: Sacrifice evolvel Igris', price: 50000 }
          ],
          note: 'Secret SJW (Yêu cầu đội hình): Cày Theo Quest - Lưu Ý Clear Quest theo thứ tự'
        },
        'Cày BossEvent': {
          services: [
            { name: 'Sukuna 100token', price: 40000 },
            { name: 'Boss Ev 24h', price: 30000 },
            { name: 'Raid Cid 24h', price: 30000 }
          ],
          note: null
        },
        'Cày Event | Sec Event': {
          services: [
            { name: 'Ev Anniversary 24h', price: 25000 },
            { name: 'Overlord', price: 80000 }
          ],
          note: null
        },
        'COMBO Tiết Kiệm': {
      services: [
            { name: 'Evo combo 2 unit', price: 50000 },
            { name: 'Combo Igris + EVO', price: 60000 },
            { name: 'Combo yakamoto + evol', price: 80000 },
            { name: 'Combo Leekspin + evo', price: 80000 },
            { name: 'Combo Roku (Angel)+Vogita (Angel)', price: 50000 },
            { name: 'Combo Sec Buu + Evo', price: 80000 },
            { name: 'Combo Sec Cid + Evo', price: 80000 },
            { name: 'Full combo lấy Secret SJW có Igis', price: 120000 },
            { name: 'Full combo lấy Secret SJW không có Igris', price: 170000 }
          ],
          note: null
        }
      }
    },
    {
      id: 2,
      name: 'Anime Crusader',
      image: 'https://frvr.com/wp-content/uploads/2025/09/roblox-anime-crusaders-codes.jpg',
      description: 'Game thủ thành anime với nhiều chế độ chơi hấp dẫn',
      badge: 'Thuê nhiều',
      serviceCategories: {
        'Cày Event': {
          services: [
            { name: '1Day NewYear Event', price: 17000 },
            { name: '500K Gingerbread', price: 10000 }
          ],
          note: 'Đội hình tầm trung'
        },
        'EVO': {
          services: [
            { name: '30 Stone EVO', price: 10000 }
          ],
          note: 'Đội hình tầm trung'
        },
        'Cày Secret | Portal': {
          services: [
            { name: 'Secret Dragon(Kaido)', price: 50000 },
            { name: 'Secret Sinbad', price: 150000 },
            { name: 'Secret Dio', price: 150000 },
            { name: 'Secret Esdeath (IceQueen)', price: 80000 },
            { name: 'Secret Gilgamesh', price: 55000 }
          ],
          note: 'Đội hình tầm trung hoặc solo được'
        },
        'Combo': {
      services: [
            { name: '3Day NewYear Event', price: 50000 },
            { name: '5Day NewYear Event', price: 80000 },
            { name: '2m5 Gingerbread', price: 50000 }
          ],
          note: null
        }
      }
    },
    {
      id: 3,
      name: 'Universal Tower Defense',
      image: 'https://tr.rbxcdn.com/180DAY-c61bbfa00bbd9750eac5f5f482ebba3c/768/432/Image/Webp/noFilter',
      description: 'Game thủ thành anime với nhiều chế độ chơi hấp dẫn',
      badge: 'Thuê nhiều',
      serviceCategories: {
        'Cày Gem': {
          services: [
            { name: '15K Gem', price: 10000 }
          ],
          note: null
        },
        'Cày Secret': {
          services: [
            { name: 'Secret Lulu', price: 80000 },
            { name: 'Secret Ragna', price: 50000 }
          ],
          note: 'Ragna Yêu cầu solo được'
        },
        'Event': {
          services: [
            { name: '100KIceGifts', price: 10000 }
          ],
          note: 'Yêu cầu solo được'
        },
        'Raid': {
          services: [
            { name: '1Day Raid', price: 17000 }
          ],
          note: null
        },
        'Evo': {
          services: [
            { name: 'Evo Unit', price: 25000 }
          ],
          note: null
        },
        'Combo': {
      services: [
        { name: '80K Gem', price: 50000 },
        { name: '200K Gem', price: 100000 },
            { name: '525K IceGifts', price: 50000 },
            { name: '5Day Raid', price: 80000 }
          ],
          note: null
        }
      }
    },
    {
      id: 4,
      name: 'The Forge',
      image: 'https://tr.rbxcdn.com/180DAY-3eacda24071591b5157449a853e8b24c/768/432/Image/Webp/noFilter',
      description: 'Game hot hiện tại với đồ họa đẹp mắt và gameplay sáng tạo',
      badge: 'Thuê nhiều',
      serviceCategories: {
        'Cash': {
          services: [
            { name: '500k Cash', price: 10000 },
            { name: '2m6 Cash', price: 50000 },
            { name: '5m4 Cash', price: 100000 }
          ],
          note: null
        },
        'Level': {
          services: [
            { name: '1 - 50', price: 25000 },
            { name: '50 - 100', price: 40000 },
            { name: '100 - 150', price: 50000 },
            { name: '150 - 200', price: 60000 }
          ],
          note: null
        },
        'Pickaxes': {
          services: [
            { name: 'Arcane Pickaxe', price: 30000 },
            { name: 'Demonic Pickaxe', price: 40000 },
            { name: 'Void Pickaxe', price: 60000 },
            { name: 'Prismatic Pickaxe', price: 100000 },
            { name: 'Dragon Pickaxe', price: 150000 },
            { name: 'Candy Cane Pickaxe', price: 50000 },
            { name: 'Christmas Pickaxe', price: 250000 },
            { name: '1d farm ores', price: 25000 }
          ],
          note: null
        },
        'Armor': {
          services: [
            { name: 'Full Demonite', price: 80000 },
            { name: 'Full darknite', price: 140000 }
          ],
          note: null
        },
        'Weapons': {
      services: [
            { name: 'Chaos demonite', price: 30000 },
            { name: 'Chaos darknite', price: 50000 }
          ],
          note: null
        }
      }
    }
  ]);

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

      await api.post('/api/orders', orderData, {
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

    alert(`Đặt dịch vụ ${selectedService.name} cho game ${selectedGame.name} thành công!\nGiá: ${selectedService.price.toLocaleString('vi-VN')}đ`);
      
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
          {games.map((game) => (
            <div key={game.id} className="game-card" onClick={() => handleGameClick(game)}>
              {game.badge && <div className="game-badge">{game.badge}</div>}
              <div className="game-image" style={{ backgroundImage: `url(${game.image})` }}></div>
              <h3>{game.name}</h3>
              <p>{game.description}</p>
              <button className="btn-rent">THUÊ NGAY</button>
            </div>
          ))}
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
                  <input type="text" value={selectedService ? `${selectedService.price.toLocaleString('vi-VN')}đ` : '0đ'} disabled />
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
