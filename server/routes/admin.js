const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Order = require('../models/Order');
const Recharge = require('../models/Recharge');
const Settings = require('../models/Settings');

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

// Get all users
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
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

// Get user orders and recharges
router.get('/users/:id/details', authenticateAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const [orders, recharges] = await Promise.all([
      Order.find({ userId }).sort({ createdAt: -1 }),
      Recharge.find({ userId }).sort({ createdAt: -1 })
    ]);
    res.json({ orders, recharges });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add balance to user
router.post('/users/:id/add-balance', authenticateAdmin, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Số tiền không hợp lệ' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.balance = (user.balance || 0) + amount;
    await user.save();

    res.json({
      message: 'Cộng tiền thành công',
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

// Get all orders
router.get('/orders', authenticateAdmin, async (req, res) => {
  try {
    const orders = await Order.find().populate('userId', 'username email').sort({ createdAt: -1 });
    res.json(orders);
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

// Get all recharge requests
router.get('/recharges', authenticateAdmin, async (req, res) => {
  try {
    const recharges = await Recharge.find().populate('userId', 'username email').sort({ createdAt: -1 });
    res.json(recharges);
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
    user.balance = (user.balance || 0) + recharge.amount;
    await user.save();

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

// Reject recharge
router.put('/recharges/:id/reject', authenticateAdmin, async (req, res) => {
  try {
    const recharge = await Recharge.findById(req.params.id);
    if (!recharge) {
      return res.status(404).json({ message: 'Recharge request not found' });
    }

    recharge.status = 'Từ chối';
    recharge.processedAt = new Date();
    await recharge.save();

    res.json({ message: 'Từ chối nạp tiền thành công', recharge });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

