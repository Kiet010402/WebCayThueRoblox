const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderType: {
    type: String,
    enum: ['product', 'service', 'account'],
    default: 'product'
  },
  // For product and account orders
  items: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  // For service orders
  serviceName: String,
  gameName: String,
  serviceCategory: String,
  robloxUsername: String,
  robloxPassword: String,
  backupCode: String,
  notes: String,
  totalAmount: Number,
  originalAmount: Number,
  discount: Number,
  discountAmount: Number,
  // Game discount fields
  gameDiscountPercent: Number,
  gameDiscountAmount: Number,
  // Voucher discount fields
  voucherCode: String,
  voucherDiscount: Number,
  voucherDiscountAmount: Number,
  // Total discount amount (sum of all discounts)
  totalDiscountAmount: Number,
  status: {
    type: String,
    enum: ['pending', 'Đang xử lí', 'Đang cày', 'Hoàn thành', 'cancelled'],
    default: 'Đang xử lí'
  },
  paymentMethod: String,
  shippingAddress: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes to optimize common admin queries
orderSchema.index({ createdAt: -1 });
orderSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
