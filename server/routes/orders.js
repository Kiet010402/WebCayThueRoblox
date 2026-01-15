const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const User = require('../models/User');
const BalanceHistory = require('../models/BalanceHistory');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token không tồn tại' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token không hợp lệ' });
    }
    req.userId = decoded.userId;
    next();
  });
};

// Get user orders
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    // Verify that the userId matches the authenticated user
    if (req.params.userId !== req.userId.toString()) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }
    const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user orders (using token) with pagination
router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ userId: req.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({ userId: req.userId })
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

// Create order
router.post('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const originalAmount = req.body.totalAmount || 0;
    
    // Apply discount if user has voucher
    const discount = user.discount || 0;
    let discountAmount = 0;
    let finalAmount = originalAmount;
    
    if (discount > 0 && discount <= 100 && req.body.orderType === 'service') {
      discountAmount = Math.round((originalAmount * discount) / 100);
      finalAmount = originalAmount - discountAmount;
    }
    
    // Kiểm tra và trừ tiền nếu là dịch vụ
    if (req.body.orderType === 'service') {
      if ((user.balance || 0) < finalAmount) {
        return res.status(400).json({ message: 'Số dư không đủ để thanh toán' });
      }
      
      const initialBalance = user.balance || 0;
      const newBalance = initialBalance - finalAmount;
      user.balance = newBalance;
      await user.save();

      // Create balance history
      const orderDescription = req.body.serviceName 
        ? `Thanh toán đơn hàng mua ${req.body.serviceName}${req.body.gameName ? ` - ${req.body.gameName}` : ''}${discountAmount > 0 ? ` (Giảm ${discount}%: -${discountAmount.toLocaleString('vi-VN')}đ)` : ''}`
        : 'Thanh toán đơn hàng';
      
      await BalanceHistory.create({
        userId: user._id,
        initialBalance,
        changeAmount: -finalAmount,
        currentBalance: newBalance,
        reason: orderDescription
      });
    }

    const orderData = {
      ...req.body,
      userId: req.userId,
      orderType: req.body.orderType || 'product',
      totalAmount: finalAmount, // Override with final amount after discount
      originalAmount: originalAmount,
      discount: discountAmount > 0 ? discount : 0,
      discountAmount: discountAmount,
      status: req.body.status || 'Đang xử lí'
    };

    const order = new Order(orderData);
    const newOrder = await order.save();
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update order status
router.put('/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
