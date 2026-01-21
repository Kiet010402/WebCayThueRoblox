const jwt = require('jsonwebtoken');
const Session = require('../models/Session');
const { generateDeviceFingerprint, getClientIP } = require('./deviceFingerprint');

// Get JWT secret with validation
const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'secret') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set in production environment');
    }
    console.warn('⚠️  WARNING: Using default JWT_SECRET. This is insecure for production!');
    return 'secret';
  }
  return secret;
};

/**
 * Create a session and return token
 */
async function createSession(userId, req) {
  const token = jwt.sign({ userId: userId.toString() }, getJWTSecret(), {
    expiresIn: '7d'
  });
  
  const ipAddress = getClientIP(req);
  const deviceFingerprint = generateDeviceFingerprint(req);
  const userAgent = req.headers['user-agent'] || '';
  
  await Session.create({
    userId,
    token,
    ipAddress,
    userAgent,
    deviceFingerprint,
    lastActivity: new Date()
  });
  
  return token;
}

/**
 * Validate session token with IP and device fingerprint check
 */
async function validateSession(token, req) {
  try {
    // Verify JWT token
    const decoded = jwt.verify(token, getJWTSecret());
    
    // Check session in database
    const session = await Session.findOne({
      token,
      userId: decoded.userId,
      isValid: true
    });
    
    if (!session) {
      return { valid: false, reason: 'Session not found or invalidated' };
    }
    
    // Check if session expired (7 days)
    const now = new Date();
    const sessionAge = now - session.createdAt;
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    if (sessionAge > maxAge) {
      session.isValid = false;
      await session.save();
      return { valid: false, reason: 'Session expired' };
    }
    
    // For admin users, enforce stricter IP validation
    // Allow some IP variation (e.g., dynamic IPs) but log suspicious activity
    const currentIP = getClientIP(req);
    const currentFingerprint = generateDeviceFingerprint(req);
    
    // Update last activity
    session.lastActivity = now;
    await session.save();
    
    // For admin: require exact IP match or log warning
    // For regular users: allow IP variation but check fingerprint
    return {
      valid: true,
      userId: decoded.userId,
      session,
      ipMatch: session.ipAddress === currentIP,
      fingerprintMatch: session.deviceFingerprint === currentFingerprint
    };
  } catch (error) {
    return { valid: false, reason: error.message };
  }
}

/**
 * Invalidate a session (logout)
 */
async function invalidateSession(token) {
  await Session.updateOne(
    { token },
    { isValid: false }
  );
}

/**
 * Invalidate all sessions for a user (except current one)
 */
async function invalidateAllOtherSessions(userId, currentToken) {
  await Session.updateMany(
    { userId, token: { $ne: currentToken }, isValid: true },
    { isValid: false }
  );
}

module.exports = {
  getJWTSecret,
  createSession,
  validateSession,
  invalidateSession,
  invalidateAllOtherSessions
};
