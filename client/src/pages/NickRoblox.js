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

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user') || 'null');
    if (token && userData) {
      setUser(userData);
    }
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
        const res = await api.get('/api/accounts/games-stats');
        const loadedGames = res.data.games || [];
        setGames(loadedGames);
        
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
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Vui lòng đăng nhập để mua account');
      navigate('/login');
      return;
    }

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
      const res = await api.post(`/api/accounts/${account._id}/purchase`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPurchasedAccount({
        username: res.data.account.username,
        password: res.data.account.password,
        code: res.data.account.code,
        game: res.data.account.game
      });
      setShowPurchaseModal(true);
      
      // Update user balance
      const updatedUser = { ...user, balance: res.data.newBalance };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
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
                      <div className="credential-value">{purchasedAccount.username}</div>
                    </div>
                    <div className="credential-item">
                      <label>Mật khẩu:</label>
                      <div className="credential-value">{purchasedAccount.password}</div>
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
        <p>Chọn game để xem danh sách accounts có sẵn</p>
      </div>

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
              <button className="btn-buy-now">Mua ngay</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NickRoblox;

