// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Don't expose error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Dữ liệu không hợp lệ',
      errors: isDevelopment ? err.errors : undefined
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      message: 'Dữ liệu đã tồn tại'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(403).json({
      message: 'Token không hợp lệ'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(403).json({
      message: 'Token đã hết hạn'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    message: err.message || 'Có lỗi xảy ra',
    ...(isDevelopment && { stack: err.stack })
  });
};

module.exports = errorHandler;
