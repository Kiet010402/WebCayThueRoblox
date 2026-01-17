const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const BlindBag = require('../models/BlindBag');
const BlindBagAccount = require('../models/BlindBagAccount');
const User = require('../models/User');
const Order = require('../models/Order');
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

// Middleware to check admin role
const checkAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all blind bags (public)
router.get('/', async (req, res) => {
  try {
    const blindBags = await BlindBag.find().sort({ createdAt: -1 });
    res.json(blindBags);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get blind bag by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const blindBag = await BlindBag.findById(req.params.id);
    if (!blindBag) {
      return res.status(404).json({ message: 'Túi mù không tồn tại' });
    }
    res.json(blindBag);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get blind bag stats (public)
router.get('/:id/stats', async (req, res) => {
  try {
    const blindBag = await BlindBag.findById(req.params.id);
    if (!blindBag) {
      return res.status(404).json({ message: 'Túi mù không tồn tại' });
    }

    const totalAccounts = await BlindBagAccount.countDocuments({ blindBagId: blindBag._id });
    
    // Count available accounts (chưa bán)
    const availableAccounts = await BlindBagAccount.countDocuments({ 
      blindBagId: blindBag._id, 
      status: 'chưa bán' 
    });
    
    // Count sold accounts from orders (accounts may be deleted, but orders remain)
    // This ensures accurate count even if accounts are deleted
    const soldOrders = await Order.countDocuments({
      orderType: 'account',
      status: 'Hoàn thành',
      'items.game': blindBag.game,
      'items.name': { $regex: new RegExp(`^Túi mù ${blindBag.game.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i') }
    });
    
    // Also count from BlindBagAccount collection for accounts that haven't been deleted
    const soldFromAccounts = await BlindBagAccount.countDocuments({ 
      blindBagId: blindBag._id, 
      status: 'đã bán' 
    });
    
    // Use the maximum to ensure accuracy (some might be in orders but deleted from accounts)
    const soldAccounts = Math.max(soldOrders, soldFromAccounts);

    res.json({
      totalAccounts,
      soldAccounts,
      availableAccounts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create blind bag (admin only)
router.post('/', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { game, premiumRate, image, info, originalPrice, discountedPrice } = req.body;

    if (!game || !originalPrice || !discountedPrice) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    // Validate premium rate: 0.001 to 100
    const rate = parseFloat(premiumRate) || 0;
    if (rate < 0.001 || rate > 100) {
      return res.status(400).json({ message: 'Tỉ lệ phải từ 0.001 đến 100' });
    }

    const blindBag = new BlindBag({
      game,
      premiumRate: premiumRate || 0,
      image: image || '',
      info: info || '',
      originalPrice,
      discountedPrice,
      totalAccounts: 0,
      soldAccounts: 0,
      availableAccounts: 0
    });

    const savedBlindBag = await blindBag.save();
    res.status(201).json(savedBlindBag);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update blind bag (admin only)
router.put('/:id', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { game, premiumRate, image, info, originalPrice, discountedPrice } = req.body;

    const updateData = {};
    if (game) updateData.game = game;
    if (premiumRate !== undefined) {
      const rate = parseFloat(premiumRate);
      if (rate < 0.001 || rate > 100) {
        return res.status(400).json({ message: 'Tỉ lệ phải từ 0.001 đến 100' });
      }
      updateData.premiumRate = rate;
    }
    if (image !== undefined) updateData.image = image;
    if (info !== undefined) updateData.info = info;
    if (originalPrice !== undefined) updateData.originalPrice = originalPrice;
    if (discountedPrice !== undefined) updateData.discountedPrice = discountedPrice;
    updateData.updatedAt = new Date();

    const blindBag = await BlindBag.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!blindBag) {
      return res.status(404).json({ message: 'Túi mù không tồn tại' });
    }

    // Update stats
    const totalAccounts = await BlindBagAccount.countDocuments({ blindBagId: blindBag._id });
    const soldAccounts = await BlindBagAccount.countDocuments({ 
      blindBagId: blindBag._id, 
      status: 'đã bán' 
    });
    blindBag.totalAccounts = totalAccounts;
    blindBag.soldAccounts = soldAccounts;
    blindBag.availableAccounts = totalAccounts - soldAccounts;
    await blindBag.save();

    res.json(blindBag);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete blind bag (admin only)
router.delete('/:id', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const blindBag = await BlindBag.findById(req.params.id);
    if (!blindBag) {
      return res.status(404).json({ message: 'Túi mù không tồn tại' });
    }

    // Check if there are accounts in this blind bag
    const accountCount = await BlindBagAccount.countDocuments({ blindBagId: blindBag._id });
    if (accountCount > 0) {
      return res.status(400).json({ 
        message: `Không thể xóa túi mù này vì còn ${accountCount} account. Vui lòng xóa hết account trước.` 
      });
    }

    await BlindBag.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa túi mù thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add account to blind bag (admin only)
router.post('/:id/accounts', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { username, password, accountType } = req.body;

    if (!username || !password || !accountType) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    if (!['xịn', 'thường'].includes(accountType)) {
      return res.status(400).json({ message: 'Loại account phải là "xịn" hoặc "thường"' });
    }

    const blindBag = await BlindBag.findById(req.params.id);
    if (!blindBag) {
      return res.status(404).json({ message: 'Túi mù không tồn tại' });
    }

    // Auto-generate code: first letter of game name + 6-digit number
    const firstLetter = blindBag.game.charAt(0).toUpperCase();
    
    // Find the highest number for this prefix
    const existingAccounts = await BlindBagAccount.find({
      code: { $regex: `^${firstLetter}` }
    }).sort({ code: -1 }).limit(1);
    
    let nextNumber = 1;
    if (existingAccounts.length > 0) {
      const lastCode = existingAccounts[0].code;
      const lastNumber = parseInt(lastCode.substring(1)) || 0;
      nextNumber = lastNumber + 1;
    }
    
    const code = `${firstLetter}${String(nextNumber).padStart(6, '0')}`;

    // Check if code already exists (just in case)
    const existingAccount = await BlindBagAccount.findOne({ code });
    if (existingAccount) {
      return res.status(400).json({ message: 'Mã số đã tồn tại, vui lòng thử lại' });
    }

    const blindBagAccount = new BlindBagAccount({
      blindBagId: blindBag._id,
      code,
      username,
      password,
      accountType,
      status: 'chưa bán'
    });

    await blindBagAccount.save();

    // Update blind bag stats
    const totalAccounts = await BlindBagAccount.countDocuments({ blindBagId: blindBag._id });
    const soldAccounts = await BlindBagAccount.countDocuments({ 
      blindBagId: blindBag._id, 
      status: 'đã bán' 
    });
    blindBag.totalAccounts = totalAccounts;
    blindBag.soldAccounts = soldAccounts;
    blindBag.availableAccounts = totalAccounts - soldAccounts;
    await blindBag.save();

    res.status(201).json(blindBagAccount);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all accounts in a blind bag (admin only)
router.get('/:id/accounts', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [accounts, total] = await Promise.all([
      BlindBagAccount.find({ blindBagId: req.params.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BlindBagAccount.countDocuments({ blindBagId: req.params.id })
    ]);

    res.json({
      accounts,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get account detail (admin only)
router.get('/accounts/:accountId', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const account = await BlindBagAccount.findById(req.params.accountId)
      .populate('blindBagId', 'game image info')
      .populate('buyerId', 'username email');
    
    if (!account) {
      return res.status(404).json({ message: 'Account không tồn tại' });
    }

    res.json(account);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Purchase blind bag (user)
router.post('/:id/purchase', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User không tồn tại' });
    }

    const blindBag = await BlindBag.findById(req.params.id);
    if (!blindBag) {
      return res.status(404).json({ message: 'Túi mù không tồn tại' });
    }

    // Find available account
    const availableAccount = await BlindBagAccount.findOne({
      blindBagId: blindBag._id,
      status: 'chưa bán'
    }).sort({ createdAt: 1 }); // FIFO

    if (!availableAccount) {
      return res.status(400).json({ message: 'Túi mù đã hết hàng' });
    }

    const finalPrice = blindBag.discountedPrice;

    if (user.balance < finalPrice) {
      return res.status(400).json({ message: 'Số dư không đủ' });
    }

    // Deduct balance
    const initialBalance = user.balance || 0;
    const newBalance = initialBalance - finalPrice;
    user.balance = newBalance;
    await user.save();

    // Create balance history
    await BalanceHistory.create({
      userId: user._id,
      initialBalance,
      changeAmount: -finalPrice,
      currentBalance: newBalance,
      reason: `Mua túi mù ${blindBag.game} - MS: ${availableAccount.code}`
    });

    // Log activity
    const ActivityLog = require('../models/ActivityLog');
    await ActivityLog.create({
      userId: user._id,
      action: `Mua túi mù ${blindBag.game} - MS: ${availableAccount.code} - Giá: ${finalPrice.toLocaleString('vi-VN')}đ`
    });

    // Update account status
    availableAccount.status = 'đã bán';
    availableAccount.buyerId = user._id;
    availableAccount.soldAt = new Date();
    await availableAccount.save();

    // Update blind bag stats
    const totalAccounts = await BlindBagAccount.countDocuments({ blindBagId: blindBag._id });
    const soldAccounts = await BlindBagAccount.countDocuments({ 
      blindBagId: blindBag._id, 
      status: 'đã bán' 
    });
    blindBag.totalAccounts = totalAccounts;
    blindBag.soldAccounts = soldAccounts;
    blindBag.availableAccounts = totalAccounts - soldAccounts;
    await blindBag.save();

    // Create order
    const order = new Order({
      userId: user._id,
      orderType: 'account',
      items: [{
        code: availableAccount.code,
        username: availableAccount.username,
        password: availableAccount.password,
        game: blindBag.game,
        name: `Túi mù ${blindBag.game}`,
        image: blindBag.image,
        info: blindBag.info,
        accountType: availableAccount.accountType
      }],
      totalAmount: finalPrice,
      originalAmount: blindBag.originalPrice,
      discount: blindBag.originalPrice > blindBag.discountedPrice 
        ? Math.round(((blindBag.originalPrice - blindBag.discountedPrice) / blindBag.originalPrice) * 100)
        : 0,
      discountAmount: blindBag.originalPrice - blindBag.discountedPrice,
      status: 'Hoàn thành',
      paymentMethod: 'balance'
    });
    await order.save();

    res.json({
      account: {
        username: availableAccount.username,
        password: availableAccount.password,
        code: availableAccount.code,
        game: blindBag.game,
        accountType: availableAccount.accountType
      },
      newBalance
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all blind bag accounts with filters (admin only)
router.get('/admin/accounts/all', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 7;
    const skip = (page - 1) * limit;
    const { blindBagId, accountType, status, search } = req.query;

    const filter = {};
    if (blindBagId) filter.blindBagId = blindBagId;
    if (accountType) filter.accountType = accountType;
    if (status) filter.status = status;
    if (search) {
      filter.code = { $regex: search, $options: 'i' };
    }

    const [accounts, total] = await Promise.all([
      BlindBagAccount.find(filter)
        .populate('blindBagId', 'game image info')
        .populate('buyerId', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BlindBagAccount.countDocuments(filter)
    ]);

    res.json({
      accounts,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update blind bag account (admin only)
router.put('/accounts/:accountId', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { username, password, accountType } = req.body;

    const account = await BlindBagAccount.findById(req.params.accountId);
    if (!account) {
      return res.status(404).json({ message: 'Account không tồn tại' });
    }

    if (username !== undefined) account.username = username;
    if (password !== undefined) account.password = password;
    if (accountType && ['xịn', 'thường'].includes(accountType)) {
      account.accountType = accountType;
    }

    await account.save();

    // Update blind bag stats
    const blindBag = await BlindBag.findById(account.blindBagId);
    if (blindBag) {
      const totalAccounts = await BlindBagAccount.countDocuments({ blindBagId: blindBag._id });
      const soldAccounts = await BlindBagAccount.countDocuments({ 
        blindBagId: blindBag._id, 
        status: 'đã bán' 
      });
      blindBag.totalAccounts = totalAccounts;
      blindBag.soldAccounts = soldAccounts;
      blindBag.availableAccounts = totalAccounts - soldAccounts;
      await blindBag.save();
    }

    const updatedAccount = await BlindBagAccount.findById(req.params.accountId)
      .populate('blindBagId', 'game image info')
      .populate('buyerId', 'username email');

    res.json(updatedAccount);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete blind bag account (admin only) - only if sold
router.delete('/accounts/:accountId', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const account = await BlindBagAccount.findById(req.params.accountId);
    if (!account) {
      return res.status(404).json({ message: 'Account không tồn tại' });
    }

    if (account.status !== 'đã bán') {
      return res.status(400).json({ message: 'Chỉ có thể xóa account đã bán' });
    }

    const blindBagId = account.blindBagId;
    const wasSold = account.status === 'đã bán';

    await BlindBagAccount.findByIdAndDelete(req.params.accountId);

    // Update blind bag stats - không giảm soldAccounts, chỉ update totalAccounts và availableAccounts
    const blindBag = await BlindBag.findById(blindBagId);
    if (blindBag) {
      const totalAccounts = await BlindBagAccount.countDocuments({ blindBagId: blindBag._id });
      // Giữ nguyên soldAccounts (không đếm lại từ DB vì account đã bị xóa)
      // soldAccounts chỉ tăng khi bán, không giảm khi xóa
      blindBag.totalAccounts = totalAccounts;
      // Không thay đổi soldAccounts
      blindBag.availableAccounts = totalAccounts - (blindBag.soldAccounts || 0);
      await blindBag.save();
    }

    res.json({ message: 'Đã xóa account thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
