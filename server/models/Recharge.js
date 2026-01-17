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
  originalAmount: {
    type: Number,
    default: function() {
      return this.amount;
    }
  },
  bonusAmount: {
    type: Number,
    default: 0
  },
  promotionPercent: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    required: true
  },
  billImage: {
    type: String, // URL to the uploaded image
    required: function() {
      return this.paymentMethod !== 'card';
    }
  },
  // Card information (for paymentMethod === 'card')
  cardType: {
    type: String,
    enum: {
      values: ['Vinaphone', 'Viettel', 'Mobifone', 'Zing', 'Garena'],
      message: 'Loại thẻ không hợp lệ'
    },
    default: undefined,
    required: function() {
      return this.paymentMethod === 'card';
    },
    validate: {
      validator: function(value) {
        // Only validate if paymentMethod is 'card'
        if (this.paymentMethod !== 'card') {
          return true; // Allow any value (including undefined/null) if not card payment
        }
        // If card payment, validate enum
        return ['Vinaphone', 'Viettel', 'Mobifone', 'Zing', 'Garena'].includes(value);
      },
      message: 'Loại thẻ không hợp lệ'
    }
  },
  cardCode: {
    type: String,
    default: ''
  },
  cardSerial: {
    type: String,
    default: ''
  },
  cardFee: {
    type: Number,
    default: 0
  },
  cardFeePercent: {
    type: Number,
    default: 0
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
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
});

// Index to optimize sorting by createdAt (admin views, reports)
rechargeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Recharge', rechargeSchema);

