const jwt = require('jsonwebtoken');

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

module.exports = {
  getJWTSecret
};
