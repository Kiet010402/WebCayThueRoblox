const mongoose = require('mongoose');

const blindBagAccountSchema = new mongoose.Schema({
  blindBagId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BlindBag',
    required: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  accountType: {
    type: String,
    enum: ['xịn', 'thường'],
    required: true,
    default: 'thường'
  },
  status: {
    type: String,
    enum: ['chưa bán', 'đã bán'],
    default: 'chưa bán'
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  soldAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
blindBagAccountSchema.index({ blindBagId: 1 });
blindBagAccountSchema.index({ code: 1 });
blindBagAccountSchema.index({ status: 1 });
blindBagAccountSchema.index({ accountType: 1 });
blindBagAccountSchema.index({ createdAt: -1 });

module.exports = mongoose.model('BlindBagAccount', blindBagAccountSchema);
