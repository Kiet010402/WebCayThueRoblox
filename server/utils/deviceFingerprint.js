const crypto = require('crypto');

/**
 * Generate device fingerprint from request headers
 * This helps identify unique devices/browsers
 */
function generateDeviceFingerprint(req) {
  const components = [
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
    req.headers['accept-encoding'] || '',
    req.headers['accept'] || '',
    req.ip || req.connection.remoteAddress || ''
  ];
  
  const fingerprint = crypto
    .createHash('sha256')
    .update(components.join('|'))
    .digest('hex');
  
  return fingerprint.substring(0, 32); // Use first 32 chars
}

/**
 * Get client IP address (handles proxies)
 */
function getClientIP(req) {
  let ip =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.ip ||
    req.connection.remoteAddress ||
    'unknown';

  // Normalize common loopback / IPv4-mapped IPv6 so local dev doesn't look like "IP changed"
  if (typeof ip === 'string') {
    ip = ip.trim();
    if (ip === '::1') return '127.0.0.1';
    if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
  }

  return ip;
}

module.exports = {
  generateDeviceFingerprint,
  getClientIP
};
