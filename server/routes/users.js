const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const BalanceHistory = require('../models/BalanceHistory');
const Order = require('../models/Order');
const Account = require('../models/Account');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { getJWTSecret, createSession, invalidateSession, invalidateAllOtherSessions } = require('../utils/auth');
const { validatePassword, validateEmail, validateUsername, sanitizeString } = require('../utils/validation');
const { authenticateSession } = require('../middleware/sessionAuth');

// Register
router.post('/register', async (req, res) => {
  let { username, email, password } = req.body;

  try {
    // Sanitize inputs
    username = sanitizeString(username, 20);
    email = sanitizeString(email, 100).toLowerCase();
    password = password ? String(password) : '';

    // Validate inputs
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      return res.status(400).json({ message: usernameValidation.errors[0] });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Email không hợp lệ' });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ message: passwordValidation.errors[0] });
    }

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'Email đã tồn tại' });

    user = await User.findOne({ username });
    if (user) return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });

    user = new User({
      username,
      email,
      password
    });

    await user.save();

    // Create session and get token
    const token = await createSession(user._id, req);

    // Set httpOnly cookie (secure, httpOnly, sameSite for CSRF protection)
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: isProduction, // Only send over HTTPS in production
      // Use 'none' in production to allow cookies when frontend and API are on different domains (Render)
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });

    // Log activity
    await ActivityLog.create({
      userId: user._id,
      action: 'Đăng ký tài khoản mới',
      ipAddress: req.ip || req.connection.remoteAddress
    });

    // Return minimal user info (no token, no sensitive data)
    res.status(201).json({
      user: {
        id: user._id,
        username: user.username,
        balance: user.balance || 0,
        role: user.role || 'user'
        // Don't send email or other sensitive info
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login with username
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Tên đăng nhập không tồn tại' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Mật khẩu không chính xác' });

    // If user is admin, require 2FA via email code
    if (user.role === 'admin') {
      // Generate 6-digit code
      const loginCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Save code and expiry (10 minutes)
      user.adminLoginCode = loginCode;
      user.adminLoginCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      // Check if email service is properly configured
      const useOAuth2 = !!(process.env.GMAIL_CLIENT_ID && 
                           process.env.GMAIL_CLIENT_SECRET && 
                           process.env.GMAIL_REFRESH_TOKEN);
      const useAppPassword = !!(process.env.EMAIL_PASSWORD && 
                                process.env.EMAIL_PASSWORD !== 'your_app_password' &&
                                process.env.EMAIL_PASSWORD.trim() !== '');
      
      const isEmailConfigured = !!(process.env.EMAIL_USER && 
                                process.env.EMAIL_USER !== 'your_email@gmail.com' &&
                                   (useOAuth2 || (useAppPassword && transporter)));

      if (!isEmailConfigured) {
        // For development: log the code to console
        console.log('========================================');
        console.log('ADMIN LOGIN CODE (Development Mode):');
        console.log(`Email: ${user.email}`);
        console.log(`Code: ${loginCode}`);
        console.log('========================================');
        
        // Return success with code in response for development
        return res.json({ 
          requiresCode: true,
          email: user.email,
          message: 'Mã xác nhận đã được tạo (Email chưa được cấu hình - xem console)',
          code: loginCode,
          devMode: true
        });
      }

      // Send email with retry logic
      const sendEmailWithRetry = async (retries = 2) => {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: 'Mã xác nhận đăng nhập Admin - taphoakaihon',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2196F3;">Xác thực đăng nhập Admin</h2>
              <p>Xin chào <strong>${user.username}</strong>,</p>
              <p>Bạn đang cố gắng đăng nhập vào tài khoản Admin. Sử dụng mã xác nhận sau để hoàn tất đăng nhập:</p>
              <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                <h1 style="color: #2196F3; font-size: 32px; margin: 0; letter-spacing: 8px;">${loginCode}</h1>
              </div>
              <p><strong>Lưu ý:</strong> Mã này sẽ hết hạn sau 10 phút.</p>
              <p>Nếu bạn không yêu cầu đăng nhập, vui lòng bỏ qua email này và thay đổi mật khẩu ngay lập tức.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #999; font-size: 12px;">Email này được gửi tự động, vui lòng không trả lời.</p>
            </div>
          `
        };

        // Ensure transporter is ready
        const emailTransporter = await getTransporter();
        if (!emailTransporter) {
          throw new Error('Email transporter is not configured');
        }
        
        for (let attempt = 0; attempt <= retries; attempt++) {
          try {
            // For OAuth2, try Gmail API first (bypasses SMTP, works on Render.com)
            const useOAuth2 = process.env.GMAIL_CLIENT_ID && 
                             process.env.GMAIL_CLIENT_SECRET && 
                             process.env.GMAIL_REFRESH_TOKEN;
            
            if (useOAuth2) {
              // Use Gmail API directly (bypasses SMTP, avoids firewall issues)
              console.log(`Sending admin login code via Gmail API (attempt ${attempt + 1})...`);
              await sendEmailViaGmailAPI(mailOptions);
              console.log('Admin login code sent successfully via Gmail API!');
              return true;
            } else {
              // Fallback to SMTP for non-OAuth2
              console.log(`Sending admin login code via SMTP (attempt ${attempt + 1})...`);
              await emailTransporter.sendMail(mailOptions);
              console.log('Admin login code sent successfully via SMTP!');
              return true;
            }
          } catch (error) {
            console.error(`Email sending attempt ${attempt + 1} failed:`, error.message);
            
            // If it's the last attempt, throw the error
            if (attempt === retries) {
              throw error;
            }
            
            // Wait before retry (exponential backoff)
            const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s...
            console.log(`Retrying in ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      };

      try {
        await sendEmailWithRetry(2); // Retry up to 2 times (3 total attempts)
        return res.json({ 
          requiresCode: true,
          email: user.email,
          message: 'Mã xác nhận đã được gửi đến email của bạn. Vui lòng kiểm tra email và nhập mã để hoàn tất đăng nhập.'
        });
      } catch (emailError) {
        console.error('Email sending error (all retries failed):', emailError);
        
        // Clear the code if email fails
        user.adminLoginCode = undefined;
        user.adminLoginCodeExpires = undefined;
        await user.save();
        
        // In development, still return the code
        if (process.env.NODE_ENV !== 'production') {
          console.log('========================================');
          console.log('ADMIN LOGIN CODE (Email failed):');
          console.log(`Email: ${user.email}`);
          console.log(`Code: ${loginCode}`);
          console.log('========================================');
          return res.json({ 
            requiresCode: true,
            email: user.email,
            message: 'Không thể gửi email. Mã xác nhận (xem console):',
            code: loginCode, // Remove this in production!
            devMode: true,
            error: emailError.message
          });
        }
        
        // Provide more helpful error message
        let errorMessage = 'Không thể gửi email. Vui lòng thử lại sau.';
        if (emailError.code === 'ETIMEDOUT' || emailError.code === 'ECONNREFUSED') {
          errorMessage = 'Không thể kết nối đến máy chủ email. Vui lòng kiểm tra cấu hình email hoặc thử lại sau.';
        }
        
        return res.status(500).json({ message: errorMessage });
      }
    }

    // For non-admin users, proceed with normal login
    // Update last login and device
    user.lastLogin = new Date();
    user.device = req.headers['user-agent'] || '';
    await user.save();

    // Invalidate all other sessions for this user (optional: for security)
    // Uncomment if you want to force single session per user:
    // await invalidateAllOtherSessions(user._id, null);

    // Create session and get token
    const token = await createSession(user._id, req);

    // Set httpOnly cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: isProduction,
      // Use 'none' in production to allow cross-site cookie on Render
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    // Log activity
    await ActivityLog.create({
      userId: user._id,
      action: 'Đăng nhập vào website',
      ipAddress: req.ip || req.connection.remoteAddress
    });

    // Return minimal user info (no token, no email)
    res.json({
      user: {
        id: user._id,
        username: user.username,
        balance: user.balance || 0,
        role: user.role || 'user'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user info (using session auth)
router.get('/me', authenticateSession, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -adminLoginCode -adminLoginCodeExpires -resetPasswordCode -resetPasswordExpires');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Return minimal user info (no email or sensitive data)
    res.json({
      id: user._id,
      username: user.username,
      fullName: user.fullName || '',
      phone: user.phone || '',
      telegramChatId: user.telegramChatId || '',
      balance: user.balance || 0,
      discount: user.discount || 0,
      role: user.role || 'user',
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
      // Don't send email, device, or other sensitive info
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy thông tin user' });
  }
});

// Logout endpoint
router.post('/logout', authenticateSession, async (req, res) => {
  try {
    // Get token from cookie or header
    const token = req.cookies?.authToken || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
    
    if (token) {
      await invalidateSession(token);
    }
    
    // Clear cookie
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      // Match cookie settings used when setting the cookie
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'
    });
    
    res.json({ message: 'Đăng xuất thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get activity log
router.get('/activity-log', authenticateSession, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      ActivityLog.find({ userId: req.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ActivityLog.countDocuments({ userId: req.userId })
    ]);

    res.json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get balance history
router.get('/balance-history', authenticateSession, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 7;
    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      BalanceHistory.find({ userId: req.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BalanceHistory.countDocuments({ userId: req.userId })
    ]);

    res.json({
      history,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Change password
router.put('/change-password', authenticateSession, async (req, res) => {
  try {
    let { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    // Sanitize and validate new password
    newPassword = String(newPassword);
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ message: passwordValidation.errors[0] });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Mật khẩu mới không khớp' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Configure nodemailer transporter
let transporter = null;

// OAuth2 helper function to get access token
async function getOAuth2AccessToken() {
  const { google } = require('googleapis');
  
  if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET || !process.env.GMAIL_REFRESH_TOKEN) {
    throw new Error('OAuth2 credentials are missing');
  }
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID.trim(),
    process.env.GMAIL_CLIENT_SECRET.trim(),
    'http://localhost:3000'
  );
  
  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN.trim()
  });
  
  try {
    const { token, res } = await oauth2Client.getAccessToken();
    
    if (!token) {
      console.error('Access token is null. Response:', res?.data);
      throw new Error('Failed to get access token - token is null');
    }
    
    console.log('OAuth2 access token obtained successfully, length:', token.length);
    return token;
  } catch (error) {
    console.error('Error getting OAuth2 access token:', error.message);
    console.error('Error details:', {
      code: error.code,
      response: error.response?.data
    });
    
    // Check if it's an invalid grant error (refresh token expired/revoked)
    if (error.message.includes('invalid_grant') || error.response?.data?.error === 'invalid_grant') {
      console.error('⚠️ Refresh token may be invalid or expired. Please run get-oauth2-token.js again to get a new refresh token.');
    }
    
    throw error;
  }
}

// Send email using Gmail API directly (bypasses SMTP, works on Render.com)
async function sendEmailViaGmailAPI(mailOptions) {
  const { google } = require('googleapis');
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID.trim(),
    process.env.GMAIL_CLIENT_SECRET.trim(),
    'http://localhost:3000'
  );
  
  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN.trim()
  });
  
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  
  // Encode subject with UTF-8 for proper Vietnamese character support
  const encodeSubject = (subject) => {
    return `=?UTF-8?B?${Buffer.from(subject, 'utf-8').toString('base64')}?=`;
  };
  
  // Create email message in RFC 2822 format with proper encoding
  const message = [
    `From: ${mailOptions.from}`,
    `To: ${mailOptions.to}`,
    `Subject: ${encodeSubject(mailOptions.subject)}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=utf-8`,
    `Content-Transfer-Encoding: base64`,
    '',
    Buffer.from(mailOptions.html, 'utf-8').toString('base64')
  ].join('\n');
  
  // Encode message in base64url format
  const encodedMessage = Buffer.from(message, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  try {
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });
    
    console.log('Email sent via Gmail API successfully. Message ID:', response.data.id);
    return true;
  } catch (error) {
    console.error('Gmail API error:', error.message);
    if (error.response) {
      console.error('Gmail API error details:', error.response.data);
    }
    throw error;
  }
}

// Get or create transporter (ensures it's ready before use)
async function getTransporter() {
  const emailService = process.env.EMAIL_SERVICE || 'gmail';
  const useOAuth2 = process.env.GMAIL_CLIENT_ID && 
                    process.env.GMAIL_CLIENT_SECRET && 
                    process.env.GMAIL_REFRESH_TOKEN;
  
  if (emailService.toLowerCase() === 'gmail' && useOAuth2) {
    // For OAuth2, always get fresh access token and create new transporter
    // This ensures token is always valid
    try {
      const accessToken = await getOAuth2AccessToken();
      
      // Use explicit SMTP configuration for better compatibility with cloud platforms
      // Try port 465 (SSL) first, as it's more reliable on some cloud platforms
      return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
          type: 'OAuth2',
          user: process.env.EMAIL_USER,
          clientId: process.env.GMAIL_CLIENT_ID,
          clientSecret: process.env.GMAIL_CLIENT_SECRET,
          refreshToken: process.env.GMAIL_REFRESH_TOKEN,
          accessToken: accessToken
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 60000, // 60 seconds
        greetingTimeout: 30000, // 30 seconds
        socketTimeout: 60000, // 60 seconds
        // Retry configuration
        pool: false, // Disable pooling for OAuth2
        maxConnections: 1,
        maxMessages: 1
      });
    } catch (err) {
      console.error('Failed to create OAuth2 transporter:', err);
      throw err;
    }
  }
  
  // For non-OAuth2, return existing transporter
  if (transporter) {
    return transporter;
  }
  
  throw new Error('Email transporter is not configured');
}

// Only create transporter if email config exists
if (process.env.EMAIL_USER) {
  const emailService = process.env.EMAIL_SERVICE || 'gmail';
  
  // Check if using OAuth2 (preferred) or App Password
  const useOAuth2 = process.env.GMAIL_CLIENT_ID && 
                    process.env.GMAIL_CLIENT_SECRET && 
                    process.env.GMAIL_REFRESH_TOKEN;

  if (emailService.toLowerCase() === 'gmail' && useOAuth2) {
    // Use OAuth2 (recommended for production)
    // Don't verify on startup, will create transporter on demand with fresh token
    console.log('OAuth2 email configuration detected - will use Gmail API directly (bypasses SMTP)');
    console.log('This method works on Render.com and other cloud platforms that block SMTP');
    // Transporter will be created in getTransporter() function when needed
  } else if (emailService.toLowerCase() === 'gmail' && process.env.EMAIL_PASSWORD) {
    // Fallback to App Password (for backward compatibility)
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
      pool: true,
      maxConnections: 1,
      maxMessages: 3
    });
    console.log('Email transporter configured with App Password (fallback)');
  } else {
    // Other email services
  transporter = nodemailer.createTransport({
      service: emailService,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
      },
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000
    });
    console.log(`Email transporter configured for ${emailService}`);
  }
  
  // Verify connection on startup (optional)
  if (transporter) {
    transporter.verify(function (error, success) {
      if (error) {
        console.log('Email transporter verification failed:', error.message);
        console.log('Email will still attempt to send, but may fail');
      } else {
        console.log('Email transporter is ready to send messages');
    }
  });
  }
}

