const mongoose = require('mongoose');

const balanceHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  initialBalance: {
    type: Number,
    required: true
  },
  changeAmount: {
    type: Number,
    required: true
  },
  currentBalance: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

balanceHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('BalanceHistory', balanceHistorySchema);

