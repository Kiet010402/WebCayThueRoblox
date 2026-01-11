const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const User = require('../models/User');

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

// Get current user orders (using token)
router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(orders);
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

    const totalAmount = req.body.totalAmount || 0;
    
    // Kiểm tra và trừ tiền nếu là dịch vụ
    if (req.body.orderType === 'service') {
      if ((user.balance || 0) < totalAmount) {
        return res.status(400).json({ message: 'Số dư không đủ để thanh toán' });
      }
      
      user.balance = (user.balance || 0) - totalAmount;
      await user.save();
    }

    const orderData = {
      userId: req.userId,
      orderType: req.body.orderType || 'product',
      totalAmount: totalAmount,
      status: req.body.status || 'Đang xử lí',
      ...req.body
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
