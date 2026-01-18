const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      frameSrc: ["'self'", "https://www.youtube.com", "https://youtube.com", "https://youtu.be"],
      childSrc: ["'self'", "https://www.youtube.com", "https://youtube.com"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Middleware
// CORS configuration - allow both production and development URLs
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://webcaythueroblox-1.onrender.com',
  'http://localhost:3000'
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // In production, reject unknown origins
      if (process.env.NODE_ENV === 'production') {
        console.warn(`⚠️  Blocked request from unknown origin: ${origin}`);
        return callback(new Error('Not allowed by CORS'));
      }
      // In development, allow all origins
      callback(null, true);
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting - Adjusted to be less restrictive
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute (reduced from 15)
  max: 200, // Limit each IP to 200 requests per minute (increased from 100 per 15 min)
  message: 'Quá nhiều requests từ IP này, vui lòng thử lại sau.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/health' || req.path === '/';
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs (increased from 5)
  message: 'Quá nhiều lần thử đăng nhập, vui lòng thử lại sau 15 phút.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// More lenient limiter for frequent API calls (chat, user info, etc.)
const frequentAPILimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute for frequent calls
  message: 'Quá nhiều requests, vui lòng thử lại sau.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);
app.use('/api/users/forgot-password', authLimiter);
app.use('/api/users/reset-password', authLimiter);

// More lenient rate limiting for frequent API calls
app.use('/api/chat/unread-count', frequentAPILimiter);
app.use('/api/users/me', frequentAPILimiter);

// General rate limiting for other APIs
app.use('/api/', generalLimiter);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/roblox-shop', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

// Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/users', require('./routes/users'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/recharge', require('./routes/recharge'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/news', require('./routes/news'));
app.use('/api/announcement', require('./routes/announcement'));
app.use('/api/pricing', require('./routes/pricing'));
app.use('/api/vouchers', require('./routes/vouchers'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/blindbags', require('./routes/blindbags'));

// Serve static files from React production build
// This must come BEFORE the catch-all route
const buildPath = path.join(__dirname, '../client/build');
app.use(express.static(buildPath));

// Basic API route (only in development or if not serving React)
if (process.env.NODE_ENV === 'development' && !process.env.SERVE_REACT) {
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Roblox Shop API',
    status: 'running',
    endpoints: {
      products: '/api/products',
      users: '/api/users',
      orders: '/api/orders',
      recharge: '/api/recharge',
      admin: '/api/admin',
      news: '/api/news'
    }
  });
});
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Catch-all handler: send back React's index.html file for client-side routing
// This must be AFTER all API routes
app.get('*', (req, res) => {
  // Don't serve React app for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(buildPath, 'index.html'));
});

// Error handling middleware (must be last)
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
