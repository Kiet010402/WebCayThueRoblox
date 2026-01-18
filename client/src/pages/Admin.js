import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import RevenueDashboard from '../components/admin/RevenueDashboard';
import AnnouncementEditor from '../components/admin/AnnouncementEditor';
import PricingManager from '../components/admin/PricingManager';
import './Admin.css';

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

// Helper function to mask/fake email only for admin users
const formatEmailForDisplay = (email, role) => {
  if (!email) return '-';
  // Only mask and fake domain for admin users
  if (role === 'admin') {
    return fakeEmailDomain(maskEmail(email));
  }
  // Normal users: show email as-is
  return email;
};

function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [recharges, setRecharges] = useState([]);
  const [news, setNews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [addBalanceAmount, setAddBalanceAmount] = useState('');
  const [balanceMode, setBalanceMode] = useState('add'); // add | subtract
  const [showAddBalanceModal, setShowAddBalanceModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsCategory, setNewsCategory] = useState('📢 Thông Báo');
  const [newsUrl, setNewsUrl] = useState('');
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [pendingRechargesCount, setPendingRechargesCount] = useState(0);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRechargeId, setSelectedRechargeId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [billCache, setBillCache] = useState({}); // Cache bill images by rechargeId
  const [loadingBill, setLoadingBill] = useState(false);
  const [showCardInfoModal, setShowCardInfoModal] = useState(false);
  const [selectedCardInfo, setSelectedCardInfo] = useState(null);
  const [showCardFeeModal, setShowCardFeeModal] = useState(false);
  const [cardFeePercent, setCardFeePercent] = useState('');
  const [selectedRechargeForFee, setSelectedRechargeForFee] = useState(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [voucherDiscount, setVoucherDiscount] = useState('');
  const [selectedUserForVoucher, setSelectedUserForVoucher] = useState(null);
  // User detail modal states
  const [showOrdersSection, setShowOrdersSection] = useState(true);
  const [showRechargesSection, setShowRechargesSection] = useState(true);
  const [ordersDisplayLimit, setOrdersDisplayLimit] = useState(5);
  const [rechargesDisplayLimit, setRechargesDisplayLimit] = useState(5);
  // Pagination and search states
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersSearch, setUsersSearch] = useState('');
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);
  const [ordersSearch, setOrdersSearch] = useState('');
  const [ordersStatusFilter, setOrdersStatusFilter] = useState('');
  const [rechargesPage, setRechargesPage] = useState(1);
  const [rechargesTotalPages, setRechargesTotalPages] = useState(1);
  const [rechargesStatusFilter, setRechargesStatusFilter] = useState('');
  const [searchNonce, setSearchNonce] = useState(0);
  // Voucher management
  const [vouchers, setVouchers] = useState([]);
  const [vouchersPage, setVouchersPage] = useState(1);
  const [vouchersTotalPages, setVouchersTotalPages] = useState(1);
  const [voucherStatusFilter, setVoucherStatusFilter] = useState('');
  const [newVoucherCode, setNewVoucherCode] = useState('');
  const [newVoucherDiscount, setNewVoucherDiscount] = useState('');
  const [newVoucherExpiry, setNewVoucherExpiry] = useState('');
  const [newVoucherMinAmount, setNewVoucherMinAmount] = useState('');
  // Account management
  const [accounts, setAccounts] = useState([]);
  const [accountsPage, setAccountsPage] = useState(1);
  const [accountsTotalPages, setAccountsTotalPages] = useState(1);
  const [accountsSearch, setAccountsSearch] = useState('');
  const [accountsGameFilter, setAccountsGameFilter] = useState('');
  const [accountsStatusFilter, setAccountsStatusFilter] = useState('');
  const [availableGames, setAvailableGames] = useState(['Anime Crusader', 'Anime Vanguards', 'Universal Tower Defense', 'The Forge']);
  // Games management
  const [games, setGames] = useState([]);
  const [newGameName, setNewGameName] = useState('');
  const [newGameImage, setNewGameImage] = useState('');
  const [editingGame, setEditingGame] = useState(null);
  const [editGameName, setEditGameName] = useState('');
  const [editGameImage, setEditGameImage] = useState('');
  const [newAccountGame, setNewAccountGame] = useState('Anime Crusader');
  const [newAccountInfo, setNewAccountInfo] = useState('');
  const [newAccountImage, setNewAccountImage] = useState('');
  const [newAccountUsername, setNewAccountUsername] = useState('');
  const [newAccountPassword, setNewAccountPassword] = useState('');
  const [newAccountOriginalPrice, setNewAccountOriginalPrice] = useState('');
  const [newAccountDiscountedPrice, setNewAccountDiscountedPrice] = useState('');
  // Account detail modal
  const [showAccountDetailModal, setShowAccountDetailModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [editAccountGame, setEditAccountGame] = useState('');
  const [editAccountInfo, setEditAccountInfo] = useState('');
  const [editAccountImage, setEditAccountImage] = useState('');
  const [editAccountUsername, setEditAccountUsername] = useState('');
  const [editAccountPassword, setEditAccountPassword] = useState('');
  const [editAccountOriginalPrice, setEditAccountOriginalPrice] = useState('');
  const [editAccountDiscountedPrice, setEditAccountDiscountedPrice] = useState('');
  const [editAccountStatus, setEditAccountStatus] = useState('');
  // Blind bag management
  const [blindBags, setBlindBags] = useState([]);
  const [blindBagAccounts, setBlindBagAccounts] = useState([]);
  const [blindBagAccountsPage, setBlindBagAccountsPage] = useState(1);
  const [blindBagAccountsTotalPages, setBlindBagAccountsTotalPages] = useState(1);
  const [newBlindBagGame, setNewBlindBagGame] = useState('');
  const [newBlindBagPremiumRate, setNewBlindBagPremiumRate] = useState('');
  const [newBlindBagImage, setNewBlindBagImage] = useState('');
  const [newBlindBagInfo, setNewBlindBagInfo] = useState('');
  const [newBlindBagOriginalPrice, setNewBlindBagOriginalPrice] = useState('');
  const [newBlindBagDiscountedPrice, setNewBlindBagDiscountedPrice] = useState('');
  const [editingBlindBag, setEditingBlindBag] = useState(null);
  const [editBlindBagGame, setEditBlindBagGame] = useState('');
  const [editBlindBagPremiumRate, setEditBlindBagPremiumRate] = useState('');
  const [editBlindBagImage, setEditBlindBagImage] = useState('');
  const [editBlindBagInfo, setEditBlindBagInfo] = useState('');
  const [editBlindBagOriginalPrice, setEditBlindBagOriginalPrice] = useState('');
  const [editBlindBagDiscountedPrice, setEditBlindBagDiscountedPrice] = useState('');
  // Add account to blind bag
  const [selectedBlindBagForAccount, setSelectedBlindBagForAccount] = useState('');
  const [newBlindBagAccountUsername, setNewBlindBagAccountUsername] = useState('');
  const [newBlindBagAccountPassword, setNewBlindBagAccountPassword] = useState('');
  const [newBlindBagAccountType, setNewBlindBagAccountType] = useState('thường');
  // Blind bag account detail modal
  const [showBlindBagAccountDetailModal, setShowBlindBagAccountDetailModal] = useState(false);
  const [selectedBlindBagAccount, setSelectedBlindBagAccount] = useState(null);
  const [editBlindBagAccountUsername, setEditBlindBagAccountUsername] = useState('');
  const [editBlindBagAccountPassword, setEditBlindBagAccountPassword] = useState('');
  const [editBlindBagAccountType, setEditBlindBagAccountType] = useState('');
  // Search and filter for blind bag accounts
  const [blindBagAccountsSearch, setBlindBagAccountsSearch] = useState('');
  const [blindBagAccountsBlindBagFilter, setBlindBagAccountsBlindBagFilter] = useState('');
  const [blindBagAccountsTypeFilter, setBlindBagAccountsTypeFilter] = useState('');
  const [blindBagAccountsStatusFilter, setBlindBagAccountsStatusFilter] = useState('');
  // Collapse/expand states for blind bag management sections
  const [showCreateBlindBag, setShowCreateBlindBag] = useState(false);
  const [showBlindBagsList, setShowBlindBagsList] = useState(false);
  const [showAddAccountToBlindBag, setShowAddAccountToBlindBag] = useState(false);
  const [showBlindBagAccountsTable, setShowBlindBagAccountsTable] = useState(false);
  // Collapse/expand states for account management sections
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showGamesManagement, setShowGamesManagement] = useState(false);
  const [showGamesList, setShowGamesList] = useState(false);
  const [showAccountsTable, setShowAccountsTable] = useState(false);
  // Recharge promotion
  const [rechargePromotionPercent, setRechargePromotionPercent] = useState(0);
  const [rechargePromotionInput, setRechargePromotionInput] = useState('');

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!token || !user || user.role !== 'admin') {
      navigate('/login');
      return;
    }

    try {
      const [usersRes, ordersRes, rechargesRes, statsRes, newsRes] = await Promise.all([
        api.get(`/api/admin/users?page=${usersPage}&limit=7&search=${encodeURIComponent(usersSearch)}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get(`/api/admin/orders?page=${ordersPage}&limit=7&search=${encodeURIComponent(ordersSearch)}&status=${encodeURIComponent(ordersStatusFilter)}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get(`/api/admin/recharges?page=${rechargesPage}&limit=7&status=${encodeURIComponent(rechargesStatusFilter)}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get('/api/news')
      ]);
      
      setUsers(Array.isArray(usersRes.data.users) ? usersRes.data.users : []);
      setUsersTotalPages(usersRes.data.totalPages || 1);
      setOrders(Array.isArray(ordersRes.data.orders) ? ordersRes.data.orders : []);
      setOrdersTotalPages(ordersRes.data.totalPages || 1);
      setRecharges(Array.isArray(rechargesRes.data.recharges) ? rechargesRes.data.recharges : []);
      setRechargesTotalPages(rechargesRes.data.totalPages || 1);
      setStats(statsRes.data);
      setRechargePromotionPercent(statsRes.data.rechargePromotionPercent || 0);
      setRechargePromotionInput(statsRes.data.rechargePromotionPercent?.toString() || '0');
      setNews(Array.isArray(newsRes.data) ? newsRes.data : []);
      
      // Count pending orders and recharges (need to fetch all for accurate count)
      const [allOrdersRes, allRechargesRes] = await Promise.all([
        api.get('/api/admin/orders?page=1&limit=10000', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get('/api/admin/recharges?page=1&limit=10000', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      const pendingOrders = Array.isArray(allOrdersRes.data.orders) ? allOrdersRes.data.orders.filter(order => order.status === 'Đang xử lí') : [];
      const pendingRecharges = Array.isArray(allRechargesRes.data.recharges) ? allRechargesRes.data.recharges.filter(recharge => recharge.status === 'Đang xử lí') : [];
      setPendingOrdersCount(pendingOrders.length);
      setPendingRechargesCount(pendingRecharges.length);
    } catch (error) {
      console.error('Error fetching data:', error);
      console.error('Error response:', error.response?.data);
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        navigate('/login');
      } else {
        alert('Có lỗi xảy ra khi tải dữ liệu: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, usersPage, usersSearch, ordersPage, ordersSearch, ordersStatusFilter, rechargesPage, rechargesStatusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Force refetch when user presses "Tìm kiếm" while already on page 1
  useEffect(() => {
    if (searchNonce > 0) fetchData();
  }, [searchNonce, fetchData]);

  // Fetch vouchers only when voucher tab is active
  useEffect(() => {
    const fetchVouchers = async () => {
      const token = localStorage.getItem('token');
      const adminUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (!token || !adminUser || adminUser.role !== 'admin') return;

      try {
        const statusParam = voucherStatusFilter ? `&status=${encodeURIComponent(voucherStatusFilter)}` : '';
        const res = await api.get(
          `/api/admin/vouchers?page=${vouchersPage}&limit=7${statusParam}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setVouchers(Array.isArray(res.data.vouchers) ? res.data.vouchers : []);
        setVouchersTotalPages(res.data.totalPages || 1);
      } catch (error) {
        console.error('Error fetching vouchers:', error);
      }
    };

    if (activeTab === 'vouchers') {
      fetchVouchers();
    }
  }, [activeTab, vouchersPage, voucherStatusFilter]);

  // Fetch games function (defined outside useEffect so it can be used by other handlers)
  const fetchGames = useCallback(async () => {
    const token = localStorage.getItem('token');
    const adminUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (!token || !adminUser || adminUser.role !== 'admin') return;

    try {
      const [gamesRes, accountGamesRes] = await Promise.all([
        api.get('/api/admin/games', {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => ({ data: [] })), // Fallback if endpoint doesn't exist yet
        api.get('/api/admin/accounts/games', {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);
      if (Array.isArray(gamesRes.data)) {
        setGames(gamesRes.data);
      }
      if (Array.isArray(accountGamesRes.data)) {
        setAvailableGames(accountGamesRes.data);
      }
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  }, []);

  // Fetch accounts only when accounts tab is active
  useEffect(() => {
    const fetchAccounts = async () => {
      const token = localStorage.getItem('token');
      const adminUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (!token || !adminUser || adminUser.role !== 'admin') return;

      try {
        const searchParam = accountsSearch ? `&search=${encodeURIComponent(accountsSearch)}` : '';
        const gameParam = accountsGameFilter ? `&game=${encodeURIComponent(accountsGameFilter)}` : '';
        const statusParam = accountsStatusFilter ? `&status=${encodeURIComponent(accountsStatusFilter)}` : '';
        const res = await api.get(
          `/api/admin/accounts?page=${accountsPage}&limit=7${searchParam}${gameParam}${statusParam}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setAccounts(Array.isArray(res.data.accounts) ? res.data.accounts : []);
        setAccountsTotalPages(res.data.totalPages || 1);
      } catch (error) {
        console.error('Error fetching accounts:', error);
      }
    };

    if (activeTab === 'accounts') {
      fetchAccounts();
      fetchGames();
    }
    if (activeTab === 'games') {
      fetchGames();
    }
  }, [activeTab, accountsPage, accountsSearch, accountsGameFilter, accountsStatusFilter, searchNonce, fetchGames]);

  // Fetch blind bags and accounts
  useEffect(() => {
    const fetchBlindBags = async () => {
      const token = localStorage.getItem('token');
      const adminUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (!token || !adminUser || adminUser.role !== 'admin') return;

      try {
        const res = await api.get('/api/blindbags', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const loadedBlindBags = Array.isArray(res.data) ? res.data : [];
        
        // Fetch stats for each blind bag (from /stats route to get accurate counts)
        const blindBagsWithStats = await Promise.all(
          loadedBlindBags.map(async (bag) => {
            try {
              const statsRes = await api.get(`/api/blindbags/${bag._id}/stats`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              return {
                ...bag,
                availableAccounts: statsRes.data.availableAccounts || 0,
                soldAccounts: statsRes.data.soldAccounts || 0
              };
            } catch (error) {
              return {
                ...bag,
                availableAccounts: 0,
                soldAccounts: 0
              };
            }
          })
        );
        
        setBlindBags(blindBagsWithStats);
      } catch (error) {
        console.error('Error fetching blind bags:', error);
      }
    };

    const fetchBlindBagAccounts = async () => {
      const token = localStorage.getItem('token');
      const adminUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (!token || !adminUser || adminUser.role !== 'admin') return;

      try {
        const searchParam = blindBagAccountsSearch ? `&search=${encodeURIComponent(blindBagAccountsSearch)}` : '';
        const blindBagParam = blindBagAccountsBlindBagFilter ? `&blindBagId=${encodeURIComponent(blindBagAccountsBlindBagFilter)}` : '';
        const typeParam = blindBagAccountsTypeFilter ? `&accountType=${encodeURIComponent(blindBagAccountsTypeFilter)}` : '';
        const statusParam = blindBagAccountsStatusFilter ? `&status=${encodeURIComponent(blindBagAccountsStatusFilter)}` : '';
        
        const res = await api.get(
          `/api/blindbags/admin/accounts/all?page=${blindBagAccountsPage}&limit=7${searchParam}${blindBagParam}${typeParam}${statusParam}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setBlindBagAccounts(Array.isArray(res.data.accounts) ? res.data.accounts : []);
        setBlindBagAccountsTotalPages(res.data.totalPages || 1);
      } catch (error) {
        console.error('Error fetching blind bag accounts:', error);
      }
    };

    if (activeTab === 'blindbags') {
      fetchBlindBags();
      fetchBlindBagAccounts();
      fetchGames();
    }
  }, [activeTab, blindBagAccountsPage, blindBagAccountsSearch, blindBagAccountsBlindBagFilter, blindBagAccountsTypeFilter, blindBagAccountsStatusFilter, fetchGames]);

  const handleAddBalance = async () => {
    const value = Number(addBalanceAmount);
    if (!Number.isFinite(value) || value <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ (> 0)');
      return;
    }

    const delta = balanceMode === 'add' ? value : -value;
    const token = localStorage.getItem('token');
    try {
      await api.post(
        `/api/admin/users/${selectedUser._id}/add-balance`,
        { amount: delta },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Cập nhật số dư thành công!');
      setShowAddBalanceModal(false);
      setAddBalanceAmount('');
      setBalanceMode('add');
      setSelectedUser(null);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleCreateVoucher = async () => {
    if (!newVoucherCode.trim() || !newVoucherDiscount || !newVoucherExpiry) {
      alert('Vui lòng nhập đầy đủ: mã, giảm giá, ngày hết hạn');
      return;
    }
    const discountValue = Number(newVoucherDiscount);
    if (!Number.isFinite(discountValue) || discountValue <= 0 || discountValue > 100) {
      alert('Giảm giá phải trong khoảng 1 - 100%');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      await api.post(
        '/api/admin/vouchers',
        {
          code: newVoucherCode.trim(),
          discount: discountValue,
          expiresAt: newVoucherExpiry,
          minOrderAmount: Number(newVoucherMinAmount) || 0,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert('Tạo voucher thành công');
      setNewVoucherCode('');
      setNewVoucherDiscount('');
      setNewVoucherExpiry('');
      setNewVoucherMinAmount('');
      // Reload vouchers
      setVouchersPage(1);
      if (activeTab === 'vouchers') {
        const statusParam = voucherStatusFilter ? `&status=${encodeURIComponent(voucherStatusFilter)}` : '';
        const res = await api.get(
          `/api/admin/vouchers?page=1&limit=7${statusParam}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setVouchers(Array.isArray(res.data.vouchers) ? res.data.vouchers : []);
        setVouchersTotalPages(res.data.totalPages || 1);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi tạo voucher');
    }
  };

  const handleDeleteVoucher = async (voucherId, voucherCode) => {
    if (!window.confirm(`Bạn chắc chắn muốn xóa voucher "${voucherCode}"? Hành động này không thể hoàn tác.`)) {
      return;
    }
    const token = localStorage.getItem('token');
    try {
      await api.delete(`/api/admin/vouchers/${voucherId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Đã xóa voucher');
      // Refetch vouchers
      const statusParam = voucherStatusFilter ? `&status=${encodeURIComponent(voucherStatusFilter)}` : '';
      const res = await api.get(
        `/api/admin/vouchers?page=${vouchersPage}&limit=7${statusParam}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setVouchers(Array.isArray(res.data.vouchers) ? res.data.vouchers : []);
      setVouchersTotalPages(res.data.totalPages || 1);
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa voucher');
    }
  };

  // Account management handlers
  const handleCreateAccount = async () => {
    if (!newAccountGame || !newAccountUsername || !newAccountPassword || !newAccountOriginalPrice || !newAccountDiscountedPrice) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }
    const originalPrice = Number(newAccountOriginalPrice);
    const discountedPrice = Number(newAccountDiscountedPrice);
    if (!Number.isFinite(originalPrice) || originalPrice <= 0 || !Number.isFinite(discountedPrice) || discountedPrice <= 0) {
      alert('Giá phải là số dương');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      await api.post(
        '/api/admin/accounts',
        {
          game: newAccountGame,
          info: newAccountInfo,
          image: newAccountImage,
          username: newAccountUsername,
          password: newAccountPassword,
          originalPrice: originalPrice,
          discountedPrice: discountedPrice,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert('Đăng account thành công!');
      // Reset form
      setNewAccountGame('Anime Crusader');
      setNewAccountInfo('');
      setNewAccountImage('');
      setNewAccountUsername('');
      setNewAccountPassword('');
      setNewAccountOriginalPrice('');
      setNewAccountDiscountedPrice('');
      // Refetch accounts
      const searchParam = accountsSearch ? `&search=${encodeURIComponent(accountsSearch)}` : '';
      const gameParam = accountsGameFilter ? `&game=${encodeURIComponent(accountsGameFilter)}` : '';
      const statusParam = accountsStatusFilter ? `&status=${encodeURIComponent(accountsStatusFilter)}` : '';
      const res = await api.get(
        `/api/admin/accounts?page=${accountsPage}&limit=7${searchParam}${gameParam}${statusParam}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAccounts(Array.isArray(res.data.accounts) ? res.data.accounts : []);
      setAccountsTotalPages(res.data.totalPages || 1);
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi đăng account');
    }
  };

  const handleShowAccountDetail = (account) => {
    setSelectedAccount(account);
    setEditAccountGame(account.game || '');
    setEditAccountInfo(account.info || '');
    setEditAccountImage(account.image || '');
    setEditAccountUsername(account.username || '');
    setEditAccountPassword(account.password || '');
    setEditAccountOriginalPrice(account.originalPrice || '');
    setEditAccountDiscountedPrice(account.discountedPrice || '');
    setEditAccountStatus(account.status || 'chưa bán');
    setShowAccountDetailModal(true);
  };

  const handleUpdateAccount = async () => {
    if (!selectedAccount) return;
    const token = localStorage.getItem('token');
    try {
      await api.put(`/api/admin/accounts/${selectedAccount._id}`, {
        game: editAccountGame,
        info: editAccountInfo,
        image: editAccountImage,
        username: editAccountUsername,
        password: editAccountPassword,
        originalPrice: editAccountOriginalPrice,
        discountedPrice: editAccountDiscountedPrice,
        status: editAccountStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Cập nhật account thành công!');
      setShowAccountDetailModal(false);
      // Refetch accounts
      const searchParam = accountsSearch ? `&search=${encodeURIComponent(accountsSearch)}` : '';
      const gameParam = accountsGameFilter ? `&game=${encodeURIComponent(accountsGameFilter)}` : '';
      const statusParam = accountsStatusFilter ? `&status=${encodeURIComponent(accountsStatusFilter)}` : '';
      const res = await api.get(
        `/api/admin/accounts?page=${accountsPage}&limit=7${searchParam}${gameParam}${statusParam}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAccounts(Array.isArray(res.data.accounts) ? res.data.accounts : []);
      setAccountsTotalPages(res.data.totalPages || 1);
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật account');
    }
  };

  const handleDeleteAccountFromModal = async () => {
    if (!selectedAccount) return;
    if (!window.confirm(`Bạn chắc chắn muốn xóa account "${selectedAccount.code}"? Hành động này không thể hoàn tác.`)) {
      return;
    }
    const token = localStorage.getItem('token');
    try {
      await api.delete(`/api/admin/accounts/${selectedAccount._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Đã xóa account');
      setShowAccountDetailModal(false);
      // Refetch accounts
      const searchParam = accountsSearch ? `&search=${encodeURIComponent(accountsSearch)}` : '';
      const gameParam = accountsGameFilter ? `&game=${encodeURIComponent(accountsGameFilter)}` : '';
      const statusParam = accountsStatusFilter ? `&status=${encodeURIComponent(accountsStatusFilter)}` : '';
      const res = await api.get(
        `/api/admin/accounts?page=${accountsPage}&limit=7${searchParam}${gameParam}${statusParam}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAccounts(Array.isArray(res.data.accounts) ? res.data.accounts : []);
      setAccountsTotalPages(res.data.totalPages || 1);
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa account');
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleDeleteAccount = async (accountId, accountCode) => {
    if (!window.confirm(`Bạn chắc chắn muốn xóa account "${accountCode}"? Hành động này không thể hoàn tác.`)) {
      return;
    }
    const token = localStorage.getItem('token');
    try {
      await api.delete(`/api/admin/accounts/${accountId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Đã xóa account');
      // Refetch accounts
      const searchParam = accountsSearch ? `&search=${encodeURIComponent(accountsSearch)}` : '';
      const gameParam = accountsGameFilter ? `&game=${encodeURIComponent(accountsGameFilter)}` : '';
      const statusParam = accountsStatusFilter ? `&status=${encodeURIComponent(accountsStatusFilter)}` : '';
      const res = await api.get(
        `/api/admin/accounts?page=${accountsPage}&limit=7${searchParam}${gameParam}${statusParam}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAccounts(Array.isArray(res.data.accounts) ? res.data.accounts : []);
      setAccountsTotalPages(res.data.totalPages || 1);
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa account');
    }
  };

  // Game management handlers
  const handleCreateGame = async () => {
    if (!newGameName.trim()) {
      alert('Vui lòng nhập tên game');
      return;
    }
    const token = localStorage.getItem('token');
    try {
      await api.post('/api/admin/games', {
        name: newGameName.trim(),
        image: newGameImage.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Thêm game thành công!');
      setNewGameName('');
      setNewGameImage('');
      fetchGames();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi thêm game');
    }
  };

  const handleEditGame = (game) => {
    setEditingGame(game);
    setEditGameName(game.name);
    setEditGameImage(game.image || '');
  };

  const handleUpdateGame = async () => {
    if (!editingGame || !editGameName.trim()) {
      alert('Vui lòng nhập tên game');
      return;
    }
    const token = localStorage.getItem('token');
    try {
      await api.put(`/api/admin/games/${editingGame._id}`, {
        name: editGameName.trim(),
        image: editGameImage.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Cập nhật game thành công!');
      setEditingGame(null);
      setEditGameName('');
      setEditGameImage('');
      fetchGames();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật game');
    }
  };

  const handleDeleteGame = async (gameId) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa game này?')) {
      return;
    }
    const token = localStorage.getItem('token');
    try {
      await api.delete(`/api/admin/games/${gameId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Xóa game thành công!');
      fetchGames();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa game');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa user này và dữ liệu liên quan?')) {
      return;
    }
    const token = localStorage.getItem('token');
    try {
      await api.delete(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Đã xóa user');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa user');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const token = localStorage.getItem('token');
    try {
      await api.put(`/api/admin/orders/${orderId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa đơn hàng này? Hành động này không thể hoàn tác.')) {
      return;
    }
    const token = localStorage.getItem('token');
    try {
      await api.delete(`/api/admin/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Đã xóa đơn hàng thành công');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa đơn hàng');
    }
  };

  const handleDeleteRecharge = async (rechargeId) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa yêu cầu nạp tiền này? Hành động này không thể hoàn tác.')) {
      return;
    }
    const token = localStorage.getItem('token');
    try {
      await api.delete(`/api/admin/recharges/${rechargeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Đã xóa yêu cầu nạp tiền thành công');
      // Update local state instead of refetching all data
      setRecharges(prev => prev.filter(r => r._id !== rechargeId));
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa yêu cầu nạp tiền');
    }
  };

  const handleApproveRecharge = async (rechargeId) => {
    const recharge = recharges.find(r => r._id === rechargeId);
    
    // If payment method is card, show fee input modal first
    if (recharge?.paymentMethod === 'card') {
      setSelectedRechargeForFee(recharge);
      setCardFeePercent('');
      setShowCardFeeModal(true);
      return;
    }

    // For other payment methods, approve directly
    await approveRechargeDirectly(rechargeId);
  };

  const approveRechargeDirectly = async (rechargeId, cardFeePercent = null) => {
    const token = localStorage.getItem('token');
    try {
      const requestData = {};
      if (cardFeePercent !== null) {
        requestData.cardFeePercent = parseFloat(cardFeePercent);
      }
      
      const res = await api.put(`/api/admin/recharges/${rechargeId}/approve`,
        requestData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Duyệt nạp tiền thành công!');
      setShowCardFeeModal(false);
      setSelectedRechargeForFee(null);
      setCardFeePercent('');
      
      // Update state immediately (same pattern as reject)
      const updatedRecharge = res.data?.recharge;
      if (updatedRecharge) {
        // Check if it was pending before update
        setRecharges(prev => {
          const currentRecharge = prev.find(r => r._id === rechargeId);
          const wasPending = currentRecharge?.status === 'Đang xử lí';
          
          const next = prev.map(r => {
            if (r._id === rechargeId) {
              return { ...r, ...updatedRecharge };
            }
            return r;
          });
          
          // Decrease pending count if it was pending
          if (wasPending) {
          setPendingRechargesCount(count => Math.max(0, count - 1));
        }
          
          return next;
        });
      } else {
        // Fallback: reload if server didn't send updated recharge
      fetchData();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleRejectRecharge = (rechargeId) => {
    setSelectedRechargeId(rechargeId);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleUpdateRechargePromotion = async () => {
    const token = localStorage.getItem('token');
    const percent = parseFloat(rechargePromotionInput);
    
    if (isNaN(percent) || percent < 0 || percent > 100) {
      alert('Phần trăm khuyến mãi phải từ 0 đến 100');
      return;
    }

    try {
      await api.put('/api/admin/settings/recharge-promotion', {
        promotionPercent: percent
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setRechargePromotionPercent(percent);
      alert('Đã cập nhật khuyến mãi nạp tiền thành công!');
    } catch (error) {
      console.error('Error updating recharge promotion:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật khuyến mãi');
    }
  };

  const handleResetTopMonth = async () => {
    if (!window.confirm('Bạn có chắc muốn reset top nạp tháng? Hành động này sẽ xóa tất cả dữ liệu top nạp tháng hiện tại.')) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      await api.post('/api/admin/top-month/reset', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Reset top nạp tháng thành công!');
    } catch (error) {
      console.error('Error resetting top month:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi reset top nạp tháng');
    }
  };

  const confirmRejectRecharge = async () => {
    if (!rejectionReason.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }
    const token = localStorage.getItem('token');
    try {
      const res = await api.put(`/api/admin/recharges/${selectedRechargeId}/reject`,
        { rejectionReason: rejectionReason.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Từ chối nạp tiền thành công!');
      setShowRejectModal(false);
      const rechargeId = selectedRechargeId;
      setSelectedRechargeId(null);
      setRejectionReason('');
      const updatedRecharge = res.data?.recharge;
      if (updatedRecharge) {
        // Check if it was pending before update
        setRecharges(prev => {
          const currentRecharge = prev.find(r => r._id === rechargeId);
          const wasPending = currentRecharge?.status === 'Đang xử lí';
          
          const next = prev.map(r => {
            if (r._id === rechargeId) {
              return { ...r, ...updatedRecharge };
            }
            return r;
          });
          
          // Decrease pending count if it was pending
          if (wasPending) {
            setPendingRechargesCount(count => Math.max(0, count - 1));
          }
          
          return next;
        });
      } else {
      fetchData();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleViewBill = async (rechargeId) => {
    const recharge = recharges.find(r => r._id === rechargeId);
    
    // If payment method is card, show card info modal instead
    if (recharge?.paymentMethod === 'card') {
      setSelectedCardInfo({
        cardType: recharge.cardType || 'N/A',
        cardCode: recharge.cardCode || 'N/A',
        cardSerial: recharge.cardSerial || 'N/A'
      });
      setShowCardInfoModal(true);
      return;
    }

    // For other payment methods, show bill image
    // Check cache first
    if (billCache[rechargeId]) {
      setSelectedBill(billCache[rechargeId]);
      setShowBillModal(true);
      return;
    }

    // Show modal with loading state
    setShowBillModal(true);
    setSelectedBill(null);
    setLoadingBill(true);

    const token = localStorage.getItem('token');
    try {
      const response = await api.get(`/api/admin/recharges/${rechargeId}/bill`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const billImage = response.data.billImage;
      // Cache the image
      setBillCache(prev => ({ ...prev, [rechargeId]: billImage }));
      setSelectedBill(billImage);
    } catch (error) {
      alert('Không thể tải hình bill: ' + (error.response?.data?.message || error.message));
      setShowBillModal(false);
    } finally {
      setLoadingBill(false);
    }
  };

  const handleCreateNews = async () => {
    if (!newsTitle || !newsContent) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }
    const token = localStorage.getItem('token');
    try {
      await api.post('/api/news', 
        { title: newsTitle, content: newsContent, category: newsCategory, url: newsUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Tạo tin tức thành công!');
      setShowNewsModal(false);
      setNewsTitle('');
      setNewsContent('');
      setNewsCategory('📢 Thông Báo');
      setNewsUrl('');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDeleteNews = async (newsId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tin tức này?')) {
      return;
    }
    const token = localStorage.getItem('token');
    try {
      await api.delete(`/api/news/${newsId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Xóa tin tức thành công!');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  // Blind bag handlers
  const handleCreateBlindBag = async () => {
    if (!newBlindBagGame || !newBlindBagOriginalPrice || !newBlindBagDiscountedPrice) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }
    const token = localStorage.getItem('token');
    try {
      await api.post('/api/blindbags', {
        game: newBlindBagGame,
        premiumRate: parseFloat(newBlindBagPremiumRate) || 0,
        image: newBlindBagImage,
        info: newBlindBagInfo,
        originalPrice: parseFloat(newBlindBagOriginalPrice),
        discountedPrice: parseFloat(newBlindBagDiscountedPrice)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Tạo túi mù thành công!');
      setNewBlindBagGame('');
      setNewBlindBagPremiumRate('');
      setNewBlindBagImage('');
      setNewBlindBagInfo('');
      setNewBlindBagOriginalPrice('');
      setNewBlindBagDiscountedPrice('');
      // Refresh blind bags
      const res = await api.get('/api/blindbags', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBlindBags(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleEditBlindBag = (blindBag) => {
    setEditingBlindBag(blindBag);
    setEditBlindBagGame(blindBag.game);
    setEditBlindBagPremiumRate(blindBag.premiumRate?.toString() || '0');
    setEditBlindBagImage(blindBag.image || '');
    setEditBlindBagInfo(blindBag.info || '');
    setEditBlindBagOriginalPrice(blindBag.originalPrice?.toString() || '');
    setEditBlindBagDiscountedPrice(blindBag.discountedPrice?.toString() || '');
  };

  const handleUpdateBlindBag = async () => {
    if (!editingBlindBag) return;
    const token = localStorage.getItem('token');
    try {
      await api.put(`/api/blindbags/${editingBlindBag._id}`, {
        game: editBlindBagGame,
        premiumRate: parseFloat(editBlindBagPremiumRate) || 0,
        image: editBlindBagImage,
        info: editBlindBagInfo,
        originalPrice: parseFloat(editBlindBagOriginalPrice),
        discountedPrice: parseFloat(editBlindBagDiscountedPrice)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Cập nhật túi mù thành công!');
      setEditingBlindBag(null);
      // Refresh blind bags with stats
      const res = await api.get('/api/blindbags', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const loadedBlindBags = Array.isArray(res.data) ? res.data : [];
      const blindBagsWithStats = await Promise.all(
        loadedBlindBags.map(async (bag) => {
          try {
            const statsRes = await api.get(`/api/blindbags/${bag._id}/stats`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            return {
              ...bag,
              availableAccounts: statsRes.data.availableAccounts || 0,
              soldAccounts: statsRes.data.soldAccounts || 0
            };
          } catch (error) {
            return {
              ...bag,
              availableAccounts: 0,
              soldAccounts: 0
            };
          }
        })
      );
      setBlindBags(blindBagsWithStats);
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDeleteBlindBag = async (blindBagId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa túi mù này?')) {
      return;
    }
    const token = localStorage.getItem('token');
    try {
      await api.delete(`/api/blindbags/${blindBagId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Xóa túi mù thành công!');
      // Refresh blind bags with stats
      const res = await api.get('/api/blindbags', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const loadedBlindBags = Array.isArray(res.data) ? res.data : [];
      const blindBagsWithStats = await Promise.all(
        loadedBlindBags.map(async (bag) => {
          try {
            const statsRes = await api.get(`/api/blindbags/${bag._id}/stats`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            return {
              ...bag,
              availableAccounts: statsRes.data.availableAccounts || 0,
              soldAccounts: statsRes.data.soldAccounts || 0
            };
          } catch (error) {
            return {
              ...bag,
              availableAccounts: 0,
              soldAccounts: 0
            };
          }
        })
      );
      setBlindBags(blindBagsWithStats);
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleAddAccountToBlindBag = async () => {
    if (!selectedBlindBagForAccount || !newBlindBagAccountUsername || !newBlindBagAccountPassword) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }
    const token = localStorage.getItem('token');
    try {
      await api.post(`/api/blindbags/${selectedBlindBagForAccount}/accounts`, {
        username: newBlindBagAccountUsername,
        password: newBlindBagAccountPassword,
        accountType: newBlindBagAccountType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Đăng acc lên túi mù thành công!');
      setNewBlindBagAccountUsername('');
      setNewBlindBagAccountPassword('');
      setNewBlindBagAccountType('thường');
      // Refresh blind bag accounts
      const searchParam = blindBagAccountsSearch ? `&search=${encodeURIComponent(blindBagAccountsSearch)}` : '';
      const blindBagParam = blindBagAccountsBlindBagFilter ? `&blindBagId=${encodeURIComponent(blindBagAccountsBlindBagFilter)}` : '';
      const typeParam = blindBagAccountsTypeFilter ? `&accountType=${encodeURIComponent(blindBagAccountsTypeFilter)}` : '';
      const statusParam = blindBagAccountsStatusFilter ? `&status=${encodeURIComponent(blindBagAccountsStatusFilter)}` : '';
      const res = await api.get(
        `/api/blindbags/admin/accounts/all?page=${blindBagAccountsPage}&limit=7${searchParam}${blindBagParam}${typeParam}${statusParam}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setBlindBagAccounts(Array.isArray(res.data.accounts) ? res.data.accounts : []);
      setBlindBagAccountsTotalPages(res.data.totalPages || 1);
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleViewBlindBagAccountDetail = async (accountId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await api.get(`/api/blindbags/accounts/${accountId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedBlindBagAccount(res.data);
      setEditBlindBagAccountUsername(res.data.username || '');
      setEditBlindBagAccountPassword(res.data.password || '');
      setEditBlindBagAccountType(res.data.accountType || 'thường');
      setShowBlindBagAccountDetailModal(true);
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleUpdateBlindBagAccount = async () => {
    if (!selectedBlindBagAccount) return;
    const token = localStorage.getItem('token');
    try {
      await api.put(`/api/blindbags/accounts/${selectedBlindBagAccount._id}`, {
        username: editBlindBagAccountUsername,
        password: editBlindBagAccountPassword,
        accountType: editBlindBagAccountType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Cập nhật account thành công!');
      // Refresh accounts list
      const searchParam = blindBagAccountsSearch ? `&search=${encodeURIComponent(blindBagAccountsSearch)}` : '';
      const blindBagParam = blindBagAccountsBlindBagFilter ? `&blindBagId=${encodeURIComponent(blindBagAccountsBlindBagFilter)}` : '';
      const typeParam = blindBagAccountsTypeFilter ? `&accountType=${encodeURIComponent(blindBagAccountsTypeFilter)}` : '';
      const statusParam = blindBagAccountsStatusFilter ? `&status=${encodeURIComponent(blindBagAccountsStatusFilter)}` : '';
      const res = await api.get(
        `/api/blindbags/admin/accounts/all?page=${blindBagAccountsPage}&limit=7${searchParam}${blindBagParam}${typeParam}${statusParam}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setBlindBagAccounts(Array.isArray(res.data.accounts) ? res.data.accounts : []);
      setBlindBagAccountsTotalPages(res.data.totalPages || 1);
      // Refresh detail
      const detailRes = await api.get(`/api/blindbags/accounts/${selectedBlindBagAccount._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedBlindBagAccount(detailRes.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDeleteBlindBagAccount = async () => {
    if (!selectedBlindBagAccount) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa account này? (Lịch sử mua acc vẫn được giữ lại)')) {
      return;
    }
    const token = localStorage.getItem('token');
    try {
      await api.delete(`/api/blindbags/accounts/${selectedBlindBagAccount._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Xóa account thành công!');
      setShowBlindBagAccountDetailModal(false);
      setSelectedBlindBagAccount(null);
      // Refresh accounts list
      const searchParam = blindBagAccountsSearch ? `&search=${encodeURIComponent(blindBagAccountsSearch)}` : '';
      const blindBagParam = blindBagAccountsBlindBagFilter ? `&blindBagId=${encodeURIComponent(blindBagAccountsBlindBagFilter)}` : '';
      const typeParam = blindBagAccountsTypeFilter ? `&accountType=${encodeURIComponent(blindBagAccountsTypeFilter)}` : '';
      const statusParam = blindBagAccountsStatusFilter ? `&status=${encodeURIComponent(blindBagAccountsStatusFilter)}` : '';
      const res = await api.get(
        `/api/blindbags/admin/accounts/all?page=${blindBagAccountsPage}&limit=7${searchParam}${blindBagParam}${typeParam}${statusParam}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setBlindBagAccounts(Array.isArray(res.data.accounts) ? res.data.accounts : []);
      setBlindBagAccountsTotalPages(res.data.totalPages || 1);
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleViewUserDetails = async (userId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await api.get(`/api/admin/users/${userId}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserDetails(response.data);
      // Reset display limits and sections when opening modal
      setOrdersDisplayLimit(5);
      setRechargesDisplayLimit(5);
      setShowOrdersSection(true);
      setShowRechargesSection(true);
      setShowUserDetailModal(true);
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi tải thông tin user');
    }
  };

  const handleAddVoucher = (user) => {
    setSelectedUserForVoucher(user);
    setVoucherDiscount(user.discount || '0');
    setShowVoucherModal(true);
  };

  const confirmAddVoucher = async () => {
    const discount = parseInt(voucherDiscount);
    if (isNaN(discount) || discount < 0 || discount > 100) {
      alert('Giảm giá phải từ 0 đến 100');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      await api.post(`/api/admin/users/${selectedUserForVoucher._id}/voucher`, {
        discount
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Cập nhật voucher thành công!');
      setShowVoucherModal(false);
      setSelectedUserForVoucher(null);
      setVoucherDiscount('');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return <div className="admin-container"><p>Đang tải...</p></div>;
  }

  return (
    <div className="admin-container">
      <h1>Quản Lý Hệ Thống</h1>

      <div className="admin-layout">
        <div className="admin-sidebar">
          <div 
            className={`sidebar-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span className="sidebar-icon">📊</span>
            <span className="sidebar-label">Thông tin hệ thống</span>
          </div>
          <div 
            className={`sidebar-item ${activeTab === 'revenue' ? 'active' : ''}`}
            onClick={() => setActiveTab('revenue')}
          >
            <span className="sidebar-icon">💰</span>
            <span className="sidebar-label">Quản lý Doanh Thu</span>
          </div>
          <div 
            className={`sidebar-item ${activeTab === 'vouchers' ? 'active' : ''}`}
            onClick={() => setActiveTab('vouchers')}
          >
            <span className="sidebar-icon">🎫</span>
            <span className="sidebar-label">Quản lý Voucher</span>
          </div>
          <div 
            className={`sidebar-item ${activeTab === 'blindbags' ? 'active' : ''}`}
            onClick={() => setActiveTab('blindbags')}
          >
            <span className="sidebar-icon">🎁</span>
            <span className="sidebar-label">Quản lý Túi Mù</span>
          </div>
          <div 
            className={`sidebar-item ${activeTab === 'accounts' ? 'active' : ''}`}
            onClick={() => setActiveTab('accounts')}
          >
            <span className="sidebar-icon">🎮</span>
            <span className="sidebar-label">Quản lý Acc</span>
        </div>
          <div 
            className={`sidebar-item ${activeTab === 'announcement' ? 'active' : ''}`}
            onClick={() => setActiveTab('announcement')}
          >
            <span className="sidebar-icon">📢</span>
            <span className="sidebar-label">Quản lý Thông Báo</span>
        </div>
          <div 
            className={`sidebar-item ${activeTab === 'pricing' ? 'active' : ''}`}
            onClick={() => setActiveTab('pricing')}
          >
            <span className="sidebar-icon">📋</span>
            <span className="sidebar-label">Quản lý Bảng Giá</span>
          </div>
          <div 
            className={`sidebar-item ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
            <span className="sidebar-icon">👥</span>
            <span className="sidebar-label">Quản lý Users</span>
          </div>
          <div 
            className={`sidebar-item ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
          style={{ position: 'relative' }}
        >
            <span className="sidebar-icon">📦</span>
            <span className="sidebar-label">Quản lý Đơn Hàng</span>
          {pendingOrdersCount > 0 && (
            <span className="notification-badge">{pendingOrdersCount}</span>
          )}
          </div>
          <div 
            className={`sidebar-item ${activeTab === 'recharges' ? 'active' : ''}`}
          onClick={() => setActiveTab('recharges')}
          style={{ position: 'relative' }}
        >
            <span className="sidebar-icon">💳</span>
            <span className="sidebar-label">Quản lý Nạp Tiền</span>
          {pendingRechargesCount > 0 && (
            <span className="notification-badge">{pendingRechargesCount}</span>
          )}
          </div>
          <div 
            className={`sidebar-item ${activeTab === 'news' ? 'active' : ''}`}
            onClick={() => setActiveTab('news')}
          >
            <span className="sidebar-icon">📰</span>
            <span className="sidebar-label">Quản lý Tin Tức</span>
          </div>
        </div>

        <div className="admin-content">
          {activeTab === 'overview' && (
            <>
              {/* VÍ CỦA HỆ THỐNG Section */}
              <div className="wallet-card">
                <h2 className="section-title">VÍ CỦA HỆ THỐNG</h2>
                <div className="balance-summary">
                  <div className="summary-item">
                    <div className="summary-label">Tổng Users</div>
                    <div className="summary-value">{stats?.totalUsers || 0}</div>
                  </div>
                  <div className="summary-item">
                    <div className="summary-label">Tổng Đơn Hàng</div>
                    <div className="summary-value">{stats?.totalOrders || 0}</div>
                  </div>
                  <div className="summary-item">
                    <div className="summary-label">Đơn đang xử lí</div>
                    <div className="summary-value">{pendingOrdersCount}</div>
                  </div>
                </div>
              </div>

              {/* THÔNG TIN HỆ THỐNG Section */}
              <div className="profile-card">
                <div className="profile-header">
                  <h2 className="section-title">THÔNG TIN HỆ THỐNG</h2>
                </div>
                <div className="profile-details">
                  <div className="detail-item">
                    <label>Tổng số Users</label>
                    <input
                      type="text"
                      value={stats?.totalUsers || 0}
                      readOnly
                    />
                  </div>
                  <div className="detail-item">
                    <label>Tổng số Đơn Hàng</label>
                    <input
                      type="text"
                      value={stats?.totalOrders || 0}
                      readOnly
                    />
                  </div>
                  <div className="detail-item">
                    <label>Đơn đang xử lí</label>
                    <input
                      type="text"
                      value={pendingOrdersCount}
                      readOnly
                    />
                  </div>
                  <div className="detail-item">
                    <label>Yêu cầu nạp tiền đang xử lí</label>
                    <input
                      type="text"
                      value={pendingRechargesCount}
                      readOnly
                    />
                  </div>
                </div>
                <div className="reset-top-month-section">
                  <button
                    className="btn-reset-top-month"
                    onClick={handleResetTopMonth}
                  >
                    <span className="reset-icon">🔄</span>
                    Reset Top Nạp Tháng
        </button>
                </div>
      </div>
            </>
          )}

          {activeTab === 'accounts' && (
            <>
              <div className="profile-card" style={{ marginBottom: '1.5rem' }}>
                <div 
                  className="profile-header" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => setShowCreateAccount(!showCreateAccount)}
                >
                  <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: 0 }}>
                    <span>Đăng Acc mới</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', marginLeft: '1rem' }}>
                      {showCreateAccount ? '−' : '+'}
                    </span>
                  </h2>
                </div>
                <div className={`collapsible-content ${showCreateAccount ? 'expanded' : 'collapsed'}`}>
                <div className="profile-details">
                  <div className="detail-column" style={{ maxWidth: '600px' }}>
                    <div className="detail-item">
                      <label>Game</label>
                      <select
                        value={newAccountGame}
                        onChange={(e) => setNewAccountGame(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                      >
                        {availableGames.map((game) => (
                          <option key={game} value={game}>{game}</option>
                        ))}
                      </select>
                    </div>
                    <div className="detail-item">
                      <label>Thông tin</label>
                      <input
                        type="text"
                        value={newAccountInfo}
                        onChange={(e) => setNewAccountInfo(e.target.value)}
                        placeholder="Thông tin về acc"
                      />
                    </div>
                    <div className="detail-item">
                      <label>Image (URL)</label>
                      <input
                        type="text"
                        value={newAccountImage}
                        onChange={(e) => setNewAccountImage(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <div className="detail-item">
                      <label>Tk</label>
                      <input
                        type="text"
                        value={newAccountUsername}
                        onChange={(e) => setNewAccountUsername(e.target.value)}
                        placeholder="Username"
                        required
                      />
                    </div>
                    <div className="detail-item">
                      <label>Mk</label>
                      <input
                        type="text"
                        value={newAccountPassword}
                        onChange={(e) => setNewAccountPassword(e.target.value)}
                        placeholder="Password"
                        required
                      />
                    </div>
                    <div className="detail-item">
                      <label>Giá gốc</label>
                      <input
                        type="number"
                        value={newAccountOriginalPrice}
                        onChange={(e) => setNewAccountOriginalPrice(e.target.value)}
                        placeholder="Ví dụ: 645000"
                        required
                      />
                    </div>
                    <div className="detail-item">
                      <label>Giá đã giảm</label>
                      <input
                        type="number"
                        value={newAccountDiscountedPrice}
                        onChange={(e) => setNewAccountDiscountedPrice(e.target.value)}
                        placeholder="Ví dụ: 258000"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      className="btn-submit"
                      onClick={handleCreateAccount}
                      style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}
                    >
                      Đăng Acc
                    </button>
                  </div>
                  </div>
                </div>
              </div>

              {/* Games Management */}
              <div className="profile-card" style={{ marginBottom: '1.5rem', marginTop: '2rem' }}>
                <div 
                  className="profile-header" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => setShowGamesManagement(!showGamesManagement)}
                >
                  <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: 0 }}>
                    <span>Quản lý Games</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', marginLeft: '1rem' }}>
                      {showGamesManagement ? '−' : '+'}
                    </span>
                  </h2>
                </div>
                <div className={`collapsible-content ${showGamesManagement ? 'expanded' : 'collapsed'}`}>
                <div className="profile-details">
                  <div className="detail-column" style={{ maxWidth: '600px' }}>
                    <div className="detail-item">
                      <label>Tên Game</label>
                      <input
                        type="text"
                        value={newGameName}
                        onChange={(e) => setNewGameName(e.target.value)}
                        placeholder="Tên game"
                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                      />
                    </div>
                    <div className="detail-item">
                      <label>Link ảnh (URL)</label>
                      <input
                        type="text"
                        value={newGameImage}
                        onChange={(e) => setNewGameImage(e.target.value)}
                        placeholder="URL hình ảnh game"
                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                      />
                      {newGameImage && (
                        <img src={newGameImage} alt="Preview" style={{ maxWidth: '200px', marginTop: '10px', borderRadius: '4px' }} />
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn-submit"
                      onClick={handleCreateGame}
                      style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}
                    >
                      Thêm Game
                    </button>
                  </div>
                  </div>
                </div>
              </div>

              {/* Games List */}
              {games.length > 0 && (
                <div className="profile-card" style={{ marginBottom: '1.5rem' }}>
                  <div 
                    className="profile-header" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => setShowGamesList(!showGamesList)}
                  >
                    <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: 0 }}>
                      <span>Danh sách Games</span>
                      <span style={{ fontSize: '1.5rem', fontWeight: 'bold', marginLeft: '1rem' }}>
                        {showGamesList ? '−' : '+'}
                      </span>
                    </h2>
                  </div>
                  <div className={`collapsible-content ${showGamesList ? 'expanded' : 'collapsed'}`}>
                  <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                    {games.map((game) => (
                      <div key={game._id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1rem' }}>
                        {editingGame && editingGame._id === game._id ? (
                          <div>
                            <input
                              type="text"
                              value={editGameName}
                              onChange={(e) => setEditGameName(e.target.value)}
                              style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                            />
                            <input
                              type="text"
                              value={editGameImage}
                              onChange={(e) => setEditGameImage(e.target.value)}
                              placeholder="URL ảnh"
                              style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                            />
                            {editGameImage && (
                              <img src={editGameImage} alt="Preview" style={{ width: '100%', marginBottom: '0.5rem', borderRadius: '4px' }} />
                            )}
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={handleUpdateGame}
                                style={{ flex: 1, padding: '0.5rem', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                              >
                                Lưu
                              </button>
                              <button
                                onClick={() => {
                                  setEditingGame(null);
                                  setEditGameName('');
                                  setEditGameImage('');
                                }}
                                style={{ flex: 1, padding: '0.5rem', background: '#9E9E9E', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                              >
                                Hủy
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {game.image && (
                              <img src={game.image} alt={game.name} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px', marginBottom: '0.5rem' }} />
                            )}
                            <h3 style={{ margin: '0 0 0.5rem 0' }}>{game.name}</h3>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => handleEditGame(game)}
                                style={{ flex: 1, padding: '0.5rem', background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                              >
                                Sửa
                              </button>
                              <button
                                onClick={() => handleDeleteGame(game._id)}
                                style={{ flex: 1, padding: '0.5rem', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                              >
                                Xóa
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  </div>
                </div>
              )}

            <div className="modern-table-container" style={{ marginTop: '2rem' }}>
              <div 
                className="table-header-bar"
                style={{ cursor: 'pointer' }}
                onClick={() => setShowAccountsTable(!showAccountsTable)}
              >
                <div className="header-title">
                  <span className="info-icon">🎮</span>
                  <span>QUẢN LÝ ACC</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', marginLeft: '1rem' }}>
                    {showAccountsTable ? '−' : '+'}
                  </span>
                </div>
              </div>
              <div className={`collapsible-content ${showAccountsTable ? 'expanded' : 'collapsed'}`}>

              <div className="table-controls">
                <div className="control-left">
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Tìm kiếm (mã số, game, tk)..."
                    value={accountsSearch}
                    onChange={(e) => setAccountsSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setAccountsPage(1);
                        setSearchNonce(prev => prev + 1);
                      }
                    }}
                  />
                  <select
                    className="status-filter-select"
                    value={accountsGameFilter}
                    onChange={(e) => {
                      setAccountsGameFilter(e.target.value);
                      setAccountsPage(1);
                    }}
                  >
                    <option value="">Tất cả Game</option>
                    {availableGames.map((game) => (
                      <option key={game} value={game}>{game}</option>
                    ))}
                  </select>
                  <select
                    className="status-filter-select"
                    value={accountsStatusFilter}
                    onChange={(e) => {
                      setAccountsStatusFilter(e.target.value);
                      setAccountsPage(1);
                    }}
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="chưa bán">Chưa bán</option>
                    <option value="đã bán">Đã bán</option>
                  </select>
                  <button
                    className="btn-search"
                    onClick={() => {
                      setAccountsPage(1);
                      setSearchNonce(prev => prev + 1);
                    }}
                  >
                    <span className="search-icon">🔍</span>
                    Tìm kiếm
        </button>
                  {(accountsSearch || accountsGameFilter || accountsStatusFilter) && (
        <button 
                      className="btn-clear-filter"
                      onClick={() => {
                        setAccountsSearch('');
                        setAccountsGameFilter('');
                        setAccountsStatusFilter('');
                        setAccountsPage(1);
                        setSearchNonce(prev => prev + 1);
                      }}
        >
                      <span className="trash-icon">🗑️</span>
                      Xóa bộ lọc
        </button>
                  )}
                </div>
      </div>

              <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  border: '1px solid #ddd',
                  backgroundColor: 'white'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#2196F3', color: 'white' }}>
                      <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem' }}>Ngày</th>
                      <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem' }}>Mã Số</th>
                      <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem' }}>Game</th>
                      <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem' }}>Thông tin</th>
                      <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem' }}>Trạng thái</th>
                      <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                {accounts.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#999', border: '1px solid #ddd' }}>
                    Chưa có account nào
                        </td>
                      </tr>
                ) : (
                      accounts.map((acc, index) => (
                        <tr key={acc._id} style={{ 
                          borderBottom: '1px solid #ddd',
                          backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white'
                        }}>
                          <td style={{ padding: '0.75rem', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                        {acc.createdAt ? formatDate(acc.createdAt) : 'N/A'}
                          </td>
                          <td style={{ padding: '0.75rem', border: '1px solid #ddd', fontWeight: '600', color: '#1976D2' }}>
                            {acc.code}
                          </td>
                          <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                            {acc.game}
                          </td>
                          <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                            {acc.info || '-'}
                          </td>
                          <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                        <span className={`status-badge status-${acc.status === 'chưa bán' ? 'available' : 'sold'}`}>
                          {acc.status === 'chưa bán' ? 'Chưa bán' : 'Đã bán'}
                        </span>
                          </td>
                          <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                        <button 
                          className="btn-detail-account"
                          onClick={() => handleShowAccountDetail(acc)}
                        >
                          Chi tiết
                        </button>
                          </td>
                        </tr>
                  ))
                )}
                  </tbody>
                </table>
              </div>

              <div className="table-footer">
                <div className="table-info">
                  Showing {accounts.length} of {accountsTotalPages * 7} Accounts
                </div>
              </div>
              {accountsTotalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', padding: '1rem' }}>
                  <button
                    onClick={() => setAccountsPage((prev) => Math.max(1, prev - 1))}
                    disabled={accountsPage === 1}
                    style={{
                      padding: '0.5rem 1rem',
                      background: accountsPage === 1 ? '#ccc' : '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: accountsPage === 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    ← Trước
                  </button>
                  <span style={{ color: '#666' }}>
                    Trang {accountsPage} / {accountsTotalPages}
                  </span>
                  <button
                    onClick={() => setAccountsPage((prev) => Math.min(accountsTotalPages, prev + 1))}
                    disabled={accountsPage === accountsTotalPages}
                    style={{
                      padding: '0.5rem 1rem',
                      background: accountsPage === accountsTotalPages ? '#ccc' : '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: accountsPage === accountsTotalPages ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Sau →
                  </button>
                </div>
              )}
            </div>
            </div>
          </>
          )}

          {/* Account Detail Modal */}
          {showAccountDetailModal && selectedAccount && (
            <div className="modal-overlay" onClick={() => setShowAccountDetailModal(false)}>
              <div className="modal-content account-detail-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Chi tiết Account - {selectedAccount.code}</h2>
                  <button className="modal-close" onClick={() => setShowAccountDetailModal(false)}>×</button>
                </div>
                <div className="modal-body">
                  <div className="account-detail-form">
                    <div className="form-group">
                      <label>Ngày tạo:</label>
                      <input type="text" value={selectedAccount.createdAt ? formatDate(selectedAccount.createdAt) : 'N/A'} disabled />
                    </div>
                    <div className="form-group">
                      <label>Mã số:</label>
                      <input type="text" value={selectedAccount.code} disabled />
                    </div>
                    <div className="form-group">
                      <label>Game:</label>
                      <select 
                        value={editAccountGame} 
                        onChange={(e) => setEditAccountGame(e.target.value)}
                        disabled={selectedAccount.status === 'đã bán'}
                      >
                        {availableGames.map(game => (
                          <option key={game} value={game}>{game}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Thông tin:</label>
                      <input 
                        type="text" 
                        value={editAccountInfo} 
                        onChange={(e) => setEditAccountInfo(e.target.value)}
                        placeholder="Thông tin về acc"
                        disabled={selectedAccount.status === 'đã bán'}
                      />
                    </div>
                    <div className="form-group">
                      <label>Hình ảnh (URL):</label>
                      <input 
                        type="text" 
                        value={editAccountImage} 
                        onChange={(e) => setEditAccountImage(e.target.value)}
                        placeholder="URL hình ảnh"
                        disabled={selectedAccount.status === 'đã bán'}
                      />
                      {editAccountImage && (
                        <img src={editAccountImage} alt="Account" style={{ maxWidth: '200px', marginTop: '10px', borderRadius: '4px' }} />
                      )}
                    </div>
                    <div className="form-group">
                      <label>Tk:</label>
                      <input 
                        type="text" 
                        value={editAccountUsername} 
                        onChange={(e) => setEditAccountUsername(e.target.value)}
                        placeholder="Tài khoản"
                        disabled={selectedAccount.status === 'đã bán'}
                      />
                    </div>
                    <div className="form-group">
                      <label>Mk:</label>
                      <input 
                        type="text" 
                        value={editAccountPassword} 
                        onChange={(e) => setEditAccountPassword(e.target.value)}
                        placeholder="Mật khẩu"
                        disabled={selectedAccount.status === 'đã bán'}
                      />
                    </div>
                    <div className="form-group">
                      <label>Giá gốc:</label>
                      <input 
                        type="number" 
                        value={editAccountOriginalPrice} 
                        onChange={(e) => setEditAccountOriginalPrice(e.target.value)}
                        placeholder="Giá gốc"
                        disabled={selectedAccount.status === 'đã bán'}
                      />
                    </div>
                    <div className="form-group">
                      <label>Giá giảm:</label>
                      <input 
                        type="number" 
                        value={editAccountDiscountedPrice} 
                        onChange={(e) => setEditAccountDiscountedPrice(e.target.value)}
                        placeholder="Giá sau giảm"
                        disabled={selectedAccount.status === 'đã bán'}
                      />
                    </div>
                    <div className="form-group">
                      <label>Trạng thái:</label>
                      <select 
                        value={editAccountStatus} 
                        onChange={(e) => setEditAccountStatus(e.target.value)}
                        disabled={selectedAccount.status === 'đã bán'}
                      >
                        <option value="chưa bán">Chưa bán</option>
                        <option value="đã bán">Đã bán</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Người mua:</label>
                      <input 
                        type="text" 
                        value={selectedAccount.buyerId ? (selectedAccount.buyerId.username || selectedAccount.buyerId.email || 'N/A') : '-'} 
                        disabled 
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  {selectedAccount.status !== 'đã bán' && (
                    <button className="btn-update-account" onClick={handleUpdateAccount}>
                      Cập nhật
                    </button>
                  )}
                  <button className="btn-delete-account" onClick={handleDeleteAccountFromModal}>
                    Xóa
                  </button>
                  {selectedAccount.status === 'đã bán' && (
                    <p style={{ color: '#f44336', margin: 0, padding: '0.5rem', fontSize: '0.9rem', flex: 1 }}>
                      ⚠️ Account đã bán - có thể xóa nhưng thống kê vẫn được lưu
                    </p>
                  )}
                  <button className="btn-cancel-modal" onClick={() => setShowAccountDetailModal(false)}>
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'revenue' && (
            <RevenueDashboard />
          )}

          {activeTab === 'announcement' && (
            <AnnouncementEditor />
          )}

          {activeTab === 'pricing' && (
            <PricingManager />
          )}

      {activeTab === 'vouchers' && (
        <div className="modern-table-container">
          <div className="table-header-bar">
            <div className="header-title">
              <span className="info-icon">🎫</span>
              <span>QUẢN LÝ VOUCHER</span>
            </div>
          </div>

          <div className="table-controls">
            <div className="control-left">
              <select
                className="status-filter-select"
                value={voucherStatusFilter}
                onChange={(e) => {
                  setVoucherStatusFilter(e.target.value);
                  setVouchersPage(1);
                }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="expired">Hết hạn</option>
              </select>
            </div>
          </div>

          <div className="profile-card" style={{ marginBottom: '1.5rem' }}>
            <div className="profile-header">
              <h2 className="section-title">Thêm voucher mới</h2>
            </div>
            <div className="profile-details">
              <div className="detail-column" style={{ maxWidth: '520px' }}>
                <div className="detail-item">
                  <label>Mã voucher</label>
                  <input
                    type="text"
                    value={newVoucherCode}
                    onChange={(e) => setNewVoucherCode(e.target.value)}
                    placeholder="VD: KAI10"
                  />
                </div>
                <div className="detail-item">
                  <label>Giảm giá (%)</label>
                  <input
                    type="number"
                    value={newVoucherDiscount}
                    onChange={(e) => setNewVoucherDiscount(e.target.value)}
                    placeholder="Ví dụ: 10"
                  />
                </div>
                <div className="detail-item">
                  <label>Hết hạn vào ngày</label>
                  <input
                    type="date"
                    value={newVoucherExpiry}
                    onChange={(e) => setNewVoucherExpiry(e.target.value)}
                  />
                </div>
                <div className="detail-item">
                  <label>Áp dụng cho đơn(đ)</label>
                  <input
                    type="number"
                    value={newVoucherMinAmount}
                    onChange={(e) => setNewVoucherMinAmount(e.target.value)}
                    placeholder="Ví dụ: 50000"
                  />
                </div>
                <button
                  type="button"
                  className="btn-submit"
                  onClick={handleCreateVoucher}
                  style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}
                >
                  Lưu voucher
        </button>
              </div>
            </div>
          </div>

          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              border: '1px solid #ddd',
              backgroundColor: 'white'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#2196F3', color: 'white' }}>
                  <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem' }}>Mã</th>
                  <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem' }}>Giảm giá</th>
                  <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem' }}>Áp dụng cho đơn</th>
                  <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem' }}>Hết hạn</th>
                  <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem' }}>Trạng thái</th>
                  <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
            {vouchers.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#999', border: '1px solid #ddd' }}>
                Chưa có voucher nào
                    </td>
                  </tr>
            ) : (
                  vouchers.map((v, index) => (
                    <tr key={v._id} style={{ 
                      borderBottom: '1px solid #ddd',
                      backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white'
                    }}>
                      <td style={{ padding: '0.75rem', border: '1px solid #ddd', fontWeight: 'bold' }}>
                        {v.code}
                      </td>
                      <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                        {v.discount}%
                      </td>
                      <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                    {v.minOrderAmount ? `${v.minOrderAmount.toLocaleString('vi-VN')}đ` : '0đ'}
                      </td>
                      <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                    {v.expiresAt ? formatDate(v.expiresAt) : 'N/A'}
                      </td>
                      <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                    <span className={`status-badge status-${v.status}`}>
                      {v.status === 'active' ? 'Hoạt động' : 'Hết hạn'}
                    </span>
                      </td>
                      <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                    <button 
                      className="btn-delete-voucher"
                      onClick={() => handleDeleteVoucher(v._id, v.code)}
                    >
                      Xóa
                    </button>
                      </td>
                    </tr>
              ))
            )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <div className="table-info">
              Showing {vouchers.length} of {vouchersTotalPages * 7} Vouchers
            </div>
          </div>
          {vouchersTotalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', padding: '1rem' }}>
              <button
                onClick={() => setVouchersPage((prev) => Math.max(1, prev - 1))}
                disabled={vouchersPage === 1}
                style={{
                  padding: '0.5rem 1rem',
                  background: vouchersPage === 1 ? '#ccc' : '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: vouchersPage === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                ← Trước
              </button>
              <span style={{ color: '#666' }}>
                Trang {vouchersPage} / {vouchersTotalPages}
              </span>
              <button
                onClick={() => setVouchersPage((prev) => Math.min(vouchersTotalPages, prev + 1))}
                disabled={vouchersPage === vouchersTotalPages}
                style={{
                  padding: '0.5rem 1rem',
                  background: vouchersPage === vouchersTotalPages ? '#ccc' : '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: vouchersPage === vouchersTotalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Sau →
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="modern-table-container">
          <div className="table-header-bar">
            <div className="header-title">
              <span className="info-icon">ℹ️</span>
              <span>QUẢN LÝ USERS</span>
            </div>
          </div>

          <div className="table-controls">
            <div className="control-left">
              <input
                type="text"
                className="search-input"
                placeholder="Tìm kiếm theo username hoặc email..."
                value={usersSearch}
                onChange={(e) => {
                  setUsersSearch(e.target.value);
                  setUsersPage(1);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setUsersPage(1);
                    setSearchNonce((n) => n + 1);
                  }
                }}
              />
            </div>
            <div className="control-right">
              <button
                className="btn-search"
                onClick={() => {
                  setUsersPage(1);
                  setSearchNonce((n) => n + 1);
                }}
              >
                <span className="search-icon">🔍</span>
                Tìm kiếm
              </button>
              <button className="btn-clear-filter" onClick={() => {
                setUsersSearch('');
                setUsersPage(1);
                setSearchNonce((n) => n + 1);
              }}>
                <span className="trash-icon">🗑️</span>
                Bỏ lọc
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              border: '1px solid #ddd',
              backgroundColor: 'white'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#2196F3', color: 'white' }}>
                  <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem', width: '50px' }}>
                <input type="checkbox" />
                  </th>
                  <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem' }}>Username</th>
                  <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem' }}>Email</th>
                  <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem' }}>Số Dư</th>
                  <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem' }}>Role</th>
                  <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem' }}>Hành Động</th>
                </tr>
              </thead>
              <tbody>
          {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#999', border: '1px solid #ddd' }}>
              Chưa có user nào
                    </td>
                  </tr>
          ) : (
                  users.map((user, index) => (
                    <tr key={user._id} style={{ 
                      borderBottom: '1px solid #ddd',
                      backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white'
                    }}>
                      <td style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'center' }}>
                    <input type="checkbox" />
                      </td>
                      <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                        {user.username}
                      </td>
                      <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                        {formatEmailForDisplay(user.email, user.role)}
                      </td>
                      <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                        {user.balance?.toLocaleString('vi-VN') || '0'}đ
                      </td>
                      <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                  <span className={`role-badge ${user.role}`}>{user.role}</span>
                      </td>
                      <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                  <button 
                    className="btn-view-detail"
                    onClick={() => handleViewUserDetails(user._id)}
                    style={{ padding: '0.5rem 1rem', background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Chi Tiết
                  </button>
                      </td>
                    </tr>
            ))
            )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <div className="table-info">
              Showing {users.length} of {stats?.totalUsers || 0} Users
            </div>
          </div>
          {usersTotalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', padding: '1rem' }}>
                  <button 
                onClick={() => setUsersPage(prev => Math.max(1, prev - 1))}
                disabled={usersPage === 1}
                style={{
                  padding: '0.5rem 1rem',
                  background: usersPage === 1 ? '#ccc' : '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: usersPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                ← Trước
              </button>
              <span style={{ color: '#666' }}>
                Trang {usersPage} / {usersTotalPages}
              </span>
              <button
                onClick={() => setUsersPage(prev => Math.min(usersTotalPages, prev + 1))}
                disabled={usersPage === usersTotalPages}
                style={{
                  padding: '0.5rem 1rem',
                  background: usersPage === usersTotalPages ? '#ccc' : '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: usersPage === usersTotalPages ? 'not-allowed' : 'pointer'
                    }}
                  >
                Sau →
                  </button>
                </div>
          )}
        </div>
      )}

      {activeTab === 'recharges' && (
        <div className="modern-table-container">
          <div className="table-header-bar">
            <div className="header-title">
              <span className="info-icon">ℹ️</span>
              <span>QUẢN LÝ NẠP TIỀN</span>
            </div>
          </div>

          <div style={{ 
            background: 'white', 
            border: '1px solid #ddd', 
            borderRadius: '8px', 
            padding: '1.5rem', 
            marginBottom: '1.5rem' 
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>🎁 Khuyến Mãi Nạp Tiền</h3>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontWeight: 'bold', color: '#666' }}>Phần trăm khuyến mãi:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={rechargePromotionInput}
                  onChange={(e) => setRechargePromotionInput(e.target.value)}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    width: '100px',
                    fontSize: '1rem'
                  }}
                  placeholder="0"
                />
                <span style={{ color: '#666' }}>%</span>
              </div>
              <button
                onClick={handleUpdateRechargePromotion}
                style={{
                  padding: '0.5rem 1.5rem',
                  background: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.9rem'
                }}
              >
                Cập Nhật
              </button>
              {rechargePromotionPercent > 0 && (
                <div style={{ 
                  padding: '0.5rem 1rem', 
                  background: 'linear-gradient(135deg, #4CAF50, #45a049)', 
                  color: 'white', 
                  borderRadius: '4px',
                  fontWeight: 'bold'
                }}>
                  Hiện tại: {rechargePromotionPercent}% khuyến mãi
                </div>
              )}
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>
              Khi nạp tiền, người dùng sẽ được cộng thêm {rechargePromotionPercent > 0 ? rechargePromotionPercent : '0'}% vào số tiền nạp.
              Ví dụ: Nạp 100.000đ với {rechargePromotionPercent > 0 ? rechargePromotionPercent : '0'}% khuyến mãi = {rechargePromotionPercent > 0 ? (100000 + Math.floor(100000 * rechargePromotionPercent / 100)).toLocaleString('vi-VN') : '100.000'}đ
            </p>
          </div>

          <div className="table-controls">
            <div className="control-left">
              <select
                className="status-filter-select"
                value={rechargesStatusFilter}
                onChange={(e) => {
                  setRechargesStatusFilter(e.target.value);
                  setRechargesPage(1);
                }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="Đang xử lí">Đang xử lí</option>
                <option value="Hoàn thành">Hoàn thành</option>
                <option value="Từ chối">Từ chối</option>
              </select>
            </div>
            <div className="control-right">
              <button className="btn-clear-filter" onClick={() => {
                setRechargesStatusFilter('');
                setRechargesPage(1);
              }}>
                <span className="trash-icon">🗑️</span>
                Bỏ lọc
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              border: '1px solid #ddd',
              backgroundColor: 'white'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#2196F3', color: 'white' }}>
                  <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem', width: '50px' }}>
                <input type="checkbox" />
                  </th>
                  <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem' }}>Ngày</th>
                  <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem' }}>User</th>
                  <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem' }}>Số Tiền</th>
                  <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem' }}>Phương Thức</th>
                  <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem' }}>Bill</th>
                  <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem' }}>Trạng Thái</th>
                  <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem' }}>Hành Động</th>
                </tr>
              </thead>
              <tbody>
          {recharges.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: '#999', border: '1px solid #ddd' }}>
              Chưa có yêu cầu nạp tiền nào
                    </td>
                  </tr>
          ) : (
                  recharges.map((recharge, index) => (
                    <tr key={recharge._id} style={{ 
                      borderBottom: '1px solid #ddd',
                      backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white'
                    }}>
                      <td style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'center' }}>
                    <input type="checkbox" />
                      </td>
                      <td style={{ padding: '0.75rem', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                        {formatDate(recharge.createdAt)}
                      </td>
                      <td style={{ padding: '0.75rem', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                        {recharge.userId?.username || 'N/A'}
                      </td>
                      <td style={{ padding: '0.75rem', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                        {(recharge.cardFee > 0 || recharge.bonusAmount > 0) ? (
                          <div>
                            {/* Show original amount with strikethrough if there's fee or bonus */}
                            <div style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.85rem' }}>
                              {recharge.originalAmount?.toLocaleString('vi-VN') || recharge.amount.toLocaleString('vi-VN')}đ
                  </div>
                            {/* Show actual amount received */}
                            <div style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                              +{recharge.amount.toLocaleString('vi-VN')}đ
                            </div>
                            {/* Show fee if exists */}
                            {recharge.cardFee > 0 && (
                              <div style={{ fontSize: '0.75rem', color: '#d32f2f' }}>
                                (-{recharge.cardFee.toLocaleString('vi-VN')}đ phí {recharge.cardFeePercent || 0}%)
                              </div>
                            )}
                            {/* Show bonus if exists */}
                            {recharge.bonusAmount > 0 && (
                              <div style={{ fontSize: '0.75rem', color: '#4CAF50' }}>
                                (+{recharge.bonusAmount.toLocaleString('vi-VN')}đ khuyến mãi {recharge.promotionPercent || 0}%)
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>{recharge.amount.toLocaleString('vi-VN')}đ</div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                  {recharge.paymentMethod === 'bank'
                    ? 'Chuyển Khoản'
                    : recharge.paymentMethod === 'momo'
                      ? 'MoMo'
                      : recharge.paymentMethod === 'card'
                        ? 'Thẻ Cào'
                      : 'Thẻ Siêu Rẻ'}
                      </td>
                      <td style={{ padding: '0.75rem', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                  <button 
                    className="btn-view-bill"
                      onClick={() => handleViewBill(recharge._id)}
                          style={{ whiteSpace: 'nowrap' }}
                  >
                    Xem Bill
                  </button>
                      </td>
                      <td style={{ padding: '0.75rem', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                  <span className={`status-badge status-${recharge.status.replace(/\s+/g, '')}`}>
                    {recharge.status}
                  </span>
                    {recharge.status === 'Từ chối' && recharge.rejectionReason && (
                      <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: '#d32f2f', fontStyle: 'italic' }}>
                        Lý do: {recharge.rejectionReason}
                      </div>
                    )}
                      </td>
                      <td style={{ padding: '0.75rem', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                  {recharge.status === 'Đang xử lí' && (
                    <>
                      <button 
                        className="btn-approve"
                        onClick={() => handleApproveRecharge(recharge._id)}
                      >
                        Duyệt
                      </button>
                      <button 
                        className="btn-reject"
                        onClick={() => handleRejectRecharge(recharge._id)}
                              style={{ marginLeft: '0.5rem' }}
                      >
                        Từ chối
                      </button>
                    </>
                  )}
                  {recharge.status === 'Hoàn thành' && (
                    <button 
                      className="btn-delete"
                      onClick={() => handleDeleteRecharge(recharge._id)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        background: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      Xóa
                    </button>
                  )}
                  {recharge.status === 'Từ chối' && (
                    <button 
                      className="btn-delete"
                      onClick={() => handleDeleteRecharge(recharge._id)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        background: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      Xóa
                    </button>
                  )}
                      </td>
                    </tr>
            ))
            )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <div className="table-info">
              Showing {recharges.length} of {rechargesTotalPages * 7} Recharges
            </div>
          </div>
          {rechargesTotalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', padding: '1rem' }}>
              <button
                onClick={() => setRechargesPage(prev => Math.max(1, prev - 1))}
                disabled={rechargesPage === 1}
                style={{
                  padding: '0.5rem 1rem',
                  background: rechargesPage === 1 ? '#ccc' : '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: rechargesPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                ← Trước
              </button>
              <span style={{ color: '#666' }}>
                Trang {rechargesPage} / {rechargesTotalPages}
              </span>
              <button
                onClick={() => setRechargesPage(prev => Math.min(rechargesTotalPages, prev + 1))}
                disabled={rechargesPage === rechargesTotalPages}
                style={{
                  padding: '0.5rem 1rem',
                  background: rechargesPage === rechargesTotalPages ? '#ccc' : '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: rechargesPage === rechargesTotalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Sau →
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="modern-table-container">
          <div className="table-header-bar">
            <div className="header-title">
              <span className="info-icon">ℹ️</span>
              <span>QUẢN LÝ ĐƠN HÀNG</span>
            </div>
          </div>

          <div className="table-controls">
            <div className="control-left">
              <input
                type="text"
                className="search-input"
                placeholder="Tìm kiếm theo mã đơn hàng hoặc tên user..."
                value={ordersSearch}
                onChange={(e) => {
                  setOrdersSearch(e.target.value);
                  setOrdersPage(1);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setOrdersPage(1);
                    setSearchNonce((n) => n + 1);
                  }
                }}
              />
              <select
                className="status-filter-select"
                value={ordersStatusFilter}
                onChange={(e) => {
                  setOrdersStatusFilter(e.target.value);
                  setOrdersPage(1);
                }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="Đang xử lí">Đang xử lí</option>
                <option value="Đang cày">Đang cày</option>
                <option value="Hoàn thành">Hoàn thành</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="control-right">
              <button
                className="btn-search"
                onClick={() => {
                  setOrdersPage(1);
                  setSearchNonce((n) => n + 1);
                }}
              >
                <span className="search-icon">🔍</span>
                Tìm kiếm
              </button>
              <button className="btn-clear-filter" onClick={() => {
                setOrdersSearch('');
                setOrdersStatusFilter('');
                setOrdersPage(1);
                setSearchNonce((n) => n + 1);
              }}>
                <span className="trash-icon">🗑️</span>
                Bỏ lọc
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              border: '1px solid #ddd',
              backgroundColor: 'white'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#2196F3', color: 'white' }}>
                  <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem', width: '50px' }}>
                <input type="checkbox" />
                  </th>
                  <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem' }}>Ngày</th>
                  <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem' }}>Mã Đơn</th>
                  <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem' }}>User</th>
                  <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem' }}>Đơn Hàng</th>
                  <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem' }}>Số Tiền</th>
                  <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem' }}>Trạng Thái</th>
                  <th style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem' }}>Hành Động</th>
                </tr>
              </thead>
              <tbody>
          {orders.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: '#999', border: '1px solid #ddd' }}>
              Chưa có đơn hàng nào
                    </td>
                  </tr>
          ) : (
                  orders.map((order, index) => (
                    <tr key={order._id} style={{ 
                      borderBottom: '1px solid #ddd',
                      backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white'
                    }}>
                      <td style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'center' }}>
                    <input type="checkbox" />
                      </td>
                      <td style={{ padding: '0.75rem', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                        {formatDate(order.createdAt)}
                      </td>
                      <td style={{ padding: '0.75rem', border: '1px solid #ddd', color: '#2196F3', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    {order._id ? order._id.toString().substring(0, 8).toUpperCase() : 'N/A'}
                      </td>
                      <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                        {order.userId?.username || 'N/A'}
                      </td>
                      <td style={{ padding: '0.75rem', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                  {order.orderType === 'service' 
                    ? `${order.serviceName} - ${order.gameName}`
                          : order.items && order.items.length > 0
                            ? order.items.map(item => `${item.game || item.name || 'N/A'}${item.name && item.game ? ` - ${item.name}` : ''}`).join(', ')
                    : 'Đơn hàng sản phẩm'
                  }
                      </td>
                      <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                        {order.totalAmount.toLocaleString('vi-VN')}đ
                      </td>
                      <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                <select 
                  value={order.status}
                  onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                  className="status-select"
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.9rem', minWidth: '150px' }}
                >
                  <option value="Đang xử lí">Đang xử lí</option>
                  <option value="Đang cày">Đang cày</option>
                  <option value="Hoàn thành">Hoàn thành</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                      </td>
                      <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button 
                    className="btn-detail"
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowOrderDetailModal(true);
                    }}
                            style={{ margin: 0, whiteSpace: 'nowrap' }}
                  >
                    Chi Tiết
                  </button>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDeleteOrder(order._id)}
                      style={{
                              padding: '0.5rem 1rem',
                        background: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                              margin: 0
                      }}
                    >
                      Xóa
                    </button>
                </div>
                      </td>
                    </tr>
            ))
            )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <div className="table-info">
              Showing {orders.length} of {stats?.totalOrders || 0} Orders
            </div>
          </div>
          {ordersTotalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', padding: '1rem' }}>
              <button
                onClick={() => setOrdersPage(prev => Math.max(1, prev - 1))}
                disabled={ordersPage === 1}
                style={{
                  padding: '0.5rem 1rem',
                  background: ordersPage === 1 ? '#ccc' : '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: ordersPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                ← Trước
              </button>
              <span style={{ color: '#666' }}>
                Trang {ordersPage} / {ordersTotalPages}
              </span>
              <button
                onClick={() => setOrdersPage(prev => Math.min(ordersTotalPages, prev + 1))}
                disabled={ordersPage === ordersTotalPages}
                style={{
                  padding: '0.5rem 1rem',
                  background: ordersPage === ordersTotalPages ? '#ccc' : '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: ordersPage === ordersTotalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Sau →
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'news' && (
        <div className="news-management">
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Danh Sách Tin Tức</h3>
            <button 
              className="btn-confirm"
              onClick={() => setShowNewsModal(true)}
              style={{ padding: '0.5rem 1rem' }}
            >
              + Thêm Tin Tức
            </button>
          </div>
          {news.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
              Chưa có tin tức nào
            </div>
          ) : (
            <div className="news-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
              {news.map(item => (
                <div key={item._id} className="profile-card" style={{ marginBottom: 0 }}>
                  {item.url && (
                    <div style={{ marginBottom: '1rem' }}>
                      {item.url.includes('youtube.com') || item.url.includes('youtu.be') ? (
                        <iframe
                          title={`Video YouTube - ${item.title || item._id || 'Tin tức'}`}
                          width="100%"
                          height="200"
                          src={item.url.includes('youtube.com/watch?v=') 
                            ? `https://www.youtube.com/embed/${item.url.split('v=')[1]?.split('&')[0]}`
                            : item.url.includes('youtu.be/')
                            ? `https://www.youtube.com/embed/${item.url.split('youtu.be/')[1]?.split('?')[0]}`
                            : item.url}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={{ borderRadius: '8px' }}
                        />
                      ) : (
                        <img 
                          src={item.url} 
                          alt={item.title}
                          style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                  )}
                  <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    {item.category || '📢 Thông Báo'}
                  </div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#333', fontSize: '1.1rem' }}>{item.title}</h4>
                  <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    {item.content.length > 150 ? item.content.substring(0, 150) + '...' : item.content}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                    <div style={{ color: '#999', fontSize: '0.85rem' }}>
                      📅 {formatDate(item.createdAt)}
                    </div>
                    <button 
                      className="btn-reject"
                      onClick={() => handleDeleteNews(item._id)}
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'blindbags' && (
        <div className="blindbag-management">
          {/* Tạo túi mù */}
          <div className="profile-card" style={{ marginBottom: '1.5rem' }}>
            <div 
              className="profile-header" 
              style={{ cursor: 'pointer' }}
              onClick={() => setShowCreateBlindBag(!showCreateBlindBag)}
            >
              <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: 0 }}>
                <span>Tạo túi mù</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', marginLeft: '1rem' }}>
                  {showCreateBlindBag ? '−' : '+'}
                </span>
              </h2>
            </div>
            <div className={`collapsible-content ${showCreateBlindBag ? 'expanded' : 'collapsed'}`}>
              <div className="profile-details">
              <div className="detail-column" style={{ maxWidth: '600px' }}>
                <div className="detail-item">
                  <label>Game:</label>
                  <input
                    type="text"
                    value={newBlindBagGame}
                    onChange={(e) => setNewBlindBagGame(e.target.value)}
                    placeholder="Tên game"
                  />
                </div>
                <div className="detail-item">
                  <label>Tỉ lệ (% ra acc xịn):</label>
                  <input
                    type="number"
                    step="0.001"
                    value={newBlindBagPremiumRate}
                    onChange={(e) => setNewBlindBagPremiumRate(e.target.value)}
                    placeholder="0.001-100"
                    min="0.001"
                    max="100"
                  />
                </div>
                <div className="detail-item">
                  <label>Image URL:</label>
                  <input
                    type="text"
                    value={newBlindBagImage}
                    onChange={(e) => setNewBlindBagImage(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="detail-item">
                  <label>Thông tin:</label>
                  <textarea
                    value={newBlindBagInfo}
                    onChange={(e) => setNewBlindBagInfo(e.target.value)}
                    placeholder="Thông tin về túi mù"
                    rows="3"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>
                <div className="detail-item">
                  <label>Giá gốc:</label>
                  <input
                    type="number"
                    value={newBlindBagOriginalPrice}
                    onChange={(e) => setNewBlindBagOriginalPrice(e.target.value)}
                    placeholder="Giá gốc"
                    min="0"
                  />
                </div>
                <div className="detail-item">
                  <label>Giá đã giảm:</label>
                  <input
                    type="number"
                    value={newBlindBagDiscountedPrice}
                    onChange={(e) => setNewBlindBagDiscountedPrice(e.target.value)}
                    placeholder="Giá đã giảm"
                    min="0"
                  />
                </div>
                <button className="btn-confirm" onClick={handleCreateBlindBag}>
                  Tạo túi mù
                </button>
              </div>
            </div>
            </div>
          </div>

          {/* Danh sách túi mù */}
          <div className="profile-card" style={{ marginBottom: '1.5rem' }}>
            <div 
              className="profile-header" 
              style={{ cursor: 'pointer' }}
              onClick={() => setShowBlindBagsList(!showBlindBagsList)}
            >
              <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: 0 }}>
                <span>Danh sách túi mù</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', marginLeft: '1rem' }}>
                  {showBlindBagsList ? '−' : '+'}
                </span>
              </h2>
            </div>
            <div className={`collapsible-content ${showBlindBagsList ? 'expanded' : 'collapsed'}`}>
            {blindBags.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
                Chưa có túi mù nào
              </div>
            ) : (
              <div className="blindbag-list">
                {blindBags.map(bag => (
                  <div key={bag._id} style={{
                  background: '#f5f5f5', 
                  padding: '1rem', 
                  marginBottom: '1rem', 
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>{bag.game}</h4>
                      {bag.info && <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>{bag.info}</p>}
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                        <span style={{ color: '#666', fontSize: '0.85rem' }}>
                          Tỉ lệ xịn: {bag.premiumRate}%
                        </span>
                        <span style={{ color: '#666', fontSize: '0.85rem' }}>
                          Còn: {bag.availableAccounts || 0} | Đã bán: {bag.soldAccounts || 0}
                        </span>
                        <span style={{ color: '#f44336', fontSize: '0.9rem', fontWeight: 'bold' }}>
                          {bag.discountedPrice?.toLocaleString('vi-VN')}₫
                          {bag.originalPrice > bag.discountedPrice && (
                            <span style={{ textDecoration: 'line-through', color: '#999', marginLeft: '0.5rem', fontSize: '0.8rem' }}>
                              {bag.originalPrice?.toLocaleString('vi-VN')}₫
                            </span>
                          )}
                        </span>
                    </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                      <button
                        className="btn-confirm"
                        onClick={() => handleEditBlindBag(bag)}
                        style={{ padding: '0.5rem 1rem' }}
                      >
                        Sửa
                      </button>
                  <button 
                    className="btn-reject"
                        onClick={() => handleDeleteBlindBag(bag._id)}
                        style={{ padding: '0.5rem 1rem' }}
                  >
                    Xóa
                  </button>
                    </div>
                </div>
              ))}
            </div>
          )}
        </div>
          </div>

          {/* Form chỉnh sửa túi mù */}
          {editingBlindBag && (
            <div className="profile-card" style={{ marginBottom: '1.5rem', background: '#fff3cd' }}>
              <div className="profile-header">
                <h2 className="section-title">Chỉnh sửa túi mù</h2>
              </div>
              <div className="profile-details">
                <div className="detail-column" style={{ maxWidth: '600px' }}>
                  <div className="detail-item">
                    <label>Game:</label>
                    <input
                      type="text"
                      value={editBlindBagGame}
                      onChange={(e) => setEditBlindBagGame(e.target.value)}
                    />
                  </div>
                  <div className="detail-item">
                    <label>Tỉ lệ (% ra acc xịn):</label>
                    <input
                      type="number"
                      step="0.001"
                      value={editBlindBagPremiumRate}
                      onChange={(e) => setEditBlindBagPremiumRate(e.target.value)}
                      min="0.001"
                      max="100"
                    />
                  </div>
                  <div className="detail-item">
                    <label>Image URL:</label>
                    <input
                      type="text"
                      value={editBlindBagImage}
                      onChange={(e) => setEditBlindBagImage(e.target.value)}
                    />
                  </div>
                  <div className="detail-item">
                    <label>Thông tin:</label>
                    <textarea
                      value={editBlindBagInfo}
                      onChange={(e) => setEditBlindBagInfo(e.target.value)}
                      rows="3"
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </div>
                  <div className="detail-item">
                    <label>Giá gốc:</label>
                    <input
                      type="number"
                      value={editBlindBagOriginalPrice}
                      onChange={(e) => setEditBlindBagOriginalPrice(e.target.value)}
                      min="0"
                    />
                  </div>
                  <div className="detail-item">
                    <label>Giá đã giảm:</label>
                    <input
                      type="number"
                      value={editBlindBagDiscountedPrice}
                      onChange={(e) => setEditBlindBagDiscountedPrice(e.target.value)}
                      min="0"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-confirm" onClick={handleUpdateBlindBag}>
                      Cập nhật
                    </button>
                    <button className="btn-cancel" onClick={() => setEditingBlindBag(null)}>
                      Hủy
                    </button>
                  </div>
                </div>
              </div>
        </div>
      )}

          {/* Đăng acc lên túi mù */}
          <div className="profile-card" style={{ marginBottom: '1.5rem' }}>
            <div 
              className="profile-header" 
              style={{ cursor: 'pointer' }}
              onClick={() => setShowAddAccountToBlindBag(!showAddAccountToBlindBag)}
            >
              <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: 0 }}>
                <span>Đăng acc lên túi mù</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', marginLeft: '1rem' }}>
                  {showAddAccountToBlindBag ? '−' : '+'}
                </span>
              </h2>
            </div>
            <div className={`collapsible-content ${showAddAccountToBlindBag ? 'expanded' : 'collapsed'}`}>
              <div className="profile-details">
              <div className="detail-column" style={{ maxWidth: '600px' }}>
                <div className="detail-item">
                  <label>Chọn túi mù:</label>
                  <select
                    value={selectedBlindBagForAccount}
                    onChange={(e) => setSelectedBlindBagForAccount(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                  >
                    <option value="">-- Chọn túi mù --</option>
                    {blindBags.map(bag => (
                      <option key={bag._id} value={bag._id}>{bag.game}</option>
                    ))}
                  </select>
                </div>
                <div className="detail-item">
                  <label style={{ color: '#666', fontSize: '0.85rem' }}>
                    ⚠️ Mã số sẽ được tự động tạo theo chữ cái đầu của tên túi mù
                  </label>
                </div>
                <div className="detail-item">
                  <label>Tài khoản:</label>
                  <input
                    type="text"
                    value={newBlindBagAccountUsername}
                    onChange={(e) => setNewBlindBagAccountUsername(e.target.value)}
                    placeholder="Username"
                  />
                </div>
                <div className="detail-item">
                  <label>Mật khẩu:</label>
                  <input
                    type="text"
                    value={newBlindBagAccountPassword}
                    onChange={(e) => setNewBlindBagAccountPassword(e.target.value)}
                    placeholder="Password"
                  />
                </div>
                <div className="detail-item">
                  <label>Loại acc:</label>
                  <select
                    value={newBlindBagAccountType}
                    onChange={(e) => setNewBlindBagAccountType(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                  >
                    <option value="thường">Thường</option>
                    <option value="xịn">Xịn</option>
                  </select>
                </div>
                <button className="btn-confirm" onClick={handleAddAccountToBlindBag}>
                  Đăng acc
                </button>
              </div>
            </div>
            </div>
          </div>

          {/* Data Table - Danh sách acc trong túi mù */}
          <div className="modern-table-container" style={{ marginTop: '1.5rem' }}>
            <div 
              className="table-header-bar"
              style={{ cursor: 'pointer' }}
              onClick={() => setShowBlindBagAccountsTable(!showBlindBagAccountsTable)}
            >
              <div className="header-title">
                <span className="info-icon">📊</span>
                <span>DANH SÁCH ACC TRONG TÚI MÙ</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', marginLeft: '1rem' }}>
                  {showBlindBagAccountsTable ? '−' : '+'}
                </span>
              </div>
            </div>

            <div className={`collapsible-content ${showBlindBagAccountsTable ? 'expanded' : 'collapsed'}`}>
            <div className="table-controls">
              <div className="control-left">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Tìm kiếm theo mã số..."
                  value={blindBagAccountsSearch}
                  onChange={(e) => setBlindBagAccountsSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setBlindBagAccountsPage(1);
                    }
                  }}
                />
                <select
                  className="status-filter-select"
                  value={blindBagAccountsBlindBagFilter}
                  onChange={(e) => {
                    setBlindBagAccountsBlindBagFilter(e.target.value);
                    setBlindBagAccountsPage(1);
                  }}
                >
                  <option value="">Tất cả túi mù</option>
                  {blindBags.map(bag => (
                    <option key={bag._id} value={bag._id}>{bag.game}</option>
                  ))}
                </select>
                <select
                  className="status-filter-select"
                  value={blindBagAccountsTypeFilter}
                  onChange={(e) => {
                    setBlindBagAccountsTypeFilter(e.target.value);
                    setBlindBagAccountsPage(1);
                  }}
                >
                  <option value="">Tất cả loại acc</option>
                  <option value="xịn">Xịn</option>
                  <option value="thường">Thường</option>
                </select>
                <select
                  className="status-filter-select"
                  value={blindBagAccountsStatusFilter}
                  onChange={(e) => {
                    setBlindBagAccountsStatusFilter(e.target.value);
                    setBlindBagAccountsPage(1);
                  }}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="chưa bán">Chưa bán</option>
                  <option value="đã bán">Đã bán</option>
                </select>
              </div>
              <div className="control-right">
                <button
                  className="btn-search"
                  onClick={() => setBlindBagAccountsPage(1)}
                >
                  <span className="search-icon">🔍</span>
                  Tìm kiếm
                </button>
                {(blindBagAccountsSearch || blindBagAccountsBlindBagFilter || blindBagAccountsTypeFilter || blindBagAccountsStatusFilter) && (
                  <button
                    className="btn-clear-filter"
                    onClick={() => {
                      setBlindBagAccountsSearch('');
                      setBlindBagAccountsBlindBagFilter('');
                      setBlindBagAccountsTypeFilter('');
                      setBlindBagAccountsStatusFilter('');
                      setBlindBagAccountsPage(1);
                    }}
                  >
                    <span className="trash-icon">🗑️</span>
                    Bỏ lọc
                  </button>
                )}
              </div>
            </div>

            <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                border: '1px solid #ddd',
                backgroundColor: 'white'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#2196F3', color: 'white' }}>
                    <th style={{ 
                      padding: '0.75rem', 
                      border: '1px solid #ddd',
                      textAlign: 'left',
                      fontWeight: 'bold',
                      fontSize: '0.9rem'
                    }}>Ngày</th>
                    <th style={{ 
                      padding: '0.75rem', 
                      border: '1px solid #ddd',
                      textAlign: 'left',
                      fontWeight: 'bold',
                      fontSize: '0.9rem'
                    }}>Mã số</th>
                    <th style={{ 
                      padding: '0.75rem', 
                      border: '1px solid #ddd',
                      textAlign: 'left',
                      fontWeight: 'bold',
                      fontSize: '0.9rem'
                    }}>Túi mù</th>
                    <th style={{ 
                      padding: '0.75rem', 
                      border: '1px solid #ddd',
                      textAlign: 'left',
                      fontWeight: 'bold',
                      fontSize: '0.9rem'
                    }}>Loại acc</th>
                    <th style={{ 
                      padding: '0.75rem', 
                      border: '1px solid #ddd',
                      textAlign: 'left',
                      fontWeight: 'bold',
                      fontSize: '0.9rem'
                    }}>Trạng thái</th>
                    <th style={{ 
                      padding: '0.75rem', 
                      border: '1px solid #ddd',
                      textAlign: 'left',
                      fontWeight: 'bold',
                      fontSize: '0.9rem'
                    }}>Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {blindBagAccounts.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ 
                        padding: '2rem', 
                        textAlign: 'center', 
                        color: '#999',
                        border: '1px solid #ddd'
                      }}>
                        Chưa có account nào
                      </td>
                    </tr>
                  ) : (
                    blindBagAccounts.map(account => (
                      <tr key={account._id} style={{ 
                        borderBottom: '1px solid #ddd',
                        backgroundColor: account._id % 2 === 0 ? '#f9f9f9' : 'white'
                      }}>
                        <td style={{ 
                          padding: '0.75rem', 
                          border: '1px solid #ddd',
                          whiteSpace: 'nowrap'
                        }}>
                          {new Date(account.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td style={{ 
                          padding: '0.75rem', 
                          border: '1px solid #ddd',
                          fontWeight: 'bold'
                        }}>
                          {account.code}
                        </td>
                        <td style={{ 
                          padding: '0.75rem', 
                          border: '1px solid #ddd'
                        }}>
                          {account.blindBagId?.game || 'N/A'}
                        </td>
                        <td style={{ 
                          padding: '0.75rem', 
                          border: '1px solid #ddd'
                        }}>
                          <span className={`status-badge-modern ${account.accountType === 'xịn' ? 'status-Hoànthành' : 'status-Đangxửlí'}`}>
                            {account.accountType === 'xịn' ? '⭐ Xịn' : '📦 Thường'}
                          </span>
                        </td>
                        <td style={{ 
                          padding: '0.75rem', 
                          border: '1px solid #ddd'
                        }}>
                          <span className={`status-badge-modern ${account.status === 'đã bán' ? 'status-Hoànthành' : 'status-Đangxửlí'}`}>
                            {account.status === 'đã bán' ? '✅ Đã bán' : '⏳ Chưa bán'}
                          </span>
                        </td>
                        <td style={{ 
                          padding: '0.75rem', 
                          border: '1px solid #ddd'
                        }}>
                          <button
                            className="btn-confirm"
                            onClick={() => handleViewBlindBagAccountDetail(account._id)}
                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                          >
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {blindBagAccountsTotalPages > 1 && (
              <div className="table-footer">
                <div className="table-info">
                  Trang {blindBagAccountsPage} / {blindBagAccountsTotalPages}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setBlindBagAccountsPage(prev => Math.max(1, prev - 1))}
                    disabled={blindBagAccountsPage === 1}
                    className="page-btn"
                  >
                    ← Trước
                  </button>
                  <button
                    onClick={() => setBlindBagAccountsPage(prev => Math.min(blindBagAccountsTotalPages, prev + 1))}
                    disabled={blindBagAccountsPage === blindBagAccountsTotalPages}
                    className="page-btn"
                  >
                    Sau →
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}
        </div>
      </div>

      {showAddBalanceModal && (
        <div className="modal-overlay" onClick={() => setShowAddBalanceModal(false)} style={{ zIndex: 2000 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Cộng Tiền Cho User</h2>
            <p><strong>User:</strong> {selectedUser?.username}</p>
            <p><strong>Số dư hiện tại:</strong> {selectedUser?.balance?.toLocaleString('vi-VN') || '0'}đ</p>
            <div className="form-group">
              <label>Số tiền (+ thêm / - trừ):</label>
              <input
                type="number"
                value={addBalanceAmount}
                onChange={(e) => setAddBalanceAmount(e.target.value)}
                placeholder="Nhập số tiền"
                min="1"
              />
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className={balanceMode === 'add' ? 'btn-confirm' : 'btn-cancel'}
                  onClick={() => setBalanceMode('add')}
                  style={{ padding: '0.4rem 0.8rem' }}
                >
                  + Cộng
                </button>
                <button
                  type="button"
                  className={balanceMode === 'subtract' ? 'btn-confirm' : 'btn-cancel'}
                  onClick={() => setBalanceMode('subtract')}
                  style={{ padding: '0.4rem 0.8rem' }}
                >
                  - Trừ
                </button>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={handleAddBalance} className="btn-confirm">Xác Nhận</button>
              <button onClick={() => setShowAddBalanceModal(false)} className="btn-cancel">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {showBillModal && (
        <div className="modal-overlay" onClick={() => {
          setShowBillModal(false);
          setLoadingBill(false);
        }}>
          <div className="modal-content modal-bill" onClick={(e) => e.stopPropagation()}>
            <h2>Hình Bill</h2>
            {loadingBill ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>⏳ Đang tải hình bill...</div>
                <div style={{ fontSize: '0.9rem', color: '#999' }}>Vui lòng đợi trong giây lát</div>
              </div>
            ) : selectedBill ? (
              <img 
                src={selectedBill} 
                alt="Bill" 
                style={{ maxWidth: '100%', maxHeight: '70vh', marginTop: '1rem', display: 'block', margin: '1rem auto' }}
                onLoad={() => setLoadingBill(false)}
                onError={() => {
                  alert('Không thể hiển thị hình bill');
                  setShowBillModal(false);
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
                Không có hình bill
              </div>
            )}
            <div className="modal-actions">
              <button onClick={() => {
                setShowBillModal(false);
                setLoadingBill(false);
              }} className="btn-cancel">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {showCardInfoModal && selectedCardInfo && (
        <div className="modal-overlay" onClick={() => setShowCardInfoModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h2>Thông Tin Thẻ Cào</h2>
            <div style={{ marginTop: '1.5rem', lineHeight: '2' }}>
              <p><strong>Loại thẻ:</strong> {selectedCardInfo.cardType}</p>
              <p><strong>Mã:</strong> {selectedCardInfo.cardCode}</p>
              <p><strong>Serial:</strong> {selectedCardInfo.cardSerial}</p>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowCardInfoModal(false)} className="btn-cancel">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {showCardFeeModal && selectedRechargeForFee && (
        <div className="modal-overlay" onClick={() => {
          setShowCardFeeModal(false);
          setSelectedRechargeForFee(null);
          setCardFeePercent('');
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h2>Nhập Phí Thẻ Cào</h2>
            <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
              <p><strong>Số tiền nạp:</strong> {selectedRechargeForFee.originalAmount?.toLocaleString('vi-VN') || selectedRechargeForFee.amount.toLocaleString('vi-VN')}đ</p>
            </div>
            <div className="form-group">
              <label>Phí thẻ cào (%):</label>
              <input
                type="number"
                value={cardFeePercent}
                onChange={(e) => setCardFeePercent(e.target.value)}
                placeholder="Nhập % phí (ví dụ: 20)"
                min="0"
                max="100"
                step="0.1"
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem' }}
              />
            </div>
            {cardFeePercent && !isNaN(parseFloat(cardFeePercent)) && parseFloat(cardFeePercent) >= 0 && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '1rem', 
                background: '#f5f5f5', 
                borderRadius: '8px',
                border: '1px solid #ddd'
              }}>
                <p style={{ margin: '0 0 0.5rem 0', color: '#666' }}><strong>Kết quả:</strong></p>
                <p style={{ margin: '0.25rem 0', color: '#333' }}>
                  Số tiền nạp: <span style={{ textDecoration: 'line-through', color: '#999' }}>
                    {selectedRechargeForFee.originalAmount?.toLocaleString('vi-VN') || selectedRechargeForFee.amount.toLocaleString('vi-VN')}đ
                  </span>
                </p>
                <p style={{ margin: '0.25rem 0', color: '#d32f2f' }}>
                  Phí ({parseFloat(cardFeePercent)}%): -{Math.floor((selectedRechargeForFee.originalAmount || selectedRechargeForFee.amount) * parseFloat(cardFeePercent) / 100).toLocaleString('vi-VN')}đ
                </p>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.1rem', fontWeight: 'bold', color: '#4CAF50' }}>
                  Số tiền nhận được: {((selectedRechargeForFee.originalAmount || selectedRechargeForFee.amount) - Math.floor((selectedRechargeForFee.originalAmount || selectedRechargeForFee.amount) * parseFloat(cardFeePercent) / 100)).toLocaleString('vi-VN')}đ
                </p>
              </div>
            )}
            <div className="modal-actions">
              <button 
                onClick={async () => {
                  if (!cardFeePercent || isNaN(parseFloat(cardFeePercent)) || parseFloat(cardFeePercent) < 0) {
                    alert('Vui lòng nhập phí hợp lệ');
                    return;
                  }
                  await approveRechargeDirectly(selectedRechargeForFee._id, cardFeePercent);
                }} 
                className="btn-confirm"
              >
                Duyệt
              </button>
              <button onClick={() => {
                setShowCardFeeModal(false);
                setSelectedRechargeForFee(null);
                setCardFeePercent('');
              }} className="btn-cancel">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {showOrderDetailModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowOrderDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h2>Chi Tiết Đơn Hàng</h2>
            <div style={{ marginTop: '1rem', lineHeight: '1.8' }}>
              <p><strong>User:</strong> {selectedOrder.userId?.username || 'N/A'}</p>
              <p><strong>Ngày tạo:</strong> {formatDate(selectedOrder.createdAt)}</p>
              <p><strong>Loại đơn:</strong> {selectedOrder.orderType === 'service' ? 'Dịch vụ' : 'Sản phẩm'}</p>
              <p><strong>Tổng tiền:</strong> {selectedOrder.totalAmount.toLocaleString('vi-VN')}đ</p>
              <p><strong>Trạng thái:</strong> {selectedOrder.status}</p>
              
              {selectedOrder.orderType === 'service' && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
                  <p><strong>Tên game:</strong> {selectedOrder.gameName || 'N/A'}</p>
                  <p><strong>Dịch vụ:</strong> {selectedOrder.serviceName || 'N/A'}</p>
                  {selectedOrder.serviceCategory && <p><strong>Loại dịch vụ:</strong> {selectedOrder.serviceCategory}</p>}
                  {selectedOrder.robloxUsername && <p><strong>Tên đăng nhập Roblox:</strong> {selectedOrder.robloxUsername}</p>}
                  {selectedOrder.robloxPassword && <p><strong>Mật khẩu đăng nhập Roblox:</strong> {selectedOrder.robloxPassword}</p>}
                  {selectedOrder.backupCode && <p><strong>Backup Code:</strong> {selectedOrder.backupCode}</p>}
                  {selectedOrder.notes && <p><strong>Ghi chú đơn hàng:</strong> {selectedOrder.notes}</p>}
                </div>
              )}
              
              {selectedOrder.orderType === 'product' && selectedOrder.items && selectedOrder.items.length > 0 && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
                  <p><strong>Sản phẩm:</strong></p>
                  <ul>
                    {selectedOrder.items.map((item, idx) => (
                      <li key={idx}>{item.name} - Số lượng: {item.quantity} - Giá: {item.price?.toLocaleString('vi-VN') || '0'}đ</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowOrderDetailModal(false)} className="btn-cancel">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {showNewsModal && (
        <div className="modal-overlay" onClick={() => setShowNewsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h2>Thêm Tin Tức</h2>
            <div className="form-group">
              <label>Tiêu đề:</label>
              <input
                type="text"
                value={newsTitle}
                onChange={(e) => setNewsTitle(e.target.value)}
                placeholder="Nhập tiêu đề"
              />
            </div>
            <div className="form-group">
              <label>URL: hiện ảnh hoặc video ví dụ như video từ link youtube</label>
              <input
                type="text"
                value={newsUrl}
                onChange={(e) => setNewsUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... hoặc https://example.com/image.jpg"
              />
            </div>
            <div className="form-group">
              <label>Nội dung:</label>
              <textarea
                value={newsContent}
                onChange={(e) => setNewsContent(e.target.value)}
                placeholder="Nhập nội dung"
                style={{ width: '100%', minHeight: '150px', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '6px', fontFamily: 'inherit', fontSize: '1rem', boxSizing: 'border-box' }}
              />
            </div>
            <div className="form-group">
              <label>Danh mục:</label>
              <select
                value={newsCategory}
                onChange={(e) => setNewsCategory(e.target.value)}
                style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem' }}
              >
                <option value="📢 Thông Báo">📢 Thông Báo</option>
                <option value="🎁 Khuyến Mãi">🎁 Khuyến Mãi</option>
                <option value="📚 Hướng Dẫn">📚 Hướng Dẫn</option>
              </select>
            </div>
            <div className="modal-actions">
              <button onClick={handleCreateNews} className="btn-confirm">Tạo Tin Tức</button>
              <button onClick={() => {
                setShowNewsModal(false);
                setNewsTitle('');
                setNewsContent('');
                setNewsCategory('📢 Thông Báo');
                setNewsUrl('');
              }} className="btn-cancel">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {showUserDetailModal && userDetails && (
        <div className="modal-overlay" onClick={() => setShowUserDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2>Chi Tiết User</h2>
            
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px', marginBottom: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <strong>Username:</strong> {userDetails.username}
                </div>
                <div>
                  <strong>Email:</strong> {formatEmailForDisplay(userDetails.email, userDetails.role)}
                </div>
                <div>
                  <strong>Số dư:</strong> {userDetails.balance?.toLocaleString('vi-VN') || '0'} đ
                </div>
                <div>
                  <strong>Giảm giá:</strong> {userDetails.discount > 0 ? `${userDetails.discount}%` : 'Không có'}
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: '0.5rem' }}
                   onClick={() => setShowOrdersSection(!showOrdersSection)}>
                <h3 style={{ margin: 0 }}>📋 Lịch Sử Đơn Hàng ({userDetails.orders.length})</h3>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{showOrdersSection ? '−' : '+'}</span>
              </div>
              {showOrdersSection && (
                <>
              {userDetails.orders.length === 0 ? (
                <p style={{ color: '#999', padding: '1rem' }}>Chưa có đơn hàng nào</p>
              ) : (
                    <>
                      <div style={{ marginTop: '0.5rem', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', maxHeight: '400px', overflowY: 'auto' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1.5fr', background: '#f5f5f5', padding: '0.8rem', fontWeight: 'bold', borderBottom: '1px solid #ddd', position: 'sticky', top: 0, zIndex: 10 }}>
                    <div>Ngày</div>
                    <div>Đơn Hàng</div>
                    <div>Số Tiền</div>
                    <div>Trạng Thái</div>
                  </div>
                        {userDetails.orders.slice(0, ordersDisplayLimit).map(order => (
                    <div key={order._id} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1.5fr', padding: '0.8rem', borderBottom: '1px solid #eee' }}>
                      <div>{formatDate(order.createdAt)}</div>
                      <div>{order.orderType === 'service' ? `${order.serviceName} - ${order.gameName}` : 'Đơn hàng sản phẩm'}</div>
                      <div>
                        {order.discountAmount > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.85rem' }}>
                              {order.originalAmount?.toLocaleString('vi-VN') || order.totalAmount?.toLocaleString('vi-VN') || '0'}đ
                            </span>
                            <span style={{ color: '#000', fontWeight: 'bold' }}>
                              {order.totalAmount?.toLocaleString('vi-VN') || '0'}đ
                            </span>
                            <span style={{ color: '#4CAF50', fontSize: '0.8rem' }}>
                              (Giảm {order.discount}%)
                            </span>
                          </div>
                        ) : (
                          <span>{order.totalAmount?.toLocaleString('vi-VN') || '0'}đ</span>
                        )}
                      </div>
                      <div>{order.status}</div>
                    </div>
                  ))}
                </div>
                      {userDetails.orders.length > ordersDisplayLimit && (
                        <button
                          onClick={() => setOrdersDisplayLimit(userDetails.orders.length)}
                          style={{
                            marginTop: '0.5rem',
                            padding: '0.5rem 1rem',
                            background: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                          }}
                        >
                          Xem thêm ({userDetails.orders.length - ordersDisplayLimit} đơn hàng)
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            <div style={{ marginTop: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: '0.5rem' }}
                   onClick={() => setShowRechargesSection(!showRechargesSection)}>
                <h3 style={{ margin: 0 }}>💰 Lịch Sử Nạp Tiền ({userDetails.recharges.length})</h3>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{showRechargesSection ? '−' : '+'}</span>
              </div>
              {showRechargesSection && (
                <>
              {userDetails.recharges.length === 0 ? (
                <p style={{ color: '#999', padding: '1rem' }}>Chưa có lịch sử nạp tiền nào</p>
              ) : (
                    <>
                      <div style={{ marginTop: '0.5rem', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', maxHeight: '400px', overflowY: 'auto' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.5fr', background: '#f5f5f5', padding: '0.8rem', fontWeight: 'bold', borderBottom: '1px solid #ddd', position: 'sticky', top: 0, zIndex: 10 }}>
                    <div>Ngày</div>
                    <div>Số Tiền</div>
                    <div>Phương Thức</div>
                    <div>Trạng Thái</div>
                  </div>
                        {userDetails.recharges.slice(0, rechargesDisplayLimit).map(recharge => (
                    <div key={recharge._id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.5fr', padding: '0.8rem', borderBottom: '1px solid #eee' }}>
                      <div>{formatDate(recharge.createdAt)}</div>
                            <div>
                              {recharge.status === 'Hoàn thành' && (recharge.cardFee > 0 || recharge.bonusAmount > 0) ? (
                                <div>
                                  {(recharge.cardFee > 0 || recharge.bonusAmount > 0) && (
                                    <div style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.85rem' }}>
                                      {recharge.originalAmount?.toLocaleString('vi-VN') || recharge.amount?.toLocaleString('vi-VN') || '0'}đ
                                    </div>
                                  )}
                                  <div style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                                    +{recharge.amount?.toLocaleString('vi-VN') || '0'}đ
                                  </div>
                                  {recharge.cardFee > 0 && (
                                    <div style={{ fontSize: '0.75rem', color: '#d32f2f' }}>
                                      (-{recharge.cardFee?.toLocaleString('vi-VN') || '0'}đ phí {recharge.cardFeePercent || 0}%)
                                    </div>
                                  )}
                                  {recharge.bonusAmount > 0 && (
                                    <div style={{ fontSize: '0.75rem', color: '#4CAF50' }}>
                                      (+{recharge.bonusAmount?.toLocaleString('vi-VN') || '0'}đ khuyến mãi {recharge.promotionPercent || 0}%)
                                    </div>
                                  )}
                                </div>
                              ) : (
                      <div>{recharge.amount?.toLocaleString('vi-VN') || '0'}đ</div>
                              )}
                            </div>
                      <div>
                        {recharge.paymentMethod === 'bank'
                          ? 'Chuyển Khoản'
                          : recharge.paymentMethod === 'momo'
                            ? 'MoMo'
                                  : recharge.paymentMethod === 'card'
                                    ? 'Thẻ Cào'
                            : 'Thẻ Siêu Rẻ'}
                      </div>
                      <div>{recharge.status}</div>
                    </div>
                  ))}
                </div>
                      {userDetails.recharges.length > rechargesDisplayLimit && (
                        <button
                          onClick={() => setRechargesDisplayLimit(userDetails.recharges.length)}
                          style={{
                            marginTop: '0.5rem',
                            padding: '0.5rem 1rem',
                            background: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                          }}
                        >
                          Xem thêm ({userDetails.recharges.length - rechargesDisplayLimit} giao dịch)
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: '2rem', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => {
                    if (userDetails && userDetails._id) {
                      setSelectedUser(userDetails);
                      setBalanceMode('add');
                      setAddBalanceAmount('');
                      setShowUserDetailModal(false);
                      setShowAddBalanceModal(true);
                    } else {
                      alert('Không tìm thấy thông tin user');
                    }
                  }}
                  className="btn-confirm"
                  style={{ backgroundColor: '#1976D2' }}
                >
                  ± Tiền
                </button>
                <button 
                  onClick={() => {
                    if (userDetails && userDetails._id) {
                      handleAddVoucher(userDetails);
                    } else {
                      alert('Không tìm thấy thông tin user');
                    }
                  }}
                  className="btn-confirm"
                >
                  Thêm Voucher
                </button>
                <button 
                  onClick={() => {
                    if (userDetails && userDetails._id) {
                      handleDeleteUser(userDetails._id);
                      setShowUserDetailModal(false);
                    } else {
                      alert('Không tìm thấy thông tin user');
                    }
                  }}
                  className="btn-reject"
                >
                  Xóa User
                </button>
              </div>
              <button onClick={() => setShowUserDetailModal(false)} className="btn-cancel">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {showVoucherModal && selectedUserForVoucher && (
        <div className="modal-overlay" onClick={() => setShowVoucherModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h2>Thêm Voucher Giảm Giá</h2>
            <p><strong>User:</strong> {selectedUserForVoucher.username}</p>
            <p><strong>Voucher hiện tại:</strong> {selectedUserForVoucher.discount || 0}%</p>
            <div className="form-group">
              <label>Giảm giá (%):</label>
              <input
                type="number"
                value={voucherDiscount}
                onChange={(e) => setVoucherDiscount(e.target.value)}
                placeholder="Nhập % giảm giá (0-100, 0 để xóa voucher)"
                min="0"
                max="100"
              />
              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                Nhập 0 để xóa voucher
              </p>
            </div>
            <div className="modal-actions">
              <button onClick={confirmAddVoucher} className="btn-confirm">Xác Nhận</button>
              <button onClick={() => {
                setShowVoucherModal(false);
                setSelectedUserForVoucher(null);
                setVoucherDiscount('');
              }} className="btn-cancel">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h2>Từ Chối Nạp Tiền</h2>
            <p style={{ marginBottom: '1rem', color: '#666' }}>Vui lòng nhập lý do từ chối:</p>
            <div className="form-group">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Nhập lý do từ chối..."
                rows="4"
                style={{ width: '100%', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>
            <div className="modal-actions">
              <button onClick={confirmRejectRecharge} className="btn-reject">Xác Nhận Từ Chối</button>
              <button onClick={() => {
                setShowRejectModal(false);
                setSelectedRechargeId(null);
                setRejectionReason('');
              }} className="btn-cancel">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {showBlindBagAccountDetailModal && selectedBlindBagAccount && (
        <div className="modal-overlay" onClick={() => {
          setShowBlindBagAccountDetailModal(false);
          setSelectedBlindBagAccount(null);
        }} style={{ zIndex: 2000 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Account - {selectedBlindBagAccount.code}</h2>
              <button className="modal-close" onClick={() => {
                setShowBlindBagAccountDetailModal(false);
                setSelectedBlindBagAccount(null);
              }}>×</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Ngày tạo:</label>
                  <div style={{ color: '#333' }}>{selectedBlindBagAccount.createdAt ? new Date(selectedBlindBagAccount.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</div>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Mã số:</label>
                  <div style={{ color: '#333', fontWeight: 'bold' }}>{selectedBlindBagAccount.code || 'N/A'}</div>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Túi mù:</label>
                  <div style={{ color: '#333' }}>{selectedBlindBagAccount.blindBagId?.game || 'N/A'}</div>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#666', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Trạng thái:</label>
                  <div style={{ color: '#333' }}>
                    {selectedBlindBagAccount.status === 'đã bán' ? '✅ Đã bán' : '⏳ Chưa bán'}
                  </div>
                </div>
                {selectedBlindBagAccount.buyerId && (
                  <>
                    <div>
                      <label style={{ display: 'block', color: '#666', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Người mua:</label>
                      <div style={{ color: '#333' }}>{selectedBlindBagAccount.buyerId?.username || 'N/A'}</div>
                    </div>
                    {selectedBlindBagAccount.soldAt && (
                      <div>
                        <label style={{ display: 'block', color: '#666', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Ngày bán:</label>
                        <div style={{ color: '#333' }}>{new Date(selectedBlindBagAccount.soldAt).toLocaleDateString('vi-VN')}</div>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {selectedBlindBagAccount.status !== 'đã bán' && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.9rem' }}>Tài khoản:</label>
                    <input 
                      type="text" 
                      value={editBlindBagAccountUsername} 
                      onChange={(e) => setEditBlindBagAccountUsername(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.9rem' }}>Mật khẩu:</label>
                    <input 
                      type="text" 
                      value={editBlindBagAccountPassword} 
                      onChange={(e) => setEditBlindBagAccountPassword(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.9rem' }}>Loại acc:</label>
                    <select
                      value={editBlindBagAccountType}
                      onChange={(e) => setEditBlindBagAccountType(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', fontSize: '0.9rem' }}
                    >
                      <option value="thường">Thường</option>
                      <option value="xịn">Xịn</option>
                    </select>
                  </div>
                </div>
              )}
              {selectedBlindBagAccount.status === 'đã bán' && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.9rem' }}>Tài khoản:</label>
                    <input 
                      type="text" 
                      value={editBlindBagAccountUsername} 
                      disabled
                      style={{ width: '100%', padding: '0.5rem', fontSize: '0.9rem', backgroundColor: '#f5f5f5', color: '#666' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.9rem' }}>Mật khẩu:</label>
                    <input 
                      type="text" 
                      value={editBlindBagAccountPassword} 
                      disabled
                      style={{ width: '100%', padding: '0.5rem', fontSize: '0.9rem', backgroundColor: '#f5f5f5', color: '#666' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.9rem' }}>Loại acc:</label>
                    <input 
                      type="text" 
                      value={editBlindBagAccountType === 'xịn' ? '⭐ Xịn' : '📦 Thường'} 
                      disabled
                      style={{ width: '100%', padding: '0.5rem', fontSize: '0.9rem', backgroundColor: '#f5f5f5', color: '#666' }}
                    />
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#f44336', fontStyle: 'italic', marginTop: '0.5rem' }}>
                    ⚠️ Account đã bán không thể chỉnh sửa. Chỉ có thể xóa.
                  </p>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
              {selectedBlindBagAccount.status === 'đã bán' && (
                <button 
                  onClick={handleDeleteBlindBagAccount}
                  className="btn-reject"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                >
                  Xóa
                </button>
              )}
              {selectedBlindBagAccount.status !== 'đã bán' && (
                <button 
                  onClick={handleUpdateBlindBagAccount}
                  className="btn-confirm"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                >
                  Cập nhật
                </button>
              )}
              <button 
                onClick={() => {
                  setShowBlindBagAccountDetailModal(false);
                  setSelectedBlindBagAccount(null);
                }} 
                className="btn-cancel"
                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;

