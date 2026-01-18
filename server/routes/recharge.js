const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Recharge = require('../models/Recharge');
const User = require('../models/User');
const { getJWTSecret } = require('../utils/auth');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token không tồn tại' });
  }

  jwt.verify(token, getJWTSecret(), (err, decoded) => {
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
    const { amount, paymentMethod, billImage, cardType, cardCode, cardSerial } = req.body;

    const amountNum = parseInt(amount);
    if (!amountNum || isNaN(amountNum) || amountNum < 5000) {
      return res.status(400).json({ message: 'Số tiền tối thiểu là 5.000đ' });
    }
    if (amountNum > 10000000) {
      return res.status(400).json({ message: 'Số tiền tối đa là 10.000.000đ' });
    }

    // Validate based on payment method
    if (paymentMethod === 'card') {
      if (!cardType || !cardCode || !cardSerial) {
        return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin thẻ cào' });
      }
      if (!['Vinaphone', 'Viettel', 'Mobifone', 'Zing', 'Garena'].includes(cardType)) {
        return res.status(400).json({ message: 'Loại thẻ không hợp lệ' });
      }
    } else {
    if (!billImage || typeof billImage !== 'string') {
      return res.status(400).json({ message: 'Vui lòng upload hình bill' });
    }
    // Check if billImage is a valid base64 string
    if (billImage.length > 10 * 1024 * 1024) { // 10MB limit for base64
      return res.status(400).json({ message: 'Kích thước ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB' });
      }
    }

    const rechargeData = {
      userId: req.userId,
      amount: amountNum,
      originalAmount: amountNum, // Store original amount before promotion
      bonusAmount: 0, // Will be calculated when approved
      promotionPercent: 0, // Will be set when approved
      paymentMethod,
      status: 'Đang xử lí'
    };

    if (paymentMethod === 'card') {
      rechargeData.cardType = cardType;
      rechargeData.cardCode = cardCode;
      rechargeData.cardSerial = cardSerial;
    } else {
      rechargeData.billImage = billImage;
      // Don't set cardType for non-card payments (leave undefined)
      delete rechargeData.cardType;
      delete rechargeData.cardCode;
      delete rechargeData.cardSerial;
    }

    const recharge = new Recharge(rechargeData);

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
    const MonthlyRechargeStats = require('../models/MonthlyRechargeStats');
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();
    
    // Get top 5 users for current month
    const topRecharges = await MonthlyRechargeStats.aggregate([
      {
        $match: {
          month: currentMonth,
          year: currentYear,
          totalAmount: { $gt: 0 }
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
          localField: 'userId',
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

