import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import './PricingManager.css';

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export default function PricingManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [games, setGames] = useState([]);
  const [expandedGameId, setExpandedGameId] = useState(null);
  const [search, setSearch] = useState('');
  const [showAddGame, setShowAddGame] = useState(false);
  const [newGame, setNewGame] = useState({
    name: '',
    image: '',
    description: '',
    badge: ''
  });

  const filteredGames = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return games;
    return games.filter((g) => {
      if ((g.name || '').toLowerCase().includes(q)) return true;
      const cats = g.serviceCategories || {};
      for (const catName of Object.keys(cats)) {
        if (catName.toLowerCase().includes(q)) return true;
        const services = cats[catName]?.services || [];
        if (services.some((s) => (s.name || '').toLowerCase().includes(q))) return true;
      }
      return false;
    });
  }, [games, search]);

  useEffect(() => {
    const fetchPricing = async () => {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/admin/pricing/caythue', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGames(Array.isArray(res.data?.data) ? res.data.data : []);
    };

    setLoading(true);
    fetchPricing()
      .catch((err) => {
        console.error('Error fetching pricing:', err);
        alert(err.response?.data?.message || 'Không thể tải bảng giá');
      })
      .finally(() => setLoading(false));
  }, []);

  const nextGameId = useMemo(() => {
    const ids = games.map((g) => Number(g.id)).filter((n) => Number.isFinite(n));
    return (ids.length ? Math.max(...ids) : 0) + 1;
  }, [games]);

  const updateServicePrice = (gameId, categoryName, serviceIdx, newPrice) => {
    setGames((prev) => {
      const next = deepClone(prev);
      const g = next.find((x) => x.id === gameId);
      if (!g?.serviceCategories?.[categoryName]?.services?.[serviceIdx]) return prev;
      g.serviceCategories[categoryName].services[serviceIdx].price = newPrice;
      return next;
    });
  };

  const updateServiceName = (gameId, categoryName, serviceIdx, newName) => {
    setGames((prev) => {
      const next = deepClone(prev);
      const g = next.find((x) => x.id === gameId);
      if (!g?.serviceCategories?.[categoryName]?.services?.[serviceIdx]) return prev;
      g.serviceCategories[categoryName].services[serviceIdx].name = newName;
      return next;
    });
  };

  const updateCategoryNote = (gameId, categoryName, note) => {
    setGames((prev) => {
      const next = deepClone(prev);
      const g = next.find((x) => x.id === gameId);
      if (!g?.serviceCategories?.[categoryName]) return prev;
      g.serviceCategories[categoryName].note = note || null;
      return next;
    });
  };

  const addGame = () => {
    const name = (newGame.name || '').trim();
    if (!name) return alert('Vui lòng nhập tên game');
    setGames((prev) => [
      ...prev,
      {
        id: nextGameId,
        name,
        image: (newGame.image || '').trim(),
        description: (newGame.description || '').trim(),
        badge: (newGame.badge || '').trim(),
        serviceCategories: {}
      }
    ]);
    setExpandedGameId(nextGameId);
    setShowAddGame(false);
    setNewGame({ name: '', image: '', description: '', badge: '' });
  };

  const addCategory = (gameId) => {
    const catName = window.prompt('Tên Loại (Category) mới?');
    if (!catName) return;
    const note = window.prompt('Note cho loại này? (có thể để trống)');
    setGames((prev) => {
      const next = deepClone(prev);
      const g = next.find((x) => x.id === gameId);
      if (!g) return prev;
      g.serviceCategories = g.serviceCategories || {};
      if (g.serviceCategories[catName]) {
        alert('Loại này đã tồn tại');
        return prev;
      }
      g.serviceCategories[catName] = { services: [], note: note ? note : null };
      return next;
    });
  };

  const deleteCategory = (gameId, categoryName) => {
    if (!window.confirm(`Xóa loại "${categoryName}"?`)) return;
    setGames((prev) => {
      const next = deepClone(prev);
      const g = next.find((x) => x.id === gameId);
      if (!g?.serviceCategories?.[categoryName]) return prev;
      delete g.serviceCategories[categoryName];
      return next;
    });
  };

  const addService = (gameId, categoryName) => {
    const serviceName = window.prompt('Tên dịch vụ?');
    if (!serviceName) return;
    const priceStr = window.prompt('Giá (VND)?', '0');
    const price = Number(priceStr || 0);
    if (!Number.isFinite(price) || price < 0) return alert('Giá không hợp lệ');
    setGames((prev) => {
      const next = deepClone(prev);
      const g = next.find((x) => x.id === gameId);
      const cat = g?.serviceCategories?.[categoryName];
      if (!cat) return prev;
      cat.services = cat.services || [];
      cat.services.push({ name: serviceName, price });
      return next;
    });
  };

  const deleteService = (gameId, categoryName, serviceIdx) => {
    if (!window.confirm('Xóa dịch vụ này?')) return;
    setGames((prev) => {
      const next = deepClone(prev);
      const g = next.find((x) => x.id === gameId);
      const cat = g?.serviceCategories?.[categoryName];
      if (!cat?.services?.[serviceIdx]) return prev;
      cat.services.splice(serviceIdx, 1);
      return next;
    });
  };

  const deleteGame = (gameId, gameName) => {
    if (!window.confirm(`Xóa toàn bộ bảng giá cho game "${gameName}"?`)) return;
    setGames((prev) => prev.filter((g) => g.id !== gameId));
    if (expandedGameId === gameId) {
      setExpandedGameId(null);
    }
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    try {
      setSaving(true);
      await api.put(
        '/api/admin/pricing/caythue',
        { data: games },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Cập nhật bảng giá thành công!');
    } catch (err) {
      console.error('Error saving pricing:', err);
      alert(err.response?.data?.message || 'Cập nhật bảng giá thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="pricing-manager">
        <div className="pricing-loading">Đang tải bảng giá...</div>
      </div>
    );
  }

  return (
    <div className="pricing-manager">
      <div className="pricing-header">
        <div className="pricing-title">QUẢN LÝ BẢNG GIÁ (CÀY THUÊ)</div>
        <div className="pricing-actions">
          <input
            className="pricing-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm game / loại / dịch vụ..."
          />
          <button className="pricing-add" onClick={() => setShowAddGame(true)} disabled={saving}>
            + Thêm game
          </button>
          <button className="pricing-save" onClick={handleSave} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>

      {showAddGame && (
        <div className="pricing-modal-backdrop" onClick={() => setShowAddGame(false)}>
          <div className="pricing-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pricing-modal-title">Thêm game (bảng giá mới)</div>
            <div className="pricing-form">
              <div className="pricing-field">
                <label>Tên game (*)</label>
                <input value={newGame.name} onChange={(e) => setNewGame({ ...newGame, name: e.target.value })} />
              </div>
              <div className="pricing-field">
                <label>Ảnh (URL)</label>
                <input value={newGame.image} onChange={(e) => setNewGame({ ...newGame, image: e.target.value })} />
              </div>
              <div className="pricing-field">
                <label>Mô tả</label>
                <input
                  value={newGame.description}
                  onChange={(e) => setNewGame({ ...newGame, description: e.target.value })}
                />
              </div>
              <div className="pricing-field">
                <label>Badge</label>
                <input value={newGame.badge} onChange={(e) => setNewGame({ ...newGame, badge: e.target.value })} />
              </div>
            </div>
            <div className="pricing-modal-actions">
              <button className="pricing-btn" onClick={() => setShowAddGame(false)}>
                Hủy
              </button>
              <button className="pricing-btn primary" onClick={addGame}>
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredGames.length === 0 ? (
        <div className="pricing-empty">Không có dữ liệu bảng giá.</div>
      ) : (
        <div className="pricing-games">
          {filteredGames.map((game) => {
            const isExpanded = expandedGameId === game.id;
            const categories = game.serviceCategories || {};
            return (
              <div key={game.id} className="pricing-game-card">
                <div className="pricing-game-header">
                  <div
                    className="pricing-game-main"
                    onClick={() => setExpandedGameId(isExpanded ? null : game.id)}
                  >
                    <div className="pricing-game-name">{game.name}</div>
                    <div className="pricing-game-meta">
                      <span>{Object.keys(categories).length} loại</span>
                      <span className="pricing-expand">{isExpanded ? '−' : '+'}</span>
                    </div>
                  </div>
                  <button
                    className="pricing-small danger"
                    onClick={() => deleteGame(game.id, game.name)}
                  >
                    Xóa bảng giá
                  </button>
                </div>

                {isExpanded && (
                  <div className="pricing-game-body">
                    <div className="pricing-game-toolbar">
                      <button className="pricing-small" onClick={() => addCategory(game.id)}>
                        + Thêm loại
                      </button>
                    </div>
                    {Object.keys(categories).map((catName) => {
                      const cat = categories[catName];
                      const services = cat?.services || [];
                      return (
                        <div key={catName} className="pricing-category">
                          <div className="pricing-category-head">
                            <div className="pricing-category-title">{catName}</div>
                            <div className="pricing-category-actions">
                              <button className="pricing-small" onClick={() => addService(game.id, catName)}>
                                + Thêm dịch vụ
                              </button>
                              <button className="pricing-small danger" onClick={() => deleteCategory(game.id, catName)}>
                                Xóa loại
                              </button>
                            </div>
                          </div>

                          <div className="pricing-note-edit">
                            <label>Note</label>
                            <input
                              value={cat?.note || ''}
                              onChange={(e) => updateCategoryNote(game.id, catName, e.target.value)}
                              placeholder="Ghi chú cho loại (có thể để trống)"
                            />
                          </div>

                          <div className="pricing-table">
                            <div className="pricing-row pricing-row-header">
                              <div className="pricing-col-name">Tên dịch vụ</div>
                              <div className="pricing-col-price">Giá (VND)</div>
                              <div className="pricing-col-actions">Xóa</div>
                            </div>
                            {services.map((s, idx) => (
                              <div key={`${catName}-${idx}`} className="pricing-row">
                                <div className="pricing-col-name">
                                  <input
                                    className="pricing-name-input"
                                    value={s.name || ''}
                                    onChange={(e) => updateServiceName(game.id, catName, idx, e.target.value)}
                                  />
                                </div>
                                <div className="pricing-col-price">
                                  <input
                                    type="number"
                                    min="0"
                                    className="pricing-price-input"
                                    value={Number(s.price) || 0}
                                    onChange={(e) =>
                                      updateServicePrice(game.id, catName, idx, Number(e.target.value || 0))
                                    }
                                  />
                                </div>
                                <div className="pricing-col-actions">
                                  <button
                                    className="pricing-icon danger"
                                    title="Xóa dịch vụ"
                                    onClick={() => deleteService(game.id, catName, idx)}
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


