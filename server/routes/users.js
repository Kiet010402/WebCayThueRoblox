const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const BalanceHistory = require('../models/BalanceHistory');
const Order = require('../models/Order');
const Account = require('../models/Account');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'Email đã tồn tại' });

    user = await User.findOne({ username });
    if (user) return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });

    user = new User({
      username,
      email,
      password
    });

    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '7d'
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        balance: user.balance || 0,
        role: user.role || 'user'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login with username
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Tên đăng nhập không tồn tại' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Mật khẩu không chính xác' });

    // Update last login and device
    user.lastLogin = new Date();
    user.device = req.headers['user-agent'] || '';
    await user.save();

    // Log activity
    await ActivityLog.create({
      userId: user._id,
      action: '[Warning] Thực hiện đăng nhập vào website',
      ipAddress: req.ip || req.connection.remoteAddress
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '7d'
    });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        balance: user.balance || 0,
        role: user.role || 'user'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user info
router.get('/me', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token không tồn tại' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName || '',
      phone: user.phone || '',
      telegramChatId: user.telegramChatId || '',
      balance: user.balance || 0,
      discount: user.discount || 0,
      role: user.role || 'user',
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      device: user.device
    });
  } catch (error) {
    res.status(403).json({ message: 'Token không hợp lệ' });
  }
});

// Get activity log
router.get('/activity-log', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token không tồn tại' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      ActivityLog.find({ userId: decoded.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ActivityLog.countDocuments({ userId: decoded.userId })
    ]);

    res.json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get balance history
router.get('/balance-history', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token không tồn tại' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 7;
    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      BalanceHistory.find({ userId: decoded.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BalanceHistory.countDocuments({ userId: decoded.userId })
    ]);

    res.json({
      history,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Change password
router.put('/change-password', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token không tồn tại' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Mật khẩu mới không khớp' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get account purchase history
router.get('/account-history', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token không tồn tại' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // Get orders of type 'account'
    const [orders, total] = await Promise.all([
      Order.find({ 
        userId: decoded.userId,
        orderType: 'account'
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({ 
        userId: decoded.userId,
        orderType: 'account'
      })
    ]);

    // Return orders directly - all account info is already saved in items
    // No need to fetch from Account model, so history persists even if account is deleted
    res.json({
      history: orders,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
