const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

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
      callback(null, true); // Allow all origins in production for now
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// Basic route
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