// Forgot password - Send reset code via email
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: 'Vui lòng nhập email' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // For security, don't reveal if email exists
      return res.json({ message: 'Nếu email tồn tại, mã xác nhận đã được gửi' });
    }

    // Generate 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save code and expiry (10 minutes)
    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Check if email service is properly configured
    const useOAuth2 = !!(process.env.GMAIL_CLIENT_ID && 
                         process.env.GMAIL_CLIENT_SECRET && 
                         process.env.GMAIL_REFRESH_TOKEN);
    const useAppPassword = !!(process.env.EMAIL_PASSWORD && 
                              process.env.EMAIL_PASSWORD !== 'your_app_password' &&
                              process.env.EMAIL_PASSWORD.trim() !== '');
    
    // For OAuth2, transporter is created on-demand, so don't require it to exist
    // For App Password, need transporter to exist
    const isEmailConfigured = !!(process.env.EMAIL_USER && 
                              process.env.EMAIL_USER !== 'your_email@gmail.com' &&
                                 (useOAuth2 || (useAppPassword && transporter)));

    console.log('Email config check:', {
      hasEmailUser: !!process.env.EMAIL_USER,
      emailUser: process.env.EMAIL_USER,
      useOAuth2,
      hasClientId: !!process.env.GMAIL_CLIENT_ID,
      hasClientSecret: !!process.env.GMAIL_CLIENT_SECRET,
      hasRefreshToken: !!process.env.GMAIL_REFRESH_TOKEN,
      useAppPassword,
      hasTransporter: !!transporter,
      isEmailConfigured
    });

    if (!isEmailConfigured) {
      // For development: log the code to console
      console.log('========================================');
      console.log('RESET PASSWORD CODE (Development Mode):');
      console.log(`Email: ${email}`);
      console.log(`Code: ${resetCode}`);
      console.log('========================================');
      
      // Return success with code in response for development
      return res.json({ 
        message: 'Mã xác nhận đã được tạo (Email chưa được cấu hình - xem console)',
        code: resetCode,
        devMode: true
      });
    }

    // Send email with retry logic
    const sendEmailWithRetry = async (retries = 2) => {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Mã xác nhận đặt lại mật khẩu - taphoakaihon', // UTF-8 Vietnamese text
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2196F3;">Đặt lại mật khẩu</h2>
            <p>Xin chào <strong>${user.username}</strong>,</p>
            <p>Bạn đã yêu cầu đặt lại mật khẩu. Sử dụng mã xác nhận sau để đặt lại mật khẩu:</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h1 style="color: #2196F3; font-size: 32px; margin: 0; letter-spacing: 8px;">${resetCode}</h1>
            </div>
            <p><strong>Lưu ý:</strong> Mã này sẽ hết hạn sau 10 phút.</p>
            <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">Email này được gửi tự động, vui lòng không trả lời.</p>
          </div>
        `
      };

      // Ensure transporter is ready
      const emailTransporter = await getTransporter();
      if (!emailTransporter) {
        throw new Error('Email transporter is not configured');
      }
      
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          // For OAuth2, try Gmail API first (bypasses SMTP, works on Render.com)
          const useOAuth2 = process.env.GMAIL_CLIENT_ID && 
                           process.env.GMAIL_CLIENT_SECRET && 
                           process.env.GMAIL_REFRESH_TOKEN;
          
          if (useOAuth2) {
            // Use Gmail API directly (bypasses SMTP, avoids firewall issues)
            console.log(`Sending email via Gmail API (attempt ${attempt + 1})...`);
            await sendEmailViaGmailAPI(mailOptions);
            console.log('Email sent successfully via Gmail API!');
            return true;
          } else {
            // Fallback to SMTP for non-OAuth2
            console.log(`Sending email via SMTP (attempt ${attempt + 1})...`);
            await emailTransporter.sendMail(mailOptions);
            console.log('Email sent successfully via SMTP!');
            return true;
          }
        } catch (error) {
          console.error(`Email sending attempt ${attempt + 1} failed:`, error.message);
          console.error('Error details:', {
            code: error.code,
            command: error.command,
            response: error.response?.data,
            responseCode: error.responseCode
          });
          
          // If it's the last attempt, throw the error
          if (attempt === retries) {
            throw error;
          }
          
          // Wait before retry (exponential backoff)
          const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s...
          console.log(`Retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    };

    try {
      await sendEmailWithRetry(2); // Retry up to 2 times (3 total attempts)
      res.json({ message: 'Mã xác nhận đã được gửi đến email của bạn' });
    } catch (emailError) {
      console.error('Email sending error (all retries failed):', emailError);
      console.error('Error details:', {
        code: emailError.code,
        command: emailError.command,
        response: emailError.response,
        responseCode: emailError.responseCode
      });
      
      // Clear the code if email fails
      user.resetPasswordCode = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      // In development, still return the code
      if (process.env.NODE_ENV !== 'production') {
        console.log('========================================');
        console.log('RESET PASSWORD CODE (Email failed):');
        console.log(`Email: ${email}`);
        console.log(`Code: ${resetCode}`);
        console.log('========================================');
        return res.json({ 
          message: 'Không thể gửi email. Mã xác nhận (xem console):',
          code: resetCode, // Remove this in production!
          devMode: true,
          error: emailError.message
        });
      }
      
      // Provide more helpful error message
      let errorMessage = 'Không thể gửi email. Vui lòng thử lại sau.';
      if (emailError.code === 'ETIMEDOUT' || emailError.code === 'ECONNREFUSED') {
        errorMessage = 'Không thể kết nối đến máy chủ email. Vui lòng kiểm tra cấu hình email hoặc thử lại sau.';
      }
      
      return res.status(500).json({ message: errorMessage });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Reset password - Verify code and set new password
router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword, confirmPassword } = req.body;

  try {
    if (!email || !code || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Mật khẩu mới không khớp' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email không tồn tại' });
    }

    // Check if code exists and is valid
    if (!user.resetPasswordCode || !user.resetPasswordExpires) {
      return res.status(400).json({ message: 'Mã xác nhận không hợp lệ hoặc đã hết hạn' });
    }

    // Check if code matches
    if (user.resetPasswordCode !== code) {
      return res.status(400).json({ message: 'Mã xác nhận không chính xác' });
    }

    // Check if code is expired
    if (new Date() > user.resetPasswordExpires) {
      user.resetPasswordCode = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      return res.status(400).json({ message: 'Mã xác nhận đã hết hạn. Vui lòng yêu cầu mã mới' });
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Log activity
    await ActivityLog.create({
      userId: user._id,
      action: '[Warning] Thực hiện đặt lại mật khẩu',
      ipAddress: req.ip || req.connection.remoteAddress
    });

    res.json({ message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Verify admin login code
router.post('/verify-admin-code', async (req, res) => {
  const { username, code } = req.body;

  try {
    if (!username || !code) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Tên đăng nhập không tồn tại' });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Chức năng này chỉ dành cho Admin' });
    }

    // Check if code exists and is valid
    if (!user.adminLoginCode || !user.adminLoginCodeExpires) {
      return res.status(400).json({ message: 'Mã xác nhận không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại' });
    }

    // Check if code matches
    if (user.adminLoginCode !== code) {
      return res.status(400).json({ message: 'Mã xác nhận không chính xác' });
    }

    // Check if code is expired
    if (new Date() > user.adminLoginCodeExpires) {
      user.adminLoginCode = undefined;
      user.adminLoginCodeExpires = undefined;
      await user.save();
      return res.status(400).json({ message: 'Mã xác nhận đã hết hạn. Vui lòng đăng nhập lại' });
    }

    // Clear the code
    user.adminLoginCode = undefined;
    user.adminLoginCodeExpires = undefined;

    // Update last login and device
    user.lastLogin = new Date();
    user.device = req.headers['user-agent'] || '';
    await user.save();

    // Invalidate all other sessions for admin (force single session)
    // await invalidateAllOtherSessions(user._id, null);

    // Create session and get token
    const token = await createSession(user._id, req);

    // Set httpOnly cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: isProduction,
      // Use 'none' in production to allow cross-site cookie on Render
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    // Log activity
    await ActivityLog.create({
      userId: user._id,
      action: 'Đăng nhập vào website (Admin với 2FA)',
      ipAddress: req.ip || req.connection.remoteAddress
    });

    // Return minimal user info (no token, no email)
    res.json({
      user: {
        id: user._id,
        username: user.username,
        balance: user.balance || 0,
        role: user.role || 'admin'
      }
    });
  } catch (error) {
    console.error('Verify admin code error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get account purchase history
router.get('/account-history', authenticateSession, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // Get orders of type 'account'
    const [orders, total] = await Promise.all([
      Order.find({ 
        userId: req.userId,
        orderType: 'account'
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({ 
        userId: req.userId,
        orderType: 'account'
      })
    ]);

    // Return orders directly - all account info is already saved in items
    // No need to fetch from Account model, so history persists even if account is deleted
    res.json({
      history: orders,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
