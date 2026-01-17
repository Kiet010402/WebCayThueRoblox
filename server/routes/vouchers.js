const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Voucher = require('../models/Voucher');

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

// Validate and preview voucher for a given order amount
router.post('/apply', authenticateToken, async (req, res) => {
  try {
    const { code, amount } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Vui lòng nhập mã voucher' });
    }

    const orderAmount = Number(amount) || 0;
    if (!Number.isFinite(orderAmount) || orderAmount <= 0) {
      return res
        .status(400)
        .json({ message: 'Số tiền đơn hàng không hợp lệ để áp dụng voucher' });
    }

    const now = new Date();
    const upperCode = code.trim().toUpperCase();

    const voucher = await Voucher.findOne({ code: upperCode });
    if (!voucher) {
      return res.status(400).json({ message: 'Voucher không tồn tại' });
    }

    // Expired?
    if (voucher.expiresAt && voucher.expiresAt < now) {
      if (voucher.status !== 'expired') {
        voucher.status = 'expired';
        await voucher.save();
      }
      return res.status(400).json({ message: 'Voucher đã hết hạn' });
    }

    if (voucher.status === 'expired') {
      return res.status(400).json({ message: 'Voucher đã hết hạn' });
    }

    // Check if user has already used this voucher
    const usedByUsers = voucher.usedByUsers || [];
    if (usedByUsers.some(userId => userId.toString() === req.userId.toString())) {
      return res.status(400).json({ message: 'Bạn đã sử dụng voucher này rồi' });
    }

    if (voucher.minOrderAmount && orderAmount < voucher.minOrderAmount) {
      return res.status(400).json({
        message: `Voucher chỉ áp dụng cho đơn từ ${voucher.minOrderAmount.toLocaleString(
          'vi-VN'
        )}đ`,
      });
    }

    res.json({
      valid: true,
      code: voucher.code,
      discount: voucher.discount,
      minOrderAmount: voucher.minOrderAmount || 0,
      expiresAt: voucher.expiresAt,
      message: 'Áp dụng voucher thành công',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;


