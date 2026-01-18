const mongoose = require('mongoose');

const monthlyRechargeStatsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: Number, // 1-12
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    default: 0,
    required: true
  }
}, {
  timestamps: true
});

// Compound index to ensure one record per user per month
monthlyRechargeStatsSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('MonthlyRechargeStats', monthlyRechargeStatsSchema);
