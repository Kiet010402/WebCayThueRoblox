const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  game: {
    type: String,
    required: true
  },
  info: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
accountSchema.index({ code: 1 });
accountSchema.index({ game: 1 });
accountSchema.index({ status: 1 });
accountSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Account', accountSchema);

