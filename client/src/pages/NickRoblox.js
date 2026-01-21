import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import './NickRoblox.css';

function NickRoblox() {
  const navigate = useNavigate();
  const location = useLocation();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [user, setUser] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchasedAccount, setPurchasedAccount] = useState(null);
  // Blind bag states
  const [blindBags, setBlindBags] = useState([]);
  const [blindBagsLoading] = useState(false);

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
    const loadGamesAndSelect = async () => {
      // Check for game name from location state (from Home page) or URL parameter
      const gameNameFromState = location.state?.selectedGameName;
      const urlParams = new URLSearchParams(window.location.search);
      const gameNameFromUrl = urlParams.get('game');
      const gameName = gameNameFromState || gameNameFromUrl;
      
      // Fetch games first
      try {
        const [gamesRes, blindBagsRes] = await Promise.all([
          api.get('/api/accounts/games-stats'),
          api.get('/api/blindbags')
        ]);
        
        const loadedGames = gamesRes.data.games || [];
        setGames(loadedGames);
        
        // Load blind bags with stats
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
        
        // If there's a game name, automatically select it and load accounts
        if (gameName && loadedGames.length > 0) {
          const game = loadedGames.find(g => g.name === decodeURIComponent(gameName));
          if (game) {
            setSelectedGame(game);
            setCurrentPage(1);
            // Load accounts immediately (same logic as handleGameClick)
            const accountsRes = await api.get(`/api/accounts/by-game/${encodeURIComponent(game.name)}?page=1&limit=12`);
            setAccounts(accountsRes.data.accounts || []);
            setTotalPages(accountsRes.data.totalPages || 1);
            // Clear URL parameter if exists
            if (gameNameFromUrl) {
              window.history.replaceState({}, '', window.location.pathname);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching games:', error);
        setGames([]);
        setBlindBags([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadGamesAndSelect();
  }, [location.state]);

  const handleGameClick = async (game) => {
    setSelectedGame(game);
    setCurrentPage(1);
    await fetchAccounts(game.name, 1);
  };

  const fetchAccounts = async (gameName, page = 1) => {
    setAccountsLoading(true);
    try {
      const res = await api.get(`/api/accounts/by-game/${encodeURIComponent(gameName)}?page=${page}&limit=12`);
      setAccounts(res.data.accounts || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setAccounts([]);
    } finally {
      setAccountsLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchAccounts(selectedGame.name, newPage);
  };

  const handleBuyAccount = async (account) => {
    // Check if user is logged in
    if (!user) {
      alert('Vui lòng đăng nhập để mua account');
      navigate('/login');
      return;
    }

    const finalPrice = account.discountedPrice;
    if (user.balance < finalPrice) {
      alert('Số dư không đủ! Vui lòng nạp thêm tiền.');
      navigate('/recharge');
      return;
    }

    if (!window.confirm(`Bạn có chắc muốn mua account "${account.code}" với giá ${finalPrice.toLocaleString('vi-VN')}đ?`)) {
      return;
    }

    try {
      const res = await api.post(`/api/accounts/${account._id}/purchase`, {});
      
      setPurchasedAccount({
        username: res.data.account.username,
        password: res.data.account.password,
        code: res.data.account.code,
        game: res.data.account.game
      });
      setShowPurchaseModal(true);
      
      // Update user balance (don't store in localStorage)
      setUser({ ...user, balance: res.data.newBalance });
      window.dispatchEvent(new Event('userBalanceUpdated'));
      
      // Refresh accounts list
      await fetchAccounts(selectedGame.name, currentPage);
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi mua account');
    }
  };

  const handleBackToGames = () => {
    setSelectedGame(null);
    setAccounts([]);
    setCurrentPage(1);
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

  const handleBuyBlindBag = async (blindBag) => {
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
      
      setPurchasedAccount({
        username: res.data.account.username,
        password: res.data.account.password,
        code: res.data.account.code,
        game: res.data.account.game
      });
      setShowPurchaseModal(true);
      
      // Update user balance (don't store in localStorage)
      setUser({ ...user, balance: res.data.newBalance });
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
  };

  if (loading) {
    return <div className="nick-roblox-container"><p>Đang tải...</p></div>;
  }

  if (selectedGame) {
    return (
      <div className="nick-roblox-container">
        <div className="back-button-container">
          <button className="btn-back" onClick={handleBackToGames}>
            ← Quay lại
          </button>
        </div>
        <h1 className="page-title">🎮 {selectedGame.name}</h1>
        
        {accountsLoading ? (
          <div className="loading">Đang tải accounts...</div>
        ) : accounts.length === 0 ? (
          <div className="empty-state">Chưa có account nào cho game này</div>
        ) : (
          <>
            <div className="accounts-grid">
              {accounts.map(account => (
                <div key={account._id} className="account-card">
                  <div className="account-image-container">
                    <img 
                      src={account.image || selectedGame.image} 
                      alt={account.code}
                      onError={(e) => {
                        e.target.src = selectedGame.image;
                      }}
                    />
                    <div className="account-code-badge">MS: {account.code}</div>
                  </div>
                  <div className="account-info">
                    <h3 className="account-title">{account.info || account.code}</h3>
                    <div className="account-price">
                      {account.originalPrice > account.discountedPrice && (
                        <span className="original-price">
                          {account.originalPrice.toLocaleString('vi-VN')}₫
                        </span>
                      )}
                      <span className="discounted-price">
                        {account.discountedPrice.toLocaleString('vi-VN')}₫
                      </span>
                    </div>
                    <button 
                      className="btn-buy-now"
                      onClick={() => handleBuyAccount(account)}
                      disabled={account.status === 'đã bán'}
                    >
                      {account.status === 'đã bán' ? 'Đã bán' : 'Mua ngay'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="page-btn"
                >
                  ← Trước
                </button>
                <span className="page-info">
                  Trang {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="page-btn"
                >
                  Sau →
                </button>
              </div>
            )}
          </>
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

  return (
    <div className="nick-roblox-container">
      <div className="nick-roblox-header">
        <h1>🎮 NICK ROBLOX</h1>
      </div>

      {/* Túi Mù Section */}
      <div className="section-container">
        <h2 className="section-title">🎁 Túi Mù | Nick Roblox</h2>
        {blindBagsLoading ? (
          <div className="loading">Đang tải túi mù...</div>
        ) : blindBags.length === 0 ? (
          <div className="empty-state">Chưa có túi mù nào</div>
        ) : (
          <div className="games-grid">
            {blindBags.map((blindBag) => (
              <div key={blindBag._id} className="game-card">
                <div className="game-image" style={{ backgroundImage: `url(${blindBag.image || 'https://via.placeholder.com/300'})` }}></div>
                <div className="game-info">
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{blindBag.game}</h3>
                  {blindBag.info && <p className="game-description" style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333' }}>{blindBag.info}</p>}
                  <div className="game-stats">
                    <div className="stat-item">
                      <span className="stat-label">Còn:</span>
                      <span className="stat-value available">{blindBag.available || 0}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Đã bán:</span>
                      <span className="stat-value sold">{blindBag.sold || 0}</span>
                    </div>
                  </div>
                  <div className="game-price">
                    {blindBag.originalPrice > blindBag.discountedPrice && (
                      <span className="original-price">
                        {blindBag.originalPrice.toLocaleString('vi-VN')}₫
                      </span>
                    )}
                    <span className="discounted-price">
                      {blindBag.discountedPrice.toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                  <button 
                    className="btn-buy-now"
                    onClick={() => handleBuyBlindBag(blindBag)}
                    disabled={blindBag.available === 0}
                  >
                    {blindBag.available === 0 ? 'Hết hàng' : 'Mua ngay'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Acc Section */}
      <div className="section-container">
        <h2 className="section-title">🎮 Acc | Nick Roblox</h2>
        <p className="section-description">Chọn game để xem danh sách accounts có sẵn</p>
        <div className="games-grid">
          {games.map((game, index) => (
            <div key={index} className="game-card" onClick={() => handleGameClick(game)}>
              <div className="game-image" style={{ backgroundImage: `url(${game.image})` }}></div>
              <div className="game-info">
                <h3>{game.name}</h3>
                <div className="game-stats">
                  <div className="stat-item">
                    <span className="stat-label">Còn:</span>
                    <span className="stat-value available">{game.available || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Đã bán:</span>
                    <span className="stat-value sold">{game.sold || 0}</span>
                  </div>
                </div>
                <button className="btn-buy-now">Xem ngay</button>
              </div>
            </div>
          ))}
        </div>
      </div>

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

export default NickRoblox;

