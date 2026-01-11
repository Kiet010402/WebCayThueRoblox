const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderType: {
    type: String,
    enum: ['product', 'service'],
    default: 'product'
  },
  // For product orders
  items: [{
    productId: mongoose.Schema.Types.ObjectId,
    quantity: Number,
    price: Number
  }],
  // For service orders
  serviceName: String,
  gameName: String,
  serviceCategory: String,
  robloxUsername: String,
  robloxPassword: String,
  backupCode: String,
  notes: String,
  totalAmount: Number,
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

module.exports = mongoose.model('Order', orderSchema);
