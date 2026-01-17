const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const News = require('../models/News');
const User = require('../models/User');
const { getJWTSecret } = require('../utils/auth');
const { validateObjectId } = require('../utils/validation');

// Middleware to verify admin
const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token không tồn tại' });
  }

  try {
    const decoded = jwt.verify(token, getJWTSecret());
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token không hợp lệ' });
  }
};

// Get all news (public)
router.get('/', async (req, res) => {
  try {
    const news = await News.find().sort({ createdAt: -1 });
    res.json(news);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single news (public)
router.get('/:id', async (req, res) => {
  try {
    // Validate ObjectId
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid news ID' });
    }
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).json({ message: 'News not found' });
    res.json(news);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create news (admin only)
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { title, content, category, url } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ message: 'Title và content là bắt buộc' });
    }

    const news = new News({
      title,
      content,
      category: category || '📢 Thông Báo',
      url: url || ''
    });

    const newNews = await news.save();
    res.status(201).json(newNews);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update news (admin only)
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    // Validate ObjectId
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid news ID' });
    }
    const { title, content, category, url } = req.body;
    
    const updateData = { updatedAt: new Date() };
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (category) updateData.category = category;
    if (url !== undefined) updateData.url = url;

    const news = await News.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!news) return res.status(404).json({ message: 'News not found' });
    
    res.json(news);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete news (admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    // Validate ObjectId
    if (!validateObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid news ID' });
    }
    const news = await News.findByIdAndDelete(req.params.id);
    if (!news) return res.status(404).json({ message: 'News not found' });
    res.json({ message: 'Xóa tin tức thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

