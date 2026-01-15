const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    // Discount percentage (1 - 100)
    discount: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    // Áp dụng cho đơn từ số tiền này trở lên (đơn vị: đ)
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    // Ngày hết hạn
    expiresAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired'],
      default: 'active',
    },
    usedByUsers: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Voucher', voucherSchema);


