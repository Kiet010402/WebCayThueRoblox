const { validateSession } = require('../utils/auth');
const User = require('../models/User');

/**
 * Middleware to authenticate user using session token from httpOnly cookie
 * Falls back to Authorization header for backward compatibility
 */
const authenticateSession = async (req, res, next) => {
  try {
    // Try to get token from httpOnly cookie first
    let token = req.cookies?.authToken;
    
    // Fallback to Authorization header for backward compatibility
    if (!token) {
      const authHeader = req.headers['authorization'];
      token = authHeader && authHeader.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
    }
    
    // Validate session
    const validation = await validateSession(token, req);
    
    if (!validation.valid) {
      return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
    }
    
    // Get user info
    const user = await User.findById(validation.userId);
    if (!user) {
      return res.status(401).json({ message: 'Người dùng không tồn tại' });
    }
    
    // Optional debug: admin IP/device mismatch warning (off by default)
    if (process.env.LOG_ADMIN_DEVICE_MISMATCH === 'true' && user.role === 'admin') {
      if (!validation.ipMatch || !validation.fingerprintMatch) {
        const { getClientIP } = require('../utils/deviceFingerprint');
        console.warn(`⚠️  Admin login from different IP/Device:`, {
          userId: user._id,
          username: user.username,
          originalIP: validation.session.ipAddress,
          currentIP: getClientIP(req),
          ipMatch: validation.ipMatch,
          fingerprintMatch: validation.fingerprintMatch
        });
      }
    }
    
    req.userId = validation.userId;
    req.session = validation.session;
    req.user = user;
    next();
  } catch (error) {
    console.error('Session auth error:', error);
    return res.status(500).json({ message: 'Lỗi xác thực' });
  }
};

/**
 * Middleware to authenticate admin using session token
 */
const authenticateAdminSession = async (req, res, next) => {
  try {
    // Try to get token from httpOnly cookie first
    let token = req.cookies?.authToken;
    
    // Fallback to Authorization header for backward compatibility
    if (!token) {
      const authHeader = req.headers['authorization'];
      token = authHeader && authHeader.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
    }
    
    // Validate session
    const { validateSession } = require('../utils/auth');
    const validation = await validateSession(token, req);
    
    if (!validation.valid) {
      return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
    }
    
    // Get user info
    const User = require('../models/User');
    const user = await User.findById(validation.userId);
    if (!user) {
      return res.status(401).json({ message: 'Người dùng không tồn tại' });
    }
    
    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }
    
    // Optional debug: admin IP/device mismatch warning (off by default)
    if (process.env.LOG_ADMIN_DEVICE_MISMATCH === 'true') {
      if (!validation.ipMatch || !validation.fingerprintMatch) {
        const { getClientIP } = require('../utils/deviceFingerprint');
        console.warn(`⚠️  Admin login from different IP/Device:`, {
          userId: user._id,
          username: user.username,
          originalIP: validation.session.ipAddress,
          currentIP: getClientIP(req),
          ipMatch: validation.ipMatch,
          fingerprintMatch: validation.fingerprintMatch
        });
      }
    }
    
    req.userId = validation.userId;
    req.session = validation.session;
    req.user = user;
    req.admin = user;
    next();
  } catch (error) {
    console.error('Admin session auth error:', error);
    return res.status(500).json({ message: 'Lỗi xác thực' });
  }
};

module.exports = {
  authenticateSession,
  authenticateAdminSession
};
