// Password validation
const validatePassword = (password) => {
  const errors = [];
  
  if (!password || password.length < 6) {
    errors.push('Mật khẩu phải có ít nhất 6 ký tự');
  }
  
  if (password.length > 50) {
    errors.push('Mật khẩu không được vượt quá 50 ký tự');
  }
  
  // Optional: Add more complexity requirements
  // if (!/[A-Z]/.test(password)) {
  //   errors.push('Mật khẩu phải có ít nhất 1 chữ hoa');
  // }
  // if (!/[a-z]/.test(password)) {
  //   errors.push('Mật khẩu phải có ít nhất 1 chữ thường');
  // }
  // if (!/[0-9]/.test(password)) {
  //   errors.push('Mật khẩu phải có ít nhất 1 số');
  // }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Email validation
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Username validation
const validateUsername = (username) => {
  const errors = [];
  
  if (!username || username.trim().length < 3) {
    errors.push('Tên đăng nhập phải có ít nhất 3 ký tự');
  }
  
  if (username.length > 20) {
    errors.push('Tên đăng nhập không được vượt quá 20 ký tự');
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Sanitize string input
const sanitizeString = (str, maxLength = 1000) => {
  if (typeof str !== 'string') return '';
  return str.trim().substring(0, maxLength);
};

// Validate ObjectId
const validateObjectId = (id) => {
  const mongoose = require('mongoose');
  return mongoose.Types.ObjectId.isValid(id);
};

module.exports = {
  validatePassword,
  validateEmail,
  validateUsername,
  sanitizeString,
  validateObjectId
};
