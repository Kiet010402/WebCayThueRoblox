const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const User = require('../models/User');
const Order = require('../models/Order');
const Game = require('../models/Game');
const jwt = require('jsonwebtoken');
const { getJWTSecret } = require('../utils/auth');
const { validateObjectId } = require('../utils/validation');

// Middleware to verify token
const authenticate = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token không tồn tại' });
  }

  try {
    const decoded = jwt.verify(token, getJWTSecret());
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(403).json({ message: 'User không tồn tại' });
    }
    req.userId = decoded.userId;
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token không hợp lệ' });
  }
};

// Get games with stats (available and sold counts)
router.get('/games-stats', async (req, res) => {
  try {
    // Get games from Game model (managed by admin)
    const gamesFromDB = await Game.find().sort({ name: 1 });
    
    // Default games
    const defaultGames = [
      { name: 'Anime Vanguard', image: 'https://i.ytimg.com/vi/yXZpEH82wvk/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLByxdkM2U4bW0HepWz6pbGOgpA6hQ' },
      { name: 'Anime Crusader', image: 'https://tr.rbxcdn.com/180DAY-7561624fd90f9424752bb9772e294ebc/768/432/Image/Webp/noFilter' },
      { name: 'Universal Tower Defense', image: 'https://tr.rbxcdn.com/180DAY-c61bbfa00bbd9750eac5f5f482ebba3c/768/432/Image/Webp/noFilter' },
      { name: 'The Forge', image: 'https://tr.rbxcdn.com/180DAY-0fdafbcf3b254aabfb1ace6a538d22b7/500/280/Image/Jpeg/noFilter' }
    ];
    
    // Merge games from DB with default games, avoiding duplicates
    const dbGamesMap = new Map();
    gamesFromDB.forEach(g => {
      dbGamesMap.set(g.name.toLowerCase(), { name: g.name, image: g.image || '' });
    });
    
    // Add default games that don't exist in DB
    defaultGames.forEach(defaultGame => {
      if (!dbGamesMap.has(defaultGame.name.toLowerCase())) {
        dbGamesMap.set(defaultGame.name.toLowerCase(), defaultGame);
      }
    });
    
    // Convert map to array and sort by name
    const gamesToProcess = Array.from(dbGamesMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
    
    // Get stats for each game
    const gamesWithStats = await Promise.all(
      gamesToProcess.map(async (game) => {
        // Count available accounts
        const available = await Account.countDocuments({ 
          game: game.name, 
          status: 'chưa bán' 
        });
        
        // Count sold accounts from orders (accounts may be deleted, but orders remain)
        // This ensures accurate count even if accounts are deleted
        const soldOrders = await Order.countDocuments({
          orderType: 'account',
          status: 'Hoàn thành',
          'items.game': game.name
        });
        
        // Also count from Account collection for accounts that haven't been deleted
        const soldFromAccounts = await Account.countDocuments({ 
          game: game.name, 
          status: 'đã bán' 
        });
        
        // Use the maximum to ensure accuracy (some might be in orders but deleted from accounts)
        const sold = Math.max(soldOrders, soldFromAccounts);
        
        return {
          ...game,
          available,
          sold
        };
      })
    );

    res.json({ games: gamesWithStats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get accounts by game name (public, only available accounts)
router.get('/by-game/:gameName', async (req, res) => {
  try {
    const gameName = decodeURIComponent(req.params.gameName);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const query = { 
      game: gameName,
      status: 'chưa bán' // Only show available accounts
    };

    const accounts = await Account.find(query)
      .select('-username -password') // Don't expose credentials
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Account.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      accounts,
      totalPages,
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Purchase account
router.post('/:id/purchase', authenticate, async (req, res) => {
  try {
    // Validate ObjectId
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid account ID' });
    }
    const account = await Account.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ message: 'Account không tồn tại' });
    }

    if (account.status === 'đã bán') {
      return res.status(400).json({ message: 'Account này đã được bán' });
    }

    const user = req.user;
    const finalPrice = account.discountedPrice;

    if (user.balance < finalPrice) {
      return res.status(400).json({ message: 'Số dư không đủ' });
    }

    // Update account status
    account.status = 'đã bán';
    account.buyerId = user._id;
    await account.save();

    // Deduct balance from user
    user.balance -= finalPrice;
    await user.save();

    // Create order record with all account information saved directly
    // This ensures history remains even if account is deleted
    const order = await Order.create({
      userId: user._id,
      orderType: 'account',
      items: [{
        type: 'account',
        accountId: account._id, // Keep for reference, but don't rely on it
        game: account.game,
        code: account.code,
        name: account.info || account.code,
        username: account.username, // Save credentials directly
        password: account.password,
        image: account.image || '',
        price: finalPrice,
        quantity: 1
      }],
      totalAmount: finalPrice,
      originalAmount: account.originalPrice,
      discountAmount: account.originalPrice - finalPrice,
      discount: account.originalPrice > 0 
        ? Math.round(((account.originalPrice - finalPrice) / account.originalPrice) * 100)
        : 0,
      status: 'Hoàn thành'
    });

    // Log activity
    const ActivityLog = require('../models/ActivityLog');
    await ActivityLog.create({
      userId: user._id,
      action: `Mua acc ${account.game} - MS: ${account.code} - Giá: ${finalPrice.toLocaleString('vi-VN')}đ`
    });

    // Return account with credentials (only for purchase)
    const accountWithCredentials = await Account.findById(account._id)
      .select('username password code game info image');

    res.json({
      message: 'Mua account thành công',
      account: accountWithCredentials,
      newBalance: user.balance,
      orderId: order._id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

