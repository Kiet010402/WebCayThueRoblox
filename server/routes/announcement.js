const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');

// Public: get current homepage announcement
router.get('/', async (req, res) => {
  try {
    let announcement = await Announcement.findOne().lean();
    if (!announcement) {
      announcement = { title: 'Thông Báo | Trang Chủ', content: '' };
    }
    res.json(announcement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;


