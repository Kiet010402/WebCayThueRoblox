import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Banner from '../components/Banner';
import TopRanking from '../components/TopRanking';
import api from '../api/axios';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState({ title: '', content: '' });
  const [loadingAnnouncement, setLoadingAnnouncement] = useState(true);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [games, setGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [blindBags, setBlindBags] = useState([]);
  const [loadingBlindBags, setLoadingBlindBags] = useState(true);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchasedAccount, setPurchasedAccount] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Fetch user info from API (using session cookie)
    api.get('/api/users/me')
      .then(response => {
        setUser(response.data);
      })
      .catch(err => {
        console.error('Error fetching user:', err);
        setUser(null);
      });
  }, []);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      const res = await api.get('/api/announcement');
      setAnnouncement({
        title: res.data?.title || 'Thông Báo | Trang Chủ',
        content: res.data?.content || ''
      });
    };

    // Kiểm tra xem user có tắt popup trong 2 giờ trước đó không
    const hiddenUntil = parseInt(localStorage.getItem('announcementHideUntil') || '0', 10);
    if (Date.now() < hiddenUntil) {
      setShowAnnouncementModal(false);
    } else {
      setShowAnnouncementModal(true);
    }

    setLoadingAnnouncement(true);
    fetchAnnouncement()
      .catch((err) => {
        console.error('Error fetching announcement:', err);
        setAnnouncement({ title: 'Thông Báo | Trang Chủ', content: '' });
      })
      .finally(() => setLoadingAnnouncement(false));
    
    // Fetch games for display
    const fetchGames = async () => {
      try {
        const res = await api.get('/api/accounts/games-stats');
        setGames(res.data.games || []);
      } catch (error) {
        console.error('Error fetching games:', error);
        setGames([]);
      } finally {
        setLoadingGames(false);
      }
    };

    // Fetch blind bags for display
    const fetchBlindBags = async () => {
      try {
        const res = await api.get('/api/blindbags');
        const loadedBlindBags = res.data || [];
        const blindBagsWithStats = await Promise.all(
          loadedBlindBags.map(async (bag) => {
            try {
              const statsRes = await api.get(`/api/blindbags/${bag._id}/stats`);
              return {
                ...bag,
                available: statsRes.data.availableAccounts || 0,
                sold: statsRes.data.soldAccounts || 0
              };
            } catch (error) {
              return {
                ...bag,
                available: 0,
                sold: 0
              };
            }
          })
        );
        setBlindBags(blindBagsWithStats);
      } catch (error) {
        console.error('Error fetching blind bags:', error);
        setBlindBags([]);
      } finally {
        setLoadingBlindBags(false);
      }
    };
    
    // Fetch recent activities for ticker
    const fetchRecentActivities = async () => {
      try {
        const res = await api.get('/api/activities/recent?limit=20');
        setRecentActivities(res.data.activities || []);
      } catch (error) {
        console.error('Error fetching recent activities:', error);
        setRecentActivities([]);
      }
    };
    
    fetchGames();
    fetchBlindBags();
    fetchRecentActivities();
    
    // Refresh activities every 30 seconds
    const activitiesInterval = setInterval(fetchRecentActivities, 30000);
    
    return () => {
      clearInterval(activitiesInterval);
    };
  }, []);

  const handleCloseModal = () => {
    setShowAnnouncementModal(false);
  };

  const handleHideFor2Hours = () => {
    const twoHours = 2 * 60 * 60 * 1000;
    const until = Date.now() + twoHours;
    localStorage.setItem('announcementHideUntil', String(until));
    setShowAnnouncementModal(false);
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${type} đã được sao chép!`);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert(`${type} đã được sao chép!`);
      } catch (err) {
        alert('Không thể sao chép. Vui lòng sao chép thủ công.');
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="home">
      {/* Activity Ticker */}
      {recentActivities.length > 0 && (
        <div className="activity-ticker-container">
          <div className="activity-ticker-label">🎉</div>
          <div className="activity-ticker-wrapper">
            <div className="activity-ticker-content">
              {[...recentActivities, ...recentActivities].map((activity, index) => (
                <span key={`${activity.createdAt}-${index}`} className="activity-item">
                  {activity.message} • 
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div className="notices-section announcement-top">
        <h2 className="section-title">{announcement.title || '⚠️ THÔNG BÁO'}</h2>
        <div className="notice-card">
          {loadingAnnouncement ? (
            <div style={{ color: '#666' }}>Đang tải thông báo...</div>
          ) : announcement.content ? (
            <div
              className="announcement-html"
              dangerouslySetInnerHTML={{ __html: announcement.content }}
            />
          ) : (
            <div style={{ color: '#666' }}>Chưa có thông báo</div>
          )}
        </div>
      </div>

      <Banner />
      <TopRanking />

      {/* Túi Mù Section */}
      <div className="games-section">
        <h2 className="section-title">🎁 Túi Mù | Trang Chủ</h2>
        {loadingBlindBags ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Đang tải túi mù...</div>
        ) : blindBags.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Chưa có túi mù nào</div>
        ) : (
          <div className="games-grid-home">
            {blindBags.map((blindBag) => (
              <div 
                key={blindBag._id} 
                className="game-card-home"
              >
                <div className="game-image-home" style={{ backgroundImage: `url(${blindBag.image || 'https://via.placeholder.com/300'})` }}></div>
                <div className="game-info-home">
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>{blindBag.game}</h3>
                  {blindBag.info && (
                    <p style={{ 
                      fontSize: '1.1rem', 
                      fontWeight: 'bold', 
                      color: '#333',
                      margin: '0.5rem 0',
                      minHeight: '3rem'
                    }}>
                      {blindBag.info}
                    </p>
                  )}
                  <div className="game-stats-home">
                    <div className="stat-item-home">
                      <span className="stat-label-home">Còn:</span>
                      <span className="stat-value-home available">{blindBag.available || 0}</span>
                    </div>
                    <div className="stat-item-home">
                      <span className="stat-label-home">Đã bán:</span>
                      <span className="stat-value-home sold">{blindBag.sold || 0}</span>
                    </div>
                  </div>
                  <div style={{ margin: '0.75rem 0', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {blindBag.originalPrice > blindBag.discountedPrice && (
                      <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.9rem' }}>
                        {blindBag.originalPrice?.toLocaleString('vi-VN')}₫
                      </span>
                    )}
                    <span style={{ color: '#f44336', fontSize: '1.2rem', fontWeight: 'bold' }}>
                      {blindBag.discountedPrice?.toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                  <button 
                    className="btn-view-games"
                    disabled={blindBag.available === 0}
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (blindBag.available === 0) {
                        return;
                      }
                      
                      // Check if user is logged in
                      if (!user) {
                        alert('Vui lòng đăng nhập để mua túi mù');
                        navigate('/login');
                        return;
                      }
                      
                      const finalPrice = blindBag.discountedPrice;
                      if (user.balance < finalPrice) {
                        alert('Số dư không đủ! Vui lòng nạp thêm tiền.');
                        navigate('/recharge');
                        return;
                      }
                      
                      if (!window.confirm(`Bạn có chắc muốn mua túi mù "${blindBag.game}" với giá ${finalPrice.toLocaleString('vi-VN')}đ?`)) {
                        return;
                      }
                      
                      try {
                        const res = await api.post(`/api/blindbags/${blindBag._id}/purchase`, {});
                        
                        // Set purchased account info for modal
                        setPurchasedAccount({
                          username: res.data.account.username,
                          password: res.data.account.password,
                          code: res.data.account.code,
                          game: res.data.account.game
                        });
                        setShowPurchaseModal(true);
                        
                        // Update user balance (don't store in localStorage)
                        window.dispatchEvent(new Event('userBalanceUpdated'));
                        
                        // Refresh blind bags list
                        const blindBagsRes = await api.get('/api/blindbags');
                        const loadedBlindBags = blindBagsRes.data || [];
                        const blindBagsWithStats = await Promise.all(
                          loadedBlindBags.map(async (bag) => {
                            try {
                              const statsRes = await api.get(`/api/blindbags/${bag._id}/stats`);
                              return {
                                ...bag,
                                available: statsRes.data.availableAccounts || 0,
                                sold: statsRes.data.soldAccounts || 0
                              };
                            } catch (error) {
                              return {
                                ...bag,
                                available: 0,
                                sold: 0
                              };
                            }
                          })
                        );
                        setBlindBags(blindBagsWithStats);
                      } catch (error) {
                        alert(error.response?.data?.message || 'Có lỗi xảy ra khi mua túi mù');
                      }
                    }}
                  >
                    {blindBag.available === 0 ? 'Hết hàng' : 'Mua ngay'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Acc Roblox Section */}
      <div className="games-section">
        <h2 className="section-title">🎮 Acc Roblox | Trang Chủ</h2>
        {loadingGames ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Đang tải games...</div>
        ) : games.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>Chưa có game nào</div>
        ) : (
          <div className="games-grid-home">
            {games.map((game, index) => (
              <div 
                key={index} 
                className="game-card-home"
              >
                <div className="game-image-home" style={{ backgroundImage: `url(${game.image})` }}></div>
                <div className="game-info-home">
                  <h3>{game.name}</h3>
                  <div className="game-stats-home">
                    <div className="stat-item-home">
                      <span className="stat-label-home">Còn:</span>
                      <span className="stat-value-home available">{game.available || 0}</span>
                    </div>
                    <div className="stat-item-home">
                      <span className="stat-label-home">Đã bán:</span>
                      <span className="stat-value-home sold">{game.sold || 0}</span>
                    </div>
                  </div>
                  <button 
                    className="btn-view-games"
                    onClick={async (e) => {
                      e.stopPropagation();
                      // Navigate với game state để NickRoblox có thể load ngay
                      navigate(`/nick-roblox`, { 
                        state: { selectedGameName: game.name }
                      });
                    }}
                  >
                    Xem ngay
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="info-section">
        <div className="info-grid">
          <div className="info-card">
            <h3>🎁 ĐẶC BIỆT</h3>
            <p>✅ Hỗ Trợ 24/7</p>
            <p>✅ Hoàn Tiền 100% Nếu Lỗi</p>
          </div>

          <div className="info-card">
            <h3>🔒 AN TOÀN VÀ BẢO MẬT</h3>
            <p>✅ Mã Hóa SSL Toàn Bộ</p>
            <p>✅ Không Lưu Trữ Thông Tin</p>
          </div>
        </div>
      </div>

      {showAnnouncementModal && (
        <div className="announcement-modal-overlay" onClick={handleCloseModal}>
          <div className="announcement-modal" onClick={(e) => e.stopPropagation()}>
            <div className="announcement-modal-header">
              <span>🔔 Thông báo</span>
              <button className="announcement-modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <div className="announcement-modal-body">
              {loadingAnnouncement ? (
                <div style={{ color: '#666' }}>Đang tải thông báo...</div>
              ) : (
                <div
                  className="announcement-html"
                  dangerouslySetInnerHTML={{ __html: announcement.content || '' }}
                />
              )}
            </div>
            <div className="announcement-modal-footer">
              <button className="announcement-hide-btn" onClick={handleHideFor2Hours}>
                Không hiển thị lại trong 2 giờ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Success Modal */}
      {showPurchaseModal && purchasedAccount && (
        <div className="modal-overlay" onClick={() => setShowPurchaseModal(false)}>
          <div className="modal-content purchase-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🎉 Mua thành công!</h2>
              <button className="modal-close" onClick={() => setShowPurchaseModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="purchase-success">
                <p className="thank-you-message">Cảm ơn bạn đã mua hàng!</p>
                <div className="account-credentials">
                  <div className="credential-item">
                    <label>Tài khoản:</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="credential-value" style={{ flex: 1 }}>{purchasedAccount.username}</div>
                      <button 
                        onClick={() => copyToClipboard(purchasedAccount.username, 'Tài khoản')}
                        style={{ 
                          padding: '0.5rem 1rem', 
                          background: '#4CAF50', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '4px', 
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          fontSize: '0.85rem'
                        }}
                      >
                        📋 Copy
                      </button>
                    </div>
                  </div>
                  <div className="credential-item">
                    <label>Mật khẩu:</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="credential-value" style={{ flex: 1 }}>{purchasedAccount.password}</div>
                      <button 
                        onClick={() => copyToClipboard(purchasedAccount.password, 'Mật khẩu')}
                        style={{ 
                          padding: '0.5rem 1rem', 
                          background: '#4CAF50', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '4px', 
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          fontSize: '0.85rem'
                        }}
                      >
                        📋 Copy
                      </button>
                    </div>
                  </div>
                  <div className="credential-item">
                    <label>Mã số:</label>
                    <div className="credential-value">{purchasedAccount.code}</div>
                  </div>
                  <div className="credential-item">
                    <label>Game:</label>
                    <div className="credential-value">{purchasedAccount.game}</div>
                  </div>
                </div>
                <p className="warning-message">
                  ⚠️ Vui lòng lưu lại thông tin này. Bạn có thể xem lại trong phần "Lịch sử mua acc" của tài khoản.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-close-modal" onClick={() => setShowPurchaseModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
