const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const BalanceHistory = require('../models/BalanceHistory');
const Voucher = require('../models/Voucher');
const { validateObjectId } = require('../utils/validation');
const { authenticateSession } = require('../middleware/sessionAuth');

// Get user orders
router.get('/user/:userId', authenticateSession, async (req, res) => {
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
router.get('/my-orders', authenticateSession, async (req, res) => {
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
router.post('/', authenticateSession, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get original amount (before any discounts)
    const originalAmount = req.body.originalAmount || req.body.totalAmount || 0;
    const orderType = req.body.orderType || 'product';
    const voucherCode = (req.body.voucherCode || '').trim().toUpperCase();

    // Game discount (from pricing)
    const gameDiscountPercent = req.body.gameDiscountPercent || 0;
    let gameDiscountAmount = 0;
    let priceAfterGameDiscount = originalAmount;

    // User account discount
    const accountDiscountPercent = user.discount || 0;
    let accountDiscountAmount = 0;

    // Voucher discount
    let voucher = null;
    let voucherDiscountPercent = 0;
    let voucherDiscountAmount = 0;

    let finalAmount = originalAmount;

    if (orderType === 'service') {
      // Apply game discount first (if provided)
      if (gameDiscountPercent > 0 && gameDiscountPercent <= 100) {
        gameDiscountAmount = Math.round((originalAmount * gameDiscountPercent) / 100);
        priceAfterGameDiscount = originalAmount - gameDiscountAmount;
        finalAmount = priceAfterGameDiscount;
      }

      // Apply account discount on price after game discount
      if (accountDiscountPercent > 0 && accountDiscountPercent <= 100) {
        accountDiscountAmount = Math.round(
          (priceAfterGameDiscount * accountDiscountPercent) / 100
        );
        finalAmount -= accountDiscountAmount;
      }

      // Apply voucher discount if provided
      if (voucherCode) {
        const now = new Date();
        voucher = await Voucher.findOne({ code: voucherCode });

        if (!voucher) {
          return res.status(400).json({ message: 'Voucher không tồn tại' });
        }

        // Expired check
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

        // Check min order amount against original amount (before discounts)
        if (voucher.minOrderAmount && originalAmount < voucher.minOrderAmount) {
          return res.status(400).json({
            message: `Voucher chỉ áp dụng cho đơn từ ${voucher.minOrderAmount.toLocaleString(
              'vi-VN'
            )}đ`,
          });
        }

        voucherDiscountPercent = voucher.discount || 0;
        if (voucherDiscountPercent > 0) {
          voucherDiscountAmount = Math.round(
            (finalAmount * voucherDiscountPercent) / 100
          );
          finalAmount -= voucherDiscountAmount;
        }
      }
    }
    
    // Kiểm tra và trừ tiền nếu là dịch vụ
    if (orderType === 'service') {
      if ((user.balance || 0) < finalAmount) {
        return res.status(400).json({ message: 'Số dư không đủ để thanh toán' });
      }
      
      const initialBalance = user.balance || 0;
      const newBalance = initialBalance - finalAmount;
      user.balance = newBalance;
      await user.save();

      // Create balance history
      let discountDetails = '';
      if (gameDiscountAmount > 0) {
        discountDetails += `Khuyến mãi ${gameDiscountPercent}%: -${gameDiscountAmount.toLocaleString(
          'vi-VN'
        )}đ`;
      }
      if (accountDiscountAmount > 0) {
        discountDetails += `${discountDetails ? '; ' : ''}Giảm tài khoản ${accountDiscountPercent}%: -${accountDiscountAmount.toLocaleString(
          'vi-VN'
        )}đ`;
      }
      if (voucher && voucherDiscountAmount > 0) {
        discountDetails += `${discountDetails ? '; ' : ''}Voucher ${
          voucher.code
        } ${voucherDiscountPercent}%: -${voucherDiscountAmount.toLocaleString(
          'vi-VN'
        )}đ`;
      }

      const orderDescription = req.body.serviceName
        ? `Thanh toán đơn hàng mua ${req.body.serviceName}${
            req.body.gameName ? ` - ${req.body.gameName}` : ''
          }${
            discountDetails
              ? ` (${discountDetails})`
              : ''
          }`
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
      orderType,
      totalAmount: finalAmount, // Override with final amount after all discounts
      originalAmount, // Original price before any discounts
      gameDiscountPercent: gameDiscountPercent > 0 ? gameDiscountPercent : 0,
      gameDiscountAmount,
      discount: accountDiscountAmount > 0 ? accountDiscountPercent : 0,
      discountAmount: accountDiscountAmount, // Account discount amount only
      totalDiscountAmount: gameDiscountAmount + accountDiscountAmount + voucherDiscountAmount, // Total discount amount from all sources
      voucherCode: voucher ? voucher.code : voucherCode || null,
      voucherDiscount: voucherDiscountPercent,
      voucherDiscountAmount,
      status: req.body.status || 'Đang xử lí',
    };

    const order = new Order(orderData);
    const newOrder = await order.save();

    // Mark voucher as used by this user after order is created successfully
    if (voucher) {
      const usedByUsers = voucher.usedByUsers || [];
      if (!usedByUsers.some(userId => userId.toString() === user._id.toString())) {
        voucher.usedByUsers = [...usedByUsers, user._id];
        await voucher.save();
      }
    }

    // Log activity for service orders (cày thuê)
    if (orderType === 'service') {
      const ActivityLog = require('../models/ActivityLog');
      let activityMessage = `Cày thuê ${newOrder.serviceName || 'dịch vụ'}`;
      if (newOrder.gameName) {
        activityMessage += ` - ${newOrder.gameName}`;
      }
      if (newOrder.totalDiscountAmount > 0) {
        const discountInfo = [];
        if (newOrder.gameDiscountPercent > 0) {
          discountInfo.push(`KM ${newOrder.gameDiscountPercent}%`);
        }
        if (newOrder.discount > 0) {
          discountInfo.push(`TK ${newOrder.discount}%`);
        }
        if (newOrder.voucherCode && newOrder.voucherDiscount > 0) {
          discountInfo.push(`VC ${newOrder.voucherDiscount}%`);
        }
        if (discountInfo.length > 0) {
          activityMessage += ` (Giảm: ${discountInfo.join(', ')})`;
        }
      }
      activityMessage += ` - Giá: ${newOrder.totalAmount.toLocaleString('vi-VN')}đ`;
      
      await ActivityLog.create({
        userId: user._id,
        action: activityMessage
      });
    }

    res.status(201).json(newOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    // Validate ObjectId
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }
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
    // Validate ObjectId
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
