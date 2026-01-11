# Roblox Web Shop - Development Instructions

This is a full-stack e-commerce platform for Roblox items.

## Project Overview

- **Backend**: Node.js + Express + MongoDB
- **Frontend**: React
- **Features**: Product catalog, user auth, shopping cart, orders

## Quick Start

### Backend
```bash
cd server
npm install
# Update .env with MongoDB URI
npm start
```

### Frontend
```bash
cd client
npm install
npm start
```

## API Architecture

REST API with Express running on port 5000
- `/api/products` - Product management
- `/api/users` - Authentication
- `/api/orders` - Order management
- `/api/cart` - Shopping cart

## Development Workflow

1. Backend changes: Modify files in `server/` and restart
2. Frontend changes: Modify files in `client/` and hot-reload will apply
3. Database: Connect to MongoDB instance

## Key Files

- `server/server.js` - API entry point
- `client/src/App.js` - React main component
- `server/models/` - MongoDB schemas
- `server/routes/` - API endpoints
- `client/src/pages/` - React pages

## Notes

- Frontend proxy set to `http://localhost:5000`
- JWT tokens stored in localStorage
- Cart data stored in memory (upgrade to DB for production)
- Password hashing with bcryptjs

## Future Enhancements

- Payment gateway (Stripe/PayPal)
- Admin dashboard
- Email notifications
- Real-time inventory
