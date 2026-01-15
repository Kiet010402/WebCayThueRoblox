const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Recharge = require('../models/Recharge');
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

// Create recharge request
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { amount, paymentMethod, billImage } = req.body;

    const amountNum = parseInt(amount);
    if (!amountNum || isNaN(amountNum) || amountNum < 5000) {
      return res.status(400).json({ message: 'Số tiền tối thiểu là 5.000đ' });
    }
    if (amountNum > 10000000) {
      return res.status(400).json({ message: 'Số tiền tối đa là 10.000.000đ' });
    }

    if (!billImage || typeof billImage !== 'string') {
      return res.status(400).json({ message: 'Vui lòng upload hình bill' });
    }

    // Check if billImage is a valid base64 string
    if (billImage.length > 10 * 1024 * 1024) { // 10MB limit for base64
      return res.status(400).json({ message: 'Kích thước ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB' });
    }

    const recharge = new Recharge({
      userId: req.userId,
      amount: amountNum,
      paymentMethod,
      billImage,
      status: 'Đang xử lí'
    });

    const newRecharge = await recharge.save();
    res.status(201).json(newRecharge);
  } catch (error) {
    console.error('Error creating recharge:', error);
    res.status(400).json({ message: error.message || 'Có lỗi xảy ra khi tạo yêu cầu nạp tiền' });
  }
});

// Get user's recharge requests with pagination
router.get('/my-recharges', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const [recharges, total] = await Promise.all([
      Recharge.find({ userId: req.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Recharge.countDocuments({ userId: req.userId })
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

// Get top recharges for current month (public endpoint)
router.get('/top-month', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const topRecharges = await Recharge.aggregate([
      {
        $match: {
          status: 'Hoàn thành',
          createdAt: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: '$userId',
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $sort: { totalAmount: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          username: '$user.username',
          totalAmount: 1
        }
      }
    ]);
    
    res.json(topRecharges);
  } catch (error) {
    console.error('Error fetching top recharges:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

