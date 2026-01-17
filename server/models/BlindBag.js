const mongoose = require('mongoose');

const blindBagSchema = new mongoose.Schema({
  game: {
    type: String,
    required: true
  },
  premiumRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0 // Tỉ lệ ra acc xịn (%)
  },
  image: {
    type: String,
    default: ''
  },
  info: {
    type: String,
    default: ''
  },
  originalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  discountedPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalAccounts: {
    type: Number,
    default: 0
  },
  soldAccounts: {
    type: Number,
    default: 0
  },
  availableAccounts: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
blindBagSchema.index({ game: 1 });
blindBagSchema.index({ createdAt: -1 });

module.exports = mongoose.model('BlindBag', blindBagSchema);
