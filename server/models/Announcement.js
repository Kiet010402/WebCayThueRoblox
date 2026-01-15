const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, default: 'Thông Báo | Trang Chủ' },
  content: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});

announcementSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Announcement', announcementSchema);


