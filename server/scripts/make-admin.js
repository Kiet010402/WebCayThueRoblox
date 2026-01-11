// Script để tạo admin user
// Chạy: node scripts/make-admin.js <username>

const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const username = process.argv[2];

if (!username) {
  console.log('Usage: node scripts/make-admin.js <username>');
  console.log('Example: node scripts/make-admin.js admin');
  process.exit(1);
}

async function makeAdmin() {
  try {
    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/roblox-shop', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Tìm user
    const user = await User.findOne({ username });
    
    if (!user) {
      console.log(`❌ Không tìm thấy user với username: ${username}`);
      process.exit(1);
    }

    // Update role thành admin
    user.role = 'admin';
    await user.save();

    console.log(`✅ Đã cập nhật user "${username}" thành admin thành công!`);
    console.log(`   User ID: ${user._id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

makeAdmin();

