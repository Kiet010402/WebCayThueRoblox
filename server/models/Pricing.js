const mongoose = require('mongoose');

const pricingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // e.g. "caythue"
  data: { type: mongoose.Schema.Types.Mixed, required: true }, // flexible JSON
  updatedAt: { type: Date, default: Date.now }
});

pricingSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Pricing', pricingSchema);


