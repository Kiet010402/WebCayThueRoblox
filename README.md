# Roblox Web Shop

A full-stack e-commerce platform for buying and selling Roblox items online.

## Project Structure

```
WebCayThueRoblox/
├── server/          # Node.js + Express backend
│   ├── models/      # MongoDB schemas
│   ├── routes/      # API routes
│   ├── server.js    # Main server file
│   └── package.json
├── client/          # React frontend
│   ├── public/      # Static files
│   ├── src/         # React components
│   └── package.json
└── README.md
```

## Features

- ✅ Product catalog with search and filtering
- ✅ User authentication (Register/Login)
- ✅ Shopping cart functionality
- ✅ Order management
- ✅ Responsive design
- 🔲 Payment integration (Coming soon)
- 🔲 Admin dashboard (Coming soon)

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## Installation

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/roblox-shop
JWT_SECRET=your_secret_key_here
NODE_ENV=development
```

4. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the React development server:
```bash
npm start
```

The application will open at `http://localhost:3000`

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Users
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user

### Orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order status

### Cart
- `GET /api/cart/:userId` - Get user's cart
- `POST /api/cart/:userId/add` - Add item to cart
- `POST /api/cart/:userId/remove` - Remove item from cart
- `POST /api/cart/:userId/clear` - Clear cart

## Database Schema

### User
```
{
  username: String,
  email: String,
  password: String (hashed),
  robloxUsername: String,
  createdAt: Date
}
```

### Product
```
{
  name: String,
  description: String,
  price: Number,
  image: String,
  category: String,
  inStock: Boolean,
  quantity: Number,
  robloxItemId: String,
  createdAt: Date
}
```

### Order
```
{
  userId: ObjectId,
  items: Array,
  totalAmount: Number,
  status: String,
  paymentMethod: String,
  shippingAddress: String,
  createdAt: Date
}
```

## Next Steps

1. **Add MongoDB**: Set up a local MongoDB instance or use MongoDB Atlas
2. **Add Test Products**: Use the admin API to add sample Roblox items
3. **Implement Payment**: Integrate Stripe or PayPal
4. **Add Admin Dashboard**: Create admin panel for managing products
5. **Deploy**: Deploy to Heroku, Vercel, or your preferred hosting

## Technologies Used

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT (JSON Web Tokens)
- Bcryptjs (Password hashing)

### Frontend
- React
- React Router
- Axios
- CSS3

## Contributing

Feel free to submit issues and enhancement requests!

## License

ISC
