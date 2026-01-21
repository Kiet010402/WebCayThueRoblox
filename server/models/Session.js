const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    default: ''
  },
  deviceFingerprint: {
    type: String,
    default: ''
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 7 * 24 * 60 * 60 // 7 days TTL
  },
  isValid: {
    type: Boolean,
    default: true
  }
});

// Index for faster lookups
sessionSchema.index({ userId: 1, isValid: 1 });
sessionSchema.index({ token: 1, isValid: 1 });
sessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

module.exports = mongoose.model('Session', sessionSchema);
