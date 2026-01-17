const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validateObjectId } = require('../utils/validation');
const { getJWTSecret } = require('../utils/auth');
const Order = require('../models/Order');
const Recharge = require('../models/Recharge');
const Settings = require('../models/Settings');
const BalanceHistory = require('../models/BalanceHistory');
const Announcement = require('../models/Announcement');
const Pricing = require('../models/Pricing');
const Voucher = require('../models/Voucher');
const Account = require('../models/Account');
const Game = require('../models/Game');
const defaultCayThuePricing = require('../data/defaultCayThuePricing');
const mongoose = require('mongoose');

// Middleware to verify admin
const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token không tồn tại' });
  }

  try {
    const decoded = jwt.verify(token, getJWTSecret());
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }
    req.userId = decoded.userId;
    req.admin = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token không hợp lệ' });
  }
};

// Get all users with pagination and search
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 7;
    const skip = (page - 1) * limit;
    const search = (req.query.search || '').trim();

    const query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(query)
    ]);

    res.json({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user by ID
router.get('/users/:id', authenticateAdmin, async (req, res) => {
  try {
    // Validate ObjectId
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user orders and recharges (optimized with limits)
router.get('/users/:id/details', authenticateAdmin, async (req, res) => {
  try {
    // Validate ObjectId
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    const userId = req.params.id;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Limit to last 50 orders and 50 recharges for performance
    // Include deleted recharges in user detail view (for history)
    const [orders, recharges] = await Promise.all([
      Order.find({ userId }).sort({ createdAt: -1 }).limit(50).lean(),
      Recharge.find({ userId }).select('-billImage').sort({ createdAt: -1 }).limit(50).lean()
    ]);
    res.json({ 
      _id: user._id,
      username: user.username,
      email: user.email,
      balance: user.balance,
      discount: user.discount || 0,
      orders, 
      recharges 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add balance to user
router.post('/users/:id/add-balance', authenticateAdmin, async (req, res) => {
  try {
    const { amount } = req.body;
    const delta = Number(amount);

    if (!Number.isFinite(delta) || delta === 0) {
      return res.status(400).json({ message: 'Số tiền không hợp lệ' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const initialBalance = user.balance || 0;
    const newBalance = initialBalance + delta;
    if (newBalance < 0) {
      return res.status(400).json({ message: 'Số dư không được âm' });
    }

    user.balance = newBalance;
    await user.save();

    // Create balance history
    await BalanceHistory.create({
      userId: user._id,
      initialBalance,
      changeAmount: delta,
      currentBalance: newBalance,
      reason: delta > 0 ? `Admin cộng tiền: +${delta.toLocaleString('vi-VN')}đ` : `Admin trừ tiền: ${delta.toLocaleString('vi-VN')}đ`
    });

    res.json({
      message: 'Cập nhật số dư thành công',
      user: {
        id: user._id,
        username: user.username,
        balance: user.balance
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add/Update/Remove voucher/discount for user
router.post('/users/:id/voucher', authenticateAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { discount } = req.body;

    if (discount === undefined || discount < 0 || discount > 100) {
      return res.status(400).json({ message: 'Giảm giá phải từ 0 đến 100' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.discount = discount;
    await user.save();

    res.json({
      message: 'Cập nhật voucher thành công',
      user: {
        id: user._id,
        username: user.username,
        discount: user.discount
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete user and related data
router.delete('/users/:id', authenticateAdmin, async (req, res) => {
  try {
    // Validate ObjectId
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    const userId = req.params.id;
    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await Promise.all([
      Order.deleteMany({ userId }),
      Recharge.deleteMany({ userId })
    ]);

    res.json({ message: 'Đã xóa user và dữ liệu liên quan', userId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all orders with pagination, search and filter
router.get('/orders', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 7;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const statusFilter = req.query.status || '';

    const query = {
      orderType: { $ne: 'account' } // Exclude account orders
    };
    if (statusFilter) {
      query.status = statusFilter;
    }
    
    // For search, we need to find users first if searching by username
    let userIds = [];
    if (search) {
      // Try to match order ID (allow searching by full ObjectId or by the first 8 chars shown in UI)
      const trimmed = String(search).trim();
      const isHex = /^[a-f0-9]+$/i.test(trimmed);
      if (isHex && trimmed.length === 24 && mongoose.Types.ObjectId.isValid(trimmed)) {
        query._id = new mongoose.Types.ObjectId(trimmed);
      } else if (isHex && trimmed.length >= 6) {
        // substring match on ObjectId string using $expr
        query.$expr = {
          $regexMatch: {
            input: { $toString: '$_id' },
            regex: trimmed,
            options: 'i'
          }
        };
      } else {
        // Search by username
        const users = await User.find({
          $or: [
            { username: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }).select('_id');
        userIds = users.map(u => u._id);
        if (userIds.length > 0) {
          query.userId = { $in: userIds };
        } else {
          // No users found, return empty result
          query._id = null;
        }
      }
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('userId', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query)
    ]);

    res.json({
      orders,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update order status
router.put('/orders/:id', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete completed order
router.delete('/orders/:id', authenticateAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.status !== 'Hoàn thành') {
      return res.status(400).json({ message: 'Chỉ có thể xóa đơn hàng đã hoàn thành' });
    }
    
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa đơn hàng thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get statistics
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    const settings = await Settings.getSettings();
    const totalRevenue = settings.totalRevenue || 0;
    
    res.json({
      totalUsers,
      totalOrders,
      totalRevenue,
      rechargePromotionPercent: settings.rechargePromotionPercent || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get revenue statistics (detailed)
router.get('/revenue-stats', authenticateAdmin, async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

    // Start of week: Monday 00:00 (Vietnam admins usually expect Monday start)
    const weekDay = todayStart.getDay(); // 0 Sun .. 6 Sat
    const diffToMonday = (weekDay + 6) % 7; // Monday => 0, Sunday => 6
    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - diffToMonday);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonthLabel = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const lastMonthLabel = `${String(lastMonthStart.getMonth() + 1).padStart(2, '0')}/${lastMonthStart.getFullYear()}`;
    const todayLabel = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    const dateExpr = { $ifNull: ['$processedAt', '$createdAt'] };

    // Load settings to see if there is a reset point
    const settings = await Settings.getSettings();
    const resetAt = settings.revenueResetAt || null;

    const sumRecharge = async (start, end) => {
      const match = {
        status: 'Hoàn thành',
        $expr: {
          $and: [
            { $gte: [dateExpr, resetAt || start] },
            { $lt: [dateExpr, end] }
          ]
        }
      };
      const rows = await Recharge.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      return rows?.[0]?.total || 0;
    };

    const matchBase = {
      status: 'Hoàn thành',
      $expr: resetAt
        ? { $gte: [dateExpr, resetAt] }
        : { $gte: [dateExpr, new Date(0)] }
    };

    const [totalOrders, ordersToday, ordersYesterday, accountsToday, accountsYesterday] = await Promise.all([
      Order.countDocuments({ orderType: { $ne: 'account' }, ...(resetAt ? { createdAt: { $gte: resetAt } } : {}) }),
      Order.countDocuments({ orderType: { $ne: 'account' }, createdAt: { $gte: todayStart, $lt: tomorrowStart } }),
      Order.countDocuments({ orderType: { $ne: 'account' }, createdAt: { $gte: yesterdayStart, $lt: todayStart } }),
      // Count accounts sold today (respecting resetAt)
      Order.countDocuments({ 
        orderType: 'account', 
        status: 'Hoàn thành',
        createdAt: { 
          $gte: resetAt && resetAt > todayStart ? resetAt : todayStart, 
          $lt: tomorrowStart 
        } 
      }),
      // Count accounts sold yesterday (respecting resetAt)
      Order.countDocuments({ 
        orderType: 'account', 
        status: 'Hoàn thành',
        createdAt: { 
          $gte: resetAt && resetAt > yesterdayStart ? resetAt : yesterdayStart, 
          $lt: todayStart 
        } 
      })
    ]);

    // Calculate account revenue helper function (respecting resetAt)
    const sumAccountRevenue = async (start, end) => {
      const match = {
        orderType: 'account',
        status: 'Hoàn thành',
        createdAt: { 
          $gte: resetAt && resetAt > start ? resetAt : start, 
          $lt: end 
        }
      };
      const rows = await Order.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      return rows?.[0]?.total || 0;
    };

    // Calculate total revenue from recharges (respecting resetAt)
    const [totalRevenueAgg] = await Recharge.aggregate([
      { $match: matchBase },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const rechargeRevenue = totalRevenueAgg?.total || 0;
    
    // Calculate total account revenue (all time, respecting resetAt)
    const accountMatchBase = {
      orderType: 'account',
      status: 'Hoàn thành',
      ...(resetAt ? { createdAt: { $gte: resetAt } } : {})
    };
    const [totalAccountRevenueAgg] = await Order.aggregate([
      { $match: accountMatchBase },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const accountRevenue = totalAccountRevenueAgg?.total || 0;
    
    // Total revenue includes both recharge and account revenue
    const totalRevenue = rechargeRevenue + accountRevenue;

    const [rechargeToday, rechargeYesterday, rechargeThisWeek, rechargeThisMonth, rechargeLastMonth, accountRevenueToday, accountRevenueYesterday] = await Promise.all([
      sumRecharge(todayStart, tomorrowStart),
      sumRecharge(yesterdayStart, todayStart),
      sumRecharge(weekStart, tomorrowStart),
      sumRecharge(monthStart, nextMonthStart),
      sumRecharge(lastMonthStart, monthStart),
      sumAccountRevenue(todayStart, tomorrowStart),
      sumAccountRevenue(yesterdayStart, todayStart)
    ]);

    // Combine recharge and account revenue for total calculations
    const revenueToday = rechargeToday + accountRevenueToday;
    const revenueYesterday = rechargeYesterday + accountRevenueYesterday;
    // For week/month, we only have recharge data, so use recharge only
    const revenueThisWeek = rechargeThisWeek;
    const revenueThisMonth = rechargeThisMonth;
    const revenueLastMonth = rechargeLastMonth;

    // Profit = revenue for now (no costs model)
    res.json({
      totalOrders,
      totalRevenue,
      ordersToday,
      ordersYesterday,
      accountsToday,
      accountsYesterday,
      accountRevenueToday,
      accountRevenueYesterday,
      revenueToday,
      revenueYesterday,
      revenueThisWeek,
      revenueThisMonth,
      revenueLastMonth,
      totalProfit: totalRevenue,
      profitToday: revenueToday,
      profitTodayDate: todayLabel,
      profitThisMonth: revenueThisMonth,
      profitThisMonthDate: thisMonthLabel,
      profitLastMonth: revenueLastMonth,
      profitLastMonthDate: lastMonthLabel
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reset revenue statistics (set new baseline)
router.post('/revenue-stats/reset', authenticateAdmin, async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    settings.revenueResetAt = new Date();
    settings.updatedAt = new Date();
    await settings.save();
    res.json({ message: 'Đã reset mốc tính doanh thu', revenueResetAt: settings.revenueResetAt });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update recharge promotion percent
router.put('/settings/recharge-promotion', authenticateAdmin, async (req, res) => {
  try {
    const { promotionPercent } = req.body;
    const percent = parseFloat(promotionPercent);
    
    if (isNaN(percent) || percent < 0 || percent > 100) {
      return res.status(400).json({ message: 'Phần trăm khuyến mãi phải từ 0 đến 100' });
    }

    const settings = await Settings.getSettings();
    settings.rechargePromotionPercent = percent;
    settings.updatedAt = new Date();
    await settings.save();
    
    res.json({ 
      message: 'Đã cập nhật khuyến mãi nạp tiền',
      rechargePromotionPercent: settings.rechargePromotionPercent
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get announcement
router.get('/announcement', authenticateAdmin, async (req, res) => {
  try {
    let announcement = await Announcement.findOne().lean();
    if (!announcement) {
      announcement = { title: 'Thông Báo | Trang Chủ', content: '' };
    }
    res.json(announcement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update announcement
router.put('/announcement', authenticateAdmin, async (req, res) => {
  try {
    const { title, content } = req.body;
    const updated = await Announcement.findOneAndUpdate(
      {},
      {
        $set: {
          title: title ?? 'Thông Báo | Trang Chủ',
          content: content ?? ''
        }
      },
      { new: true, upsert: true }
    ).lean();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Pricing: CayThue (admin)
router.get('/pricing/caythue', authenticateAdmin, async (req, res) => {
  try {
    let doc = await Pricing.findOne({ key: 'caythue' }).lean();
    if (!doc) {
      const created = await Pricing.create({ key: 'caythue', data: defaultCayThuePricing });
      doc = created.toObject ? created.toObject() : created;
    }
    res.json({ key: doc.key, data: doc.data, updatedAt: doc.updatedAt });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/pricing/caythue', authenticateAdmin, async (req, res) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data)) {
      return res.status(400).json({ message: 'Dữ liệu bảng giá không hợp lệ (phải là mảng games).' });
    }
    const updated = await Pricing.findOneAndUpdate(
      { key: 'caythue' },
      { $set: { data, updatedAt: new Date() } },
      { new: true, upsert: true }
    ).lean();
    res.json({ key: updated.key, data: updated.data, updatedAt: updated.updatedAt });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all recharge requests with pagination and status filter
router.get('/recharges', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 7;
    const skip = (page - 1) * limit;
    const statusFilter = req.query.status || '';

    const query = {};
    if (statusFilter) {
      query.status = statusFilter;
    }

    // Filter out deleted recharges in admin view
    query.deleted = { $ne: true };

    const [recharges, total] = await Promise.all([
      Recharge.find(query)
        .select('-billImage')
        .populate('userId', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Recharge.countDocuments(query)
    ]);

    res.json({
      recharges,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve recharge (add balance to user)
router.put('/recharges/:id/approve', authenticateAdmin, async (req, res) => {
  try {
    const recharge = await Recharge.findById(req.params.id);
    if (!recharge) {
      return res.status(404).json({ message: 'Recharge request not found' });
    }

    if (recharge.status === 'Hoàn thành') {
      return res.status(400).json({ message: 'Recharge đã được duyệt' });
    }

    const user = await User.findById(recharge.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get card fee percent if provided (for card payment method)
    const cardFeePercent = req.body.cardFeePercent ? parseFloat(req.body.cardFeePercent) : null;
    if (recharge.paymentMethod === 'card' && cardFeePercent === null) {
      return res.status(400).json({ message: 'Vui lòng nhập phí thẻ cào' });
    }

    // Get promotion percent from settings
    const settings = await Settings.getSettings();
    const promotionPercent = settings.rechargePromotionPercent || 0;

    // Calculate amounts
    let originalAmount = recharge.originalAmount || recharge.amount;
    let cardFee = 0;
    let cardFeePercentValue = 0;

    // If card payment, calculate and deduct fee first
    if (recharge.paymentMethod === 'card' && cardFeePercent !== null) {
      cardFeePercentValue = cardFeePercent;
      cardFee = Math.floor(originalAmount * (cardFeePercent / 100));
      originalAmount = originalAmount - cardFee; // Amount after fee deduction
    }

    // Calculate bonus amount (on the amount after fee deduction)
    const bonusAmount = Math.floor(originalAmount * (promotionPercent / 100));
    const totalAmount = originalAmount + bonusAmount; // Final amount user receives

    // Update recharge with promotion and fee info
    recharge.originalAmount = recharge.originalAmount || recharge.amount; // Keep original recharge amount
    recharge.bonusAmount = bonusAmount;
    recharge.promotionPercent = promotionPercent;
    if (recharge.paymentMethod === 'card') {
      recharge.cardFee = cardFee;
      recharge.cardFeePercent = cardFeePercentValue;
    }
    recharge.amount = totalAmount; // Final amount user receives (after fee deduction and bonus)
    recharge.status = 'Hoàn thành';
    recharge.processedAt = new Date();
    await recharge.save();

    // Add balance (including bonus)
    const initialBalance = user.balance || 0;
    const newBalance = initialBalance + totalAmount;
    user.balance = newBalance;
    await user.save();

    // Create balance history
    const getPaymentMethodName = (method) => {
      if (method === 'bank') return 'Chuyển Khoản';
      if (method === 'momo') return 'MoMo';
      if (method === 'card') return 'Thẻ Cào';
      return 'Thẻ Siêu Rẻ';
    };

    // Build reason text with fee and bonus info
    let reasonText = '';
    const originalRechargeAmount = recharge.originalAmount || recharge.amount;
    
    if (recharge.paymentMethod === 'card' && cardFee > 0) {
      reasonText = `Nạp tiền ${originalRechargeAmount.toLocaleString('vi-VN')}đ - Phí ${cardFee.toLocaleString('vi-VN')}đ (${cardFeePercentValue}%)`;
      if (bonusAmount > 0) {
        reasonText += ` + Khuyến mãi ${bonusAmount.toLocaleString('vi-VN')}đ (${promotionPercent}%)`;
      }
      reasonText += ` = ${totalAmount.toLocaleString('vi-VN')}đ qua ${getPaymentMethodName(recharge.paymentMethod)} (#${recharge._id.toString().substring(0, 8)})`;
    } else if (bonusAmount > 0) {
      reasonText = `Nạp tiền ${originalAmount.toLocaleString('vi-VN')}đ + Khuyến mãi ${bonusAmount.toLocaleString('vi-VN')}đ (${promotionPercent}%) qua ${getPaymentMethodName(recharge.paymentMethod)} (#${recharge._id.toString().substring(0, 8)})`;
    } else {
      reasonText = `Nạp tiền ${originalAmount.toLocaleString('vi-VN')}đ qua ${getPaymentMethodName(recharge.paymentMethod)} (#${recharge._id.toString().substring(0, 8)})`;
    }

    await BalanceHistory.create({
      userId: user._id,
      initialBalance,
      changeAmount: totalAmount,
      currentBalance: newBalance,
      reason: reasonText
    });

    // Log activity
    const ActivityLog = require('../models/ActivityLog');
    let activityText = '';
    if (recharge.paymentMethod === 'card' && cardFee > 0) {
      activityText = `Nạp tiền ${originalRechargeAmount.toLocaleString('vi-VN')}đ - Phí ${cardFee.toLocaleString('vi-VN')}đ (${cardFeePercentValue}%)`;
      if (bonusAmount > 0) {
        activityText += ` + Khuyến mãi ${bonusAmount.toLocaleString('vi-VN')}đ (${promotionPercent}%)`;
      }
      activityText += ` = ${totalAmount.toLocaleString('vi-VN')}đ qua ${getPaymentMethodName(recharge.paymentMethod)}`;
    } else if (bonusAmount > 0) {
      activityText = `Nạp tiền ${originalAmount.toLocaleString('vi-VN')}đ + Khuyến mãi ${bonusAmount.toLocaleString('vi-VN')}đ (${promotionPercent}%) = ${totalAmount.toLocaleString('vi-VN')}đ qua ${getPaymentMethodName(recharge.paymentMethod)}`;
    } else {
      activityText = `Nạp tiền ${totalAmount.toLocaleString('vi-VN')}đ qua ${getPaymentMethodName(recharge.paymentMethod)}`;
    }

    await ActivityLog.create({
      userId: user._id,
      action: activityText
    });

    // Add to revenue (original recharge amount, not after fee deduction, not bonus)
    settings.totalRevenue = (settings.totalRevenue || 0) + originalRechargeAmount;
    settings.updatedAt = new Date();
    await settings.save();

    // Populate userId before sending response
    await recharge.populate('userId', 'username email');

    res.json({
      message: 'Duyệt nạp tiền thành công',
      recharge,
      user: {
        id: user._id,
        username: user.username,
        balance: user.balance
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get bill image for a recharge
router.get('/recharges/:id/bill', authenticateAdmin, async (req, res) => {
  try {
    const recharge = await Recharge.findById(req.params.id).select('billImage');
    if (!recharge) {
      return res.status(404).json({ message: 'Recharge request not found' });
    }
    res.json({ billImage: recharge.billImage });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reject recharge
router.put('/recharges/:id/reject', authenticateAdmin, async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const recharge = await Recharge.findById(req.params.id);
    if (!recharge) {
      return res.status(404).json({ message: 'Recharge request not found' });
    }

    recharge.status = 'Từ chối';
    recharge.rejectionReason = rejectionReason || '';
    recharge.processedAt = new Date();
    await recharge.save();

    res.json({ message: 'Từ chối nạp tiền thành công', recharge });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete completed recharge
router.delete('/recharges/:id', authenticateAdmin, async (req, res) => {
  try {
    const recharge = await Recharge.findById(req.params.id);
    if (!recharge) {
      return res.status(404).json({ message: 'Recharge request not found' });
    }
    
    // Allow deletion for "Hoàn thành" and "Từ chối" status
    if (recharge.status !== 'Hoàn thành' && recharge.status !== 'Từ chối') {
      return res.status(400).json({ message: 'Chỉ có thể xóa yêu cầu nạp tiền đã hoàn thành hoặc bị từ chối' });
    }
    
    // Soft delete: mark as deleted instead of actually deleting
    recharge.deleted = true;
    recharge.deletedAt = new Date();
    await recharge.save();
    
    res.json({ message: 'Đã xóa yêu cầu nạp tiền thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===== Voucher management =====

// Get vouchers with pagination and optional status filter
router.get('/vouchers', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 7;
    const skip = (page - 1) * limit;
    const status = (req.query.status || '').trim(); // active | expired

    // Auto expire outdated vouchers
    const now = new Date();
    await Voucher.updateMany(
      { expiresAt: { $lt: now }, status: { $ne: 'expired' } },
      { $set: { status: 'expired' } }
    );

    const query = {};
    if (status) {
      query.status = status;
    }

    const [vouchers, total] = await Promise.all([
      Voucher.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Voucher.countDocuments(query),
    ]);

    res.json({
      vouchers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new voucher
router.post('/vouchers', authenticateAdmin, async (req, res) => {
  try {
    const { code, discount, expiresAt, minOrderAmount } = req.body;

    if (!code || !discount || !expiresAt) {
      return res
        .status(400)
        .json({ message: 'Vui lòng nhập đầy đủ: mã, giảm giá, ngày hết hạn' });
    }

    const discountValue = Number(discount);
    if (!Number.isFinite(discountValue) || discountValue <= 0 || discountValue > 100) {
      return res
        .status(400)
        .json({ message: 'Giảm giá phải trong khoảng 1 - 100%' });
    }

    const upperCode = code.trim().toUpperCase();
    const existing = await Voucher.findOne({ code: upperCode });
    if (existing) {
      return res.status(400).json({ message: 'Mã voucher đã tồn tại' });
    }

    const voucher = await Voucher.create({
      code: upperCode,
      discount: discountValue,
      expiresAt: new Date(expiresAt),
      minOrderAmount: Number(minOrderAmount) || 0,
      status: 'active',
    });

    res.status(201).json(voucher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete voucher
router.delete('/vouchers/:id', authenticateAdmin, async (req, res) => {
  try {
    const voucher = await Voucher.findByIdAndDelete(req.params.id);
    if (!voucher) {
      return res.status(404).json({ message: 'Voucher không tồn tại' });
    }
    res.json({ message: 'Xóa voucher thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===== Account management =====

// Helper function to generate account code based on game
const generateAccountCode = async (game) => {
  const gamePrefixes = {
    'Anime Crusader': 'AC',
    'Anime Vanguards': 'AV',
    'Universal Tower Defense': 'UTD',
    'The Forge': 'TF'
  };

  // Get prefix from game name or use first 2 uppercase letters
  let prefix = gamePrefixes[game] || game.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
  
  // Find the latest account with this prefix
  const latestAccount = await Account.findOne({ code: new RegExp(`^${prefix}`) })
    .sort({ createdAt: -1 });
  
  let sequence = 1;
  if (latestAccount) {
    // Extract number from code (e.g., AC001234 -> 1234)
    const match = latestAccount.code.match(/\d+$/);
    if (match) {
      sequence = parseInt(match[0]) + 1;
    }
  }
  
  // Format: PREFIX + 6-digit number (e.g., AC000001)
  return `${prefix}${sequence.toString().padStart(6, '0')}`;
};

// Get accounts with pagination, search, and filters
router.get('/accounts', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 7;
    const skip = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const gameFilter = req.query.game || '';
    const statusFilter = req.query.status || '';

    const query = {};
    
    // Search filter
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { game: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Game filter
    if (gameFilter) {
      query.game = gameFilter;
    }
    
    // Status filter
    if (statusFilter) {
      query.status = statusFilter;
    }

    const accounts = await Account.find(query)
      .populate('buyerId', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Account.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      accounts,
      totalPages,
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all games (for dropdown)
router.get('/accounts/games', authenticateAdmin, async (req, res) => {
  try {
    // Get games from Game model (managed by admin)
    const gamesFromDB = await Game.find().sort({ name: 1 });
    
    // Default games
    const defaultGames = ['Anime Crusader', 'Anime Vanguards', 'Universal Tower Defense', 'The Forge'];
    
    // Merge games from DB with default games, avoiding duplicates
    const dbGameNames = gamesFromDB.map(g => g.name);
    const allGames = [...new Set([...defaultGames, ...dbGameNames])].sort();
    
    res.json(allGames);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new account
router.post('/accounts', authenticateAdmin, async (req, res) => {
  try {
    const { game, info, image, username, password, originalPrice, discountedPrice } = req.body;

    if (!game || !username || !password || !originalPrice || !discountedPrice) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    // Generate account code
    const code = await generateAccountCode(game);

    const account = await Account.create({
      code,
      game,
      info: info || '',
      image: image || '',
      username,
      password,
      originalPrice: Number(originalPrice),
      discountedPrice: Number(discountedPrice),
      status: 'chưa bán'
    });

    const populatedAccount = await Account.findById(account._id).populate('buyerId', 'username email');

    res.status(201).json(populatedAccount);
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error (code already exists)
      return res.status(400).json({ message: 'Mã số đã tồn tại, vui lòng thử lại' });
    }
    res.status(500).json({ message: error.message });
  }
});

// Update account
router.put('/accounts/:id', authenticateAdmin, async (req, res) => {
  try {
    const { game, info, image, username, password, originalPrice, discountedPrice, status, buyerId } = req.body;
    
    const account = await Account.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ message: 'Account không tồn tại' });
    }

    // Update fields
    if (game !== undefined) account.game = game;
    if (info !== undefined) account.info = info;
    if (image !== undefined) account.image = image;
    if (username !== undefined) account.username = username;
    if (password !== undefined) account.password = password;
    if (originalPrice !== undefined) account.originalPrice = Number(originalPrice);
    if (discountedPrice !== undefined) account.discountedPrice = Number(discountedPrice);
    if (status !== undefined) account.status = status;
    if (buyerId !== undefined) account.buyerId = buyerId || null;

    await account.save();
    const updatedAccount = await Account.findById(account._id).populate('buyerId', 'username email');

    res.json(updatedAccount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete account - allow deletion even if sold (stats are based on orders, not account records)
router.delete('/accounts/:id', authenticateAdmin, async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ message: 'Account không tồn tại' });
    }
    
    // Allow deletion even if sold - stats are tracked in orders, not account records
    await Account.findByIdAndDelete(req.params.id);
    res.json({ message: 'Xóa account thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Game management routes
// Get all games
router.get('/games', authenticateAdmin, async (req, res) => {
  try {
    const games = await Game.find().sort({ name: 1 });
    res.json(games);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new game
router.post('/games', authenticateAdmin, async (req, res) => {
  try {
    const { name, image } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Tên game là bắt buộc' });
    }
    
    const game = await Game.create({
      name: name.trim(),
      image: image || ''
    });
    
    res.status(201).json(game);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Tên game đã tồn tại' });
    }
    res.status(500).json({ message: error.message });
  }
});

// Update game
router.put('/games/:id', authenticateAdmin, async (req, res) => {
  try {
    const { name, image } = req.body;
    
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ message: 'Game không tồn tại' });
    }
    
    if (name !== undefined) game.name = name.trim();
    if (image !== undefined) game.image = image;
    
    await game.save();
    res.json(game);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Tên game đã tồn tại' });
    }
    res.status(500).json({ message: error.message });
  }
});

// Delete game
router.delete('/games/:id', authenticateAdmin, async (req, res) => {
  try {
    const game = await Game.findByIdAndDelete(req.params.id);
    if (!game) {
      return res.status(404).json({ message: 'Game không tồn tại' });
    }
    res.json({ message: 'Xóa game thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

