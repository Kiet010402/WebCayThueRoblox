const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Order = require('../models/Order');
const Recharge = require('../models/Recharge');
const Settings = require('../models/Settings');
const BalanceHistory = require('../models/BalanceHistory');
const Announcement = require('../models/Announcement');
const Pricing = require('../models/Pricing');
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
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
    const search = req.query.search || '';

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
    const userId = req.params.id;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Limit to last 50 orders and 50 recharges for performance
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

    const query = {};
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
      totalRevenue
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

    const sumRecharge = async (start, end) => {
      const match = {
        status: 'Hoàn thành',
        $expr: {
          $and: [
            { $gte: [dateExpr, start] },
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

    const [totalOrders, ordersToday, ordersYesterday] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: todayStart, $lt: tomorrowStart } }),
      Order.countDocuments({ createdAt: { $gte: yesterdayStart, $lt: todayStart } })
    ]);

    const [totalRevenueAgg] = await Recharge.aggregate([
      { $match: { status: 'Hoàn thành' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = totalRevenueAgg?.total || 0;

    const [revenueToday, revenueYesterday, revenueThisWeek, revenueThisMonth, revenueLastMonth] = await Promise.all([
      sumRecharge(todayStart, tomorrowStart),
      sumRecharge(yesterdayStart, todayStart),
      sumRecharge(weekStart, tomorrowStart),
      sumRecharge(monthStart, nextMonthStart),
      sumRecharge(lastMonthStart, monthStart)
    ]);

    // Profit = revenue for now (no costs model)
    res.json({
      totalOrders,
      totalRevenue,
      ordersToday,
      ordersYesterday,
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

    // Add balance
    const initialBalance = user.balance || 0;
    const newBalance = initialBalance + recharge.amount;
    user.balance = newBalance;
    await user.save();

    // Create balance history
    await BalanceHistory.create({
      userId: user._id,
      initialBalance,
      changeAmount: recharge.amount,
      currentBalance: newBalance,
      reason: `Nạp tiền tự động qua ${recharge.paymentMethod === 'bank' ? 'Chuyển Khoản' : 'MoMo'} (#${recharge._id.toString().substring(0, 8)})`
    });

    // Update recharge status
    recharge.status = 'Hoàn thành';
    recharge.processedAt = new Date();
    await recharge.save();

    // Add to revenue
    const settings = await Settings.getSettings();
    settings.totalRevenue = (settings.totalRevenue || 0) + recharge.amount;
    settings.updatedAt = new Date();
    await settings.save();

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

module.exports = router;

