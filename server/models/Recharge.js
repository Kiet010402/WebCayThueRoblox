const mongoose = require('mongoose');

const rechargeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 5000
  },
  paymentMethod: {
    type: String,
    required: true
  },
  billImage: {
    type: String, // URL to the uploaded image
    required: true
  },
  status: {
    type: String,
    enum: ['Đang xử lí', 'Hoàn thành', 'Từ chối'],
    default: 'Đang xử lí'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    default: ''
  }
});

// Index to optimize sorting by createdAt (admin views, reports)
rechargeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Recharge', rechargeSchema);

