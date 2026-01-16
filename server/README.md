# Roblox Shop Backend

Node.js + Express API for the Roblox Web Shop

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with configuration:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000

# Email configuration for forgot password feature
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

**Note:** For Gmail, you need to:
1. Enable 2-factor authentication
2. Generate an "App Password" from your Google Account settings
3. Use the App Password in `EMAIL_PASSWORD` (not your regular password)

3. Start server:
```bash
npm start
```

Server runs on http://localhost:5000
