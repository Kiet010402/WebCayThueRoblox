const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { getJWTSecret } = require('../utils/auth');
const { uploadImage } = require('../utils/cloudinary');

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

// Upload image to Cloudinary
router.post('/image', authenticateToken, async (req, res) => {
  try {
    const { image } = req.body;

    if (!image || typeof image !== 'string') {
      return res.status(400).json({ message: 'Vui lòng gửi ảnh dạng base64' });
    }

    // Validate base64 format
    if (!image.startsWith('data:image/')) {
      return res.status(400).json({ message: 'Định dạng ảnh không hợp lệ' });
    }

    // Check image size (base64 is ~33% larger than original)
    // Limit to 5MB original size = ~6.7MB base64
    if (image.length > 7 * 1024 * 1024) {
      return res.status(400).json({ message: 'Kích thước ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB' });
    }

    // Upload to Cloudinary
    const imageUrl = await uploadImage(image, 'bill-images');

    res.json({
      success: true,
      imageUrl: imageUrl
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: error.message || 'Có lỗi xảy ra khi upload ảnh' 
    });
  }
});

module.exports = router;
