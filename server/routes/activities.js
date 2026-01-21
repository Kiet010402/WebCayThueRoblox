const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Recharge = require('../models/Recharge');
const BlindBagAccount = require('../models/BlindBagAccount');
const User = require('../models/User');

const maskUsername = (username = '') => {
  if (!username) return 'Ẩn danh';
  const first = username[0] || '';
  return `${first}*****`;
};

// Get recent activities (public endpoint)
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    // Get recent orders (service orders - "cày thuê")
    const recentOrders = await Order.find({ orderType: 'service', status: { $ne: 'Hủy' } })
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    // Get recent recharges (approved only)
    const recentRecharges = await Recharge.find({ status: 'Hoàn thành' })
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    // Get recent blind bag purchases (túi mù)
    const recentBlindBagPurchases = await BlindBagAccount.find({ status: 'đã bán' })
      .populate('buyerId', 'username')
      .populate('blindBagId', 'game')
      .sort({ soldAt: -1 })
      .limit(limit)
      .lean();
    
    // Get recent account purchases (nick roblox) - from orders with orderType: 'product'
    const recentAccountPurchases = await Order.find({ orderType: 'product' })
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    // Format activities
    const activities = [];
    
    // Format orders (cày thuê)
    recentOrders.forEach(order => {
      if (order.userId && order.userId.username) {
        const masked = maskUsername(order.userId.username);
        activities.push({
          type: 'cay-thue',
          message: `${masked} vừa đặt dịch vụ cày thuê ${order.gameName || order.serviceName || ''}`,
          createdAt: order.createdAt
        });
      }
    });
    
    // Format recharges (nạp tiền)
    recentRecharges.forEach(recharge => {
      if (recharge.userId && recharge.userId.username) {
        const masked = maskUsername(recharge.userId.username);
        activities.push({
          type: 'nap-tien',
          message: `${masked} vừa thực hiện nạp ${recharge.amount?.toLocaleString('vi-VN') || 0}đ`,
          createdAt: recharge.createdAt
        });
      }
    });
    
    // Format blind bag purchases (túi mù)
    recentBlindBagPurchases.forEach(purchase => {
      if (purchase.buyerId && purchase.buyerId.username && purchase.soldAt) {
        const masked = maskUsername(purchase.buyerId.username);
        const gameName = purchase.blindBagId?.game || 'túi mù';
        activities.push({
          type: 'tui-mu',
          message: `${masked} vừa mua túi mù ${gameName}`,
          createdAt: purchase.soldAt
        });
      }
    });
    
    // Format account purchases (mua nick)
    recentAccountPurchases.forEach(order => {
      if (order.userId && order.userId.username) {
        const masked = maskUsername(order.userId.username);
        activities.push({
          type: 'mua-nick',
          message: `${masked} vừa mua nick Roblox`,
          createdAt: order.createdAt
        });
      }
    });
    
    // Sort by createdAt descending and limit
    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const limitedActivities = activities.slice(0, limit);
    
    res.json({ activities: limitedActivities });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({ message: error.message, activities: [] });
  }
});

module.exports = router;
