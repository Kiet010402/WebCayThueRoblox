const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: 'main'
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  revenueResetAt: {
    type: Date,
    default: null
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Use a single document with _id: 'main'
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne({ _id: 'main' });
  if (!settings) {
    settings = new this({ _id: 'main' });
    await settings.save();
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);

